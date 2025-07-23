import { ApiServer } from './api/server';
import { logger } from './utils/logger.util';
import { initializeLangSmith } from './utils/langsmith.util';

async function main() {
  try {
    logger.info('🚀 Starting Chatbot API Server...');
    
    // Initialize LangSmith tracing
    initializeLangSmith();
    
    const server = new ApiServer();
    await server.start();
  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

main();