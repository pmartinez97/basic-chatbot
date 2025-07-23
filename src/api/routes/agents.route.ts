import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { agentRegistry } from '../../core/registry';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import { ApiResponse, ChatRequest, ChatResponse } from '../../types';
import { logger } from '../../utils/logger.util';
import { getGraphMetadata } from '../../agents/chat/graph';

const router = Router();

// Schemas for validation
const AgentParamsSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
});

const ChatRequestSchema = z.object({
  input_text: z.string().min(1, 'Input text is required'),
  extra_context: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

// GET /api/agents - List all available agents
router.get('/', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const agents = agentRegistry.getAllAgents();
    
    res.json({
      success: true,
      data: agents,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error listing agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agents',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/agents/:id - Get specific agent metadata
router.get('/:id', validateParams(AgentParamsSchema), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const metadata = agentRegistry.getAgentMetadata(id);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${id}`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting agent metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent metadata',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/agents/:id/graph - Get agent workflow graph
router.get('/:id/graph', validateParams(AgentParamsSchema), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    
    if (!agentRegistry.hasAgent(id)) {
      return res.status(404).json({
        success: false,
        error: `Agent not found: ${id}`,
        timestamp: new Date().toISOString(),
      });
    }

    // For now, only chat_agent supports graph visualization
    if (id === 'chat_agent') {
      const graphData = getGraphMetadata();
      
      res.json({
        success: true,
        data: {
          agentId: id,
          graph: graphData,
          generatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(501).json({
        success: false,
        error: `Graph visualization not yet implemented for agent: ${id}`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Error getting agent graph:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent graph',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/agents/:id/chat - Execute chat with specific agent
router.post('/:id/chat', 
  validateParams(AgentParamsSchema),
  validateBody(ChatRequestSchema),
  async (req: Request, res: Response<ApiResponse<ChatResponse>>) => {
    try {
      const { id } = req.params;
      const { input_text, extra_context, config } = req.body as ChatRequest;

      if (!agentRegistry.hasAgent(id)) {
        return res.status(404).json({
          success: false,
          error: `Agent not found: ${id}`,
          timestamp: new Date().toISOString(),
        });
      }

      const input = { input_text, extra_context };
      const result = await agentRegistry.executeAgent(id, input, config);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error executing agent:', error);
      
      if (error instanceof Error && error.message.includes('API key')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication error: Invalid or missing API key configuration',
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to execute agent',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export default router;