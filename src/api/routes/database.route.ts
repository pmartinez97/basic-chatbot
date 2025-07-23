import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.middleware';
import { ApiResponse } from '../../types';
import { logger } from '../../utils/logger.util';
import { createDatabaseAgent } from '../../agents/database';

const router = Router();

// Schema for database query request
const DatabaseQueryRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  table_context: z.string().optional(),
  max_results: z.number().positive().optional().default(100),
  config: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    allow_write_operations: z.boolean().optional(),
    max_execution_time: z.number().positive().optional(),
  }).optional(),
});

type DatabaseQueryRequest = z.infer<typeof DatabaseQueryRequestSchema>;

// POST /api/database/query - Execute database query
router.post('/query', 
  validateBody(DatabaseQueryRequestSchema),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { query, table_context, max_results, config } = req.body as DatabaseQueryRequest;
      
      logger.info('Database query request received', { 
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        max_results 
      });

      // Create database agent with optional configuration
      const databaseAgent = createDatabaseAgent(config || {});

      // Process the query
      const result = await databaseAgent.processQuery({
        query,
        table_context,
        max_results
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Database query failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      res.status(500).json({
        success: false,
        error: `Database query failed: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

// GET /api/database/schema - Get database schema
router.get('/schema', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    logger.info('Database schema request received');

    const databaseAgent = createDatabaseAgent();
    const schema = await databaseAgent.getSchema();

    res.json({
      success: true,
      data: { schema },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to retrieve database schema:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: `Failed to retrieve database schema: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/database/test - Test database connection
router.get('/test', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    logger.info('Database connection test request received');

    const databaseAgent = createDatabaseAgent();
    const isConnected = await databaseAgent.testConnection();

    res.json({
      success: true,
      data: { 
        connected: isConnected,
        message: isConnected ? 'Database connection successful' : 'Database connection failed'
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Database connection test failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: `Database connection test failed: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/database/graph - Get database agent workflow graph
router.get('/graph', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    logger.info('Database agent graph request received');

    const databaseAgent = createDatabaseAgent();
    const graphData = databaseAgent.getGraphMetadata();

    res.json({
      success: true,
      data: {
        agentId: 'database_agent',
        graph: graphData,
        generatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to retrieve database agent graph:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: `Failed to retrieve database agent graph: ${errorMessage}`,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;