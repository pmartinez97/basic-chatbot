import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateEnvironment } from '../utils/config.util';
import { logger } from '../utils/logger.util';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import agentsRouter from './routes/agents.route';
import databaseRouter from './routes/database.route';

export class ApiServer {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // API routes
    this.app.use('/api/agents', agentsRouter);
    this.app.use('/api/database', databaseRouter);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'Chatbot API Server',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          agents: '/api/agents',
          database: '/api/database',
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler (must be before error handler)
    this.app.use(notFoundHandler);
    
    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Validate environment before starting
      validateEnvironment();

      // Create logs directory if it doesn't exist
      const fs = await import('fs');
      const path = await import('path');
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Start server
      this.server = this.app.listen(config.port, () => {
        logger.info(`🚀 Server running on port ${config.port}`, {
          port: config.port,
          environment: config.nodeEnv,
        });
        
        logger.info('📍 Available endpoints:', {
          health: `http://localhost:${config.port}/health`,
          agents: `http://localhost:${config.port}/api/agents`,
          database: `http://localhost:${config.port}/api/database`,
          root: `http://localhost:${config.port}/`,
        });
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('🔄 Shutting down server...');
    
    if (this.server) {
      this.server.close(() => {
        logger.info('✅ Server shut down successfully');
        process.exit(0);
      });
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}