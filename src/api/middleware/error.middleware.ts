import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../utils/logger.util';
import { ApiResponse } from '../../types';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error: ' + error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (error.message.includes('API key')) {
    res.status(401).json({
      success: false,
      error: 'Authentication error: Invalid or missing API key',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
}

export function notFoundHandler(req: Request, res: Response<ApiResponse>): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
}