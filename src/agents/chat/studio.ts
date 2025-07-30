import { createChatAgentGraph } from './graph';
import { ChatAgentConfig } from './state';

// Export the graph factory function for LangGraph Studio
export { createChatAgentGraph };

// Default configuration for the chat agent
export const defaultConfig: ChatAgentConfig = {
  model: 'openai/gpt-4o-mini',
  temperature: 0.7,
  maxTokens: undefined,
  systemPrompt: undefined,
};

// Create a default instance for visualization
export const chatAgent = createChatAgentGraph(defaultConfig);