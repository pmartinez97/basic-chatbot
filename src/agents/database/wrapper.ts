import { AgentBase } from '../../core/base/agent.base';
import { AgentMetadata } from '../../types';
import { 
  DatabaseAgentInput, 
  DatabaseAgentOutput, 
  DatabaseAgentConfig,
  DatabaseAgentInputSchema,
  DatabaseAgentOutputSchema,
  DatabaseAgentConfigSchema
} from './state';
import { createDatabaseAgent } from './index';
import { logger } from '../../utils/logger.util';

/**
 * Wrapper class for DatabaseAgent to integrate with the agent registry system
 */
export class DatabaseAgentWrapper extends AgentBase<DatabaseAgentInput, DatabaseAgentOutput, DatabaseAgentConfig> {
  protected metadata: AgentMetadata = {
    id: 'database_agent',
    name: 'Database Agent',
    description: 'Natural language to SQL conversion and database query execution agent',
    version: '1.0.0',
    capabilities: [
      'Natural language to SQL conversion',
      'Safe database query execution',
      'Schema analysis and understanding',
      'Result formatting and explanation',
      'Read-only operations by default'
    ],
  };

  protected inputSchema = DatabaseAgentInputSchema;
  protected outputSchema = DatabaseAgentOutputSchema;
  protected configSchema = DatabaseAgentConfigSchema;

  async execute(input: DatabaseAgentInput, config?: DatabaseAgentConfig): Promise<DatabaseAgentOutput> {
    try {
      logger.info('DatabaseAgentWrapper executing query', { 
        query: input.query.substring(0, 100) + (input.query.length > 100 ? '...' : ''),
        maxResults: input.max_results 
      });

      // Validate input
      const validatedInput = this.validateInput(input);
      
      // Validate config if provided
      const validatedConfig = config ? this.validateConfig(config) : {};

      // Create and execute database agent
      const databaseAgent = createDatabaseAgent(validatedConfig);
      const result = await databaseAgent.processQuery(validatedInput);

      // Validate output
      const validatedOutput = this.validateOutput(result);

      logger.info('DatabaseAgentWrapper execution completed', {
        rowCount: validatedOutput.row_count,
        executionTime: validatedOutput.execution_time
      });

      return validatedOutput;

    } catch (error) {
      logger.error('DatabaseAgentWrapper execution failed:', error);
      throw error;
    }
  }
}