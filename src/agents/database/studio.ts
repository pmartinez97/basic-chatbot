import { createDatabaseAgentGraph } from './graph';
import { DatabaseAgentConfig } from './state';

// Export the graph factory function for LangGraph Studio
export { createDatabaseAgentGraph };

// Default configuration for the database agent
export const defaultConfig: DatabaseAgentConfig = {
  model: 'openai/gpt-4o-mini',
  temperature: 0.1,
  max_tokens: undefined,
  allow_write_operations: false,
  max_execution_time: 30000,
};

// Create a default instance for visualization
export const databaseAgent = createDatabaseAgentGraph(defaultConfig);