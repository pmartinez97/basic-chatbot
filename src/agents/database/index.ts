import { 
  DatabaseAgentInput, 
  DatabaseAgentOutput, 
  DatabaseAgentConfig, 
  DatabaseAgentInputSchema, 
  DatabaseAgentOutputSchema, 
  DatabaseAgentConfigSchema
} from './state';
import { createDatabaseAgentGraph } from './graph';
import { initializeLangSmith } from '../../utils/langsmith.util';
import { logger } from '../../utils/logger.util';
import { withTracing } from '../../utils/langsmith.util';

/**
 * Main Database Agent class
 * Handles natural language to SQL conversion and query execution
 */
export class DatabaseAgent {
  private config: DatabaseAgentConfig;

  constructor(config: Partial<DatabaseAgentConfig> = {}) {
    // Validate and set configuration
    this.config = DatabaseAgentConfigSchema.parse(config);
    
    // Initialize LangSmith tracing
    initializeLangSmith();
    
    logger.info('DatabaseAgent initialized', {
      model: this.config.model,
      temperature: this.config.temperature,
      allowWriteOperations: this.config.allow_write_operations
    });
  }

  /**
   * Process a database query request
   */
  async processQuery(input: DatabaseAgentInput): Promise<DatabaseAgentOutput> {
    return withTracing(
      'database_agent.process_query',
      { 
        query: input.query,
        tableContext: input.table_context,
        maxResults: input.max_results 
      },
      async () => {
        logger.info('Processing database query', { 
          query: input.query,
          maxResults: input.max_results 
        });

        try {
          // Validate input
          const validatedInput = DatabaseAgentInputSchema.parse(input);

          // Create initial state for LangGraph
          const initialState = {
            input: validatedInput,
          };

          // Create and execute graph
          const graph = createDatabaseAgentGraph(this.config);
          const finalState = await graph.invoke(initialState, {
            configurable: this.config
          });

          // Handle execution errors
          if (finalState.error) {
            throw new Error(finalState.error);
          }

          // Validate and return output
          const output: DatabaseAgentOutput = {
            sql_query: finalState.sql_query || '',
            results: finalState.results || [],
            row_count: finalState.row_count || 0,
            execution_time: finalState.execution_time || 0,
            explanation: finalState.explanation || 'Query completed successfully'
          };

          const validatedOutput = DatabaseAgentOutputSchema.parse(output);

          logger.info('Database query processed successfully', {
            rowCount: validatedOutput.row_count,
            executionTime: validatedOutput.execution_time
          });

          return validatedOutput;

        } catch (error) {
          logger.error('Database query processing failed:', error);
          
          // Return error output structure
          const errorOutput: DatabaseAgentOutput = {
            sql_query: '',
            results: [],
            row_count: 0,
            execution_time: 0,
            explanation: `Query failed: ${error instanceof Error ? error.message : String(error)}`
          };

          return errorOutput;
        }
      }
    );
  }

  /**
   * Get database schema information
   */
  async getSchema(): Promise<string> {
    return withTracing(
      'database_agent.get_schema',
      {},
      async () => {
        try {
          logger.info('Retrieving database schema');
          
          const { DatabaseFactory } = await import('./database');
          const db = await DatabaseFactory.getConnection();
          const schema = await db.getSchema();

          logger.info('Database schema retrieved successfully', {
            schemaLength: schema.length
          });

          return schema;
        } catch (error) {
          logger.error('Failed to retrieve database schema:', error);
          throw new Error(`Schema retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    );
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    return withTracing(
      'database_agent.test_connection',
      {},
      async () => {
        try {
          logger.info('Testing database connection');
          
          const { DatabaseFactory } = await import('./database');
          const db = await DatabaseFactory.getConnection();
          
          // Simple test query
          await db.query('SELECT 1 as test');
          
          logger.info('Database connection test successful');
          return true;
        } catch (error) {
          logger.error('Database connection test failed:', error);
          return false;
        }
      }
    );
  }

  /**
   * Get graph metadata for visualization
   */
  getGraphMetadata() {
    const { getGraphMetadata } = require('./graph');
    return getGraphMetadata();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DatabaseAgentConfig>): void {
    this.config = DatabaseAgentConfigSchema.parse({
      ...this.config,
      ...newConfig
    });

    logger.info('DatabaseAgent configuration updated', {
      model: this.config.model,
      temperature: this.config.temperature,
      allowWriteOperations: this.config.allow_write_operations
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): DatabaseAgentConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create DatabaseAgent instance
 */
export function createDatabaseAgent(config: Partial<DatabaseAgentConfig> = {}): DatabaseAgent {
  return new DatabaseAgent(config);
}

/**
 * Default export
 */
export default DatabaseAgent;