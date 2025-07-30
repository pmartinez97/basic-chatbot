import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { ApiResponse } from '../../types';
import { logger } from '../../utils/logger.util';
import { agentRegistry } from '../../core/registry';

const router = Router();

// Schemas for validation
const ThreadParamsSchema = z.object({
  agent_id: z.string().min(1, 'Agent ID is required'),
  thread_id: z.string().min(1, 'Thread ID is required'),
});

const ResumeRequestSchema = z.object({
  human_response: z.string().min(1, 'Human response is required'),
  metadata: z.record(z.string(), z.any()).optional(),
});

// POST /api/interrupts/agents/:agent_id/threads/:thread_id/resume - Resume interrupted thread
router.post('/agents/:agent_id/threads/:thread_id/resume',
  validateParams(ThreadParamsSchema),
  validateBody(ResumeRequestSchema),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { agent_id, thread_id } = req.params;
      const { human_response, metadata } = req.body;

      if (!agentRegistry.hasAgent(agent_id)) {
        return res.status(404).json({
          success: false,
          error: `Agent not found: ${agent_id}`,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info('Resuming interrupted thread with LangGraph native APIs', { 
        agent_id, 
        thread_id, 
        response_length: human_response.length 
      });

      // Get the agent and use its native resume functionality
      const agent = agentRegistry.getAgent(agent_id);
      
      // Check if agent has resume capability (ChatAgent should have it)
      if (!agent || typeof (agent as any).resumeExecution !== 'function') {
        return res.status(400).json({
          success: false,
          error: `Agent ${agent_id} does not support resume functionality`,
          timestamp: new Date().toISOString(),
        });
      }

      // Resume execution using the agent's native method
      const result = await (agent as any).resumeExecution(thread_id, human_response, { thread_id });

      res.json({
        success: true,
        data: {
          ...result,
          metadata: {
            ...result.metadata,
            ...metadata,
          }
        },
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Error resuming interrupted thread:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to resume interrupted thread',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export default router;