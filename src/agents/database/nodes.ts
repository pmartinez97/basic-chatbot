import { DatabaseAgentState, DatabaseAgentConfig } from './state';
import { DatabaseAgentPrompts } from './prompts';
import { DatabaseFactory } from './database';
import { createLLM } from '../../utils/llm.util';
import { logger } from '../../utils/logger.util';
import { withTracing } from '../../utils/langsmith.util';

/**
 * Analyze database schema and provide context for query generation
 */
export async function analyzeSchemaNode(
  state: DatabaseAgentState,
  config: { configurable?: DatabaseAgentConfig } = {}
): Promise<Partial<DatabaseAgentState>> {
  return withTracing(
    'database_agent.analyze_schema',
    { query: state.input.query },
    async () => {
      try {
        const agentConfig = config.configurable || {
          model: 'openai/gpt-4o-mini',
          temperature: 0.1,
          allow_write_operations: false,
          max_execution_time: 30000,
        };
        
        logger.info('Starting schema analysis', { query: state.input.query });

        // Get database connection
        const db = await DatabaseFactory.getConnection();
        const schema = await db.getSchema();

        // Generate schema analysis using LLM
        const llm = createLLM({
          provider: agentConfig.model.split('/')[0] as any,
          model: agentConfig.model.split('/')[1],
          temperature: agentConfig.temperature,
        });

        const prompt = DatabaseAgentPrompts.formatSchemaAnalysis(
          schema,
          state.input.query
        );

        const response = await llm.invoke([
          { role: 'system', content: DatabaseAgentPrompts.getSystemMessage() },
          { role: 'user', content: prompt }
        ]);

        const schemaContext = response.content as string;

        logger.info('Schema analysis completed', {
          schemaLength: schema.length,
          contextLength: schemaContext.length
        });

        return {
          schema_context: schemaContext,
        };

      } catch (error) {
        logger.error('Schema analysis failed:', error);
        return {
          error: `Schema analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }
  );
}

/**
 * Generate SQL query based on user request and schema context
 */
export async function generateSqlNode(
  state: DatabaseAgentState,
  config: { configurable?: DatabaseAgentConfig } = {}
): Promise<Partial<DatabaseAgentState>> {
  return withTracing(
    'database_agent.generate_sql',
    { 
      query: state.input.query,
      hasSchemaContext: !!state.schema_context 
    },
    async () => {
      try {
        const agentConfig = config.configurable || {
          model: 'openai/gpt-4o-mini',
          temperature: 0.1,
          allow_write_operations: false,
          max_execution_time: 30000,
        };
        
        logger.info('Starting SQL generation', { query: state.input.query });

        if (!state.schema_context) {
          throw new Error('Schema context is missing');
        }

        // Create LLM for SQL generation
        const llm = createLLM({
          provider: agentConfig.model.split('/')[0] as any,
          model: agentConfig.model.split('/')[1],
          temperature: agentConfig.temperature,
        });

        const prompt = DatabaseAgentPrompts.formatSqlGeneration(
          state.schema_context,
          state.input.query,
          state.input.table_context || '',
          state.input.max_results || 100
        );

        const response = await llm.invoke([
          { role: 'system', content: DatabaseAgentPrompts.getSystemMessage() },
          { role: 'user', content: prompt }
        ]);

        let sqlQuery = (response.content as string).trim();

        // Clean up SQL query (remove markdown formatting if present)
        if (sqlQuery.startsWith('```sql')) {
          sqlQuery = sqlQuery.replace(/```sql\n?/, '').replace(/\n?```$/, '');
        } else if (sqlQuery.startsWith('```')) {
          sqlQuery = sqlQuery.replace(/```\n?/, '').replace(/\n?```$/, '');
        }

        // Safety check for write operations
        if (!agentConfig.allow_write_operations) {
          const safeSql = sqlQuery.toLowerCase().trim();
          const writeOperations = ['insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate'];
          const hasWriteOperation = writeOperations.some(op => safeSql.startsWith(op));
          
          if (hasWriteOperation) {
            throw new Error('Write operations are not allowed in current configuration');
          }
        }

        logger.info('SQL generation completed', {
          sqlLength: sqlQuery.length,
          query: sqlQuery.substring(0, 100) + (sqlQuery.length > 100 ? '...' : '')
        });

        return {
          sql_query: sqlQuery,
        };

      } catch (error) {
        logger.error('SQL generation failed:', error);
        return {
          error: `SQL generation failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }
  );
}

/**
 * Execute the generated SQL query safely
 */
export async function executeQueryNode(
  state: DatabaseAgentState,
  config: { configurable?: DatabaseAgentConfig } = {}
): Promise<Partial<DatabaseAgentState>> {
  return withTracing(
    'database_agent.execute_query',
    { 
      sqlQuery: state.sql_query,
      maxResults: state.input.max_results 
    },
    async () => {
      try {
        const agentConfig = config.configurable || {
          model: 'openai/gpt-4o-mini',
          temperature: 0.1,
          allow_write_operations: false,
          max_execution_time: 30000,
        };
        
        logger.info('Starting query execution', { 
          sql: state.sql_query?.substring(0, 100) + (state.sql_query && state.sql_query.length > 100 ? '...' : '')
        });

        if (!state.sql_query) {
          throw new Error('SQL query is missing');
        }

        // Get database connection
        const db = await DatabaseFactory.getConnection();

        // Execute query with timeout
        const startTime = Date.now();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query execution timeout')), agentConfig.max_execution_time);
        });

        const queryPromise = db.query(state.sql_query);
        const results = await Promise.race([queryPromise, timeoutPromise]) as any[];
        const executionTime = Date.now() - startTime;

        // Apply max_results limit if needed
        const limitedResults = results.slice(0, state.input.max_results || 100);
        const rowCount = limitedResults.length;

        logger.info('Query execution completed', {
          rowCount,
          executionTime,
          wasLimited: limitedResults.length < results.length
        });

        return {
          results: limitedResults,
          row_count: rowCount,
          execution_time: executionTime,
        };

      } catch (error) {
        logger.error('Query execution failed:', error);
        return {
          error: `Query execution failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }
  );
}

/**
 * Format query results into human-readable explanation
 */
export async function formatResultsNode(
  state: DatabaseAgentState,
  config: { configurable?: DatabaseAgentConfig } = {}
): Promise<Partial<DatabaseAgentState>> {
  return withTracing(
    'database_agent.format_results',
    { 
      rowCount: state.row_count,
      executionTime: state.execution_time 
    },
    async () => {
      try {
        const agentConfig = config.configurable || {
          model: 'openai/gpt-4o-mini',
          temperature: 0.1,
          allow_write_operations: false,
          max_execution_time: 30000,
        };
        
        logger.info('Starting results formatting', {
          rowCount: state.row_count,
          executionTime: state.execution_time
        });

        if (!state.results || !state.sql_query) {
          throw new Error('Results or SQL query is missing');
        }

        // Create LLM for result formatting
        const llm = createLLM({
          provider: agentConfig.model.split('/')[0] as any,
          model: agentConfig.model.split('/')[1],
          temperature: agentConfig.temperature,
        });

        // Prepare results data for formatting
        const resultsData = state.results.length > 0
          ? JSON.stringify(state.results, null, 2)
          : 'No results found';

        const prompt = DatabaseAgentPrompts.formatResultExplanation(
          state.input.query,
          state.sql_query,
          state.row_count || 0,
          state.execution_time || 0,
          resultsData
        );

        const response = await llm.invoke([
          { role: 'system', content: DatabaseAgentPrompts.getSystemMessage() },
          { role: 'user', content: prompt }
        ]);

        const explanation = response.content as string;

        logger.info('Results formatting completed', {
          explanationLength: explanation.length
        });

        return {
          explanation,
        };

      } catch (error) {
        logger.error('Results formatting failed:', error);
        return {
          error: `Results formatting failed: ${error instanceof Error ? error.message : String(error)}`,
          explanation: 'Failed to format results, but query executed successfully.',
        };
      }
    }
  );
}

/**
 * Finalize the database agent execution
 */
export async function finalizeNode(
  state: DatabaseAgentState
): Promise<Partial<DatabaseAgentState>> {
  return withTracing(
    'database_agent.finalize',
    { 
      hasError: !!state.error
    },
    async () => {
      try {
        logger.info('Database agent execution completed', {
          success: !state.error
        });

        return {};

      } catch (error) {
        logger.error('Finalization failed:', error);
        return {
          error: `Finalization failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }
  );
}