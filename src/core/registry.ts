import { AgentBase } from './base/agent.base';
import { AgentMetadata } from '../types';
import { ChatAgent } from '../agents/chat';
import { DatabaseAgentWrapper } from '../agents/database/wrapper';
import { logger } from '../utils/logger.util';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentBase> = new Map();

  private constructor() {
    this.registerDefaultAgents();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  private registerDefaultAgents(): void {
    this.registerAgent(new ChatAgent());
    this.registerAgent(new DatabaseAgentWrapper());
  }

  public registerAgent(agent: AgentBase): void {
    const metadata = agent.getMetadata();
    this.agents.set(metadata.id, agent);
    logger.info(`Registered agent: ${metadata.id}`, metadata);
  }

  public getAgent(agentId: string): AgentBase | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values()).map(agent => agent.getMetadata());
  }

  public getAgentMetadata(agentId: string): AgentMetadata | undefined {
    const agent = this.agents.get(agentId);
    return agent?.getMetadata();
  }

  public hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  public removeAgent(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    if (removed) {
      logger.info(`Removed agent: ${agentId}`);
    }
    return removed;
  }

  public async executeAgent<TInput = any, TOutput = any, TConfig = any>(
    agentId: string,
    input: TInput,
    config?: TConfig
  ): Promise<TOutput> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    logger.info(`Executing agent: ${agentId}`, { input });
    
    try {
      const result = await agent.execute(input, config);
      logger.info(`Agent execution completed: ${agentId}`);
      return result;
    } catch (error) {
      logger.error(`Agent execution failed: ${agentId}`, error);
      throw error;
    }
  }
}

export const agentRegistry = AgentRegistry.getInstance();