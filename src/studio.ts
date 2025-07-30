/**
 * Main export file for LangGraph Studio
 * This file exposes all graphs for visualization and execution
 */

export { createChatAgentGraph, chatAgent } from './agents/chat/studio';
export { createDatabaseAgentGraph, databaseAgent } from './agents/database/studio';

// Graph metadata for Studio UI
export const graphs = {
  chat_agent: {
    name: 'Chat Agent',
    description: 'Conversational AI agent with web search and database tools',
    factory: 'createChatAgentGraph',
    instance: 'chatAgent',
    category: 'conversation',
    tags: ['chat', 'tools', 'web-search', 'database'],
  },
  database_agent: {
    name: 'Database Agent', 
    description: 'Natural language to SQL conversion and database query agent',
    factory: 'createDatabaseAgentGraph',
    instance: 'databaseAgent',
    category: 'data',
    tags: ['database', 'sql', 'query', 'analysis'],
  },
};