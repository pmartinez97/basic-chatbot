import { z } from 'zod';
import { AgentStateBase } from '../../core/base/agent.base';

export const ChatAgentInputSchema = z.object({
  input_text: z.string().min(1, 'Input text is required'),
  extra_context: z.string().optional(),
});

export const ChatAgentOutputSchema = z.object({
  output_text: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const ChatAgentConfigSchema = z.object({
  model: z.string().default('openai/gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().optional(),
  systemPrompt: z.string().optional(),
});

export type ChatAgentInput = z.infer<typeof ChatAgentInputSchema>;
export type ChatAgentOutput = z.infer<typeof ChatAgentOutputSchema>;
export type ChatAgentConfig = z.infer<typeof ChatAgentConfigSchema>;

// LangGraph compatible state interface
export interface ChatAgentStateInterface {
  input: ChatAgentInput;
  messages: any[];
  iterationCount: number;
  isComplete: boolean;
  nodeHistory?: string[];
  startTime?: number;
  currentNode?: string;
}

export class ChatAgentState extends AgentStateBase implements ChatAgentStateInterface {
  public input: ChatAgentInput;
  public messages: any[] = [];
  public iterationCount: number = 0;
  public isComplete: boolean = false;
  public nodeHistory: string[] = [];
  public startTime: number;
  public currentNode?: string;

  constructor(input: ChatAgentInput) {
    super();
    this.input = input;
    this.startTime = Date.now();
  }

  // LangGraph state reducer - defines how state updates are merged
  static reducer(currentState: ChatAgentStateInterface, update: Partial<ChatAgentStateInterface>): ChatAgentStateInterface {
    return {
      ...currentState,
      ...update,
      // Special handling for arrays - concatenate instead of replace
      messages: update.messages || currentState.messages,
      nodeHistory: update.nodeHistory ? 
        [...(currentState.nodeHistory || []), ...update.nodeHistory] : 
        currentState.nodeHistory || [],
    };
  }

  // Track node execution
  enterNode(nodeName: string): void {
    this.currentNode = nodeName;
    this.nodeHistory = [...(this.nodeHistory || []), nodeName];
  }

  exitNode(): void {
    this.currentNode = undefined;
  }

  // Get execution metrics
  getExecutionTime(): number {
    return Date.now() - this.startTime;
  }

  toJSON(): Record<string, any> {
    return {
      input: this.input,
      messages: this.messages,
      iterationCount: this.iterationCount,
      isComplete: this.isComplete,
      nodeHistory: this.nodeHistory,
      startTime: this.startTime,
      currentNode: this.currentNode,
      executionTime: this.getExecutionTime(),
    };
  }

  fromJSON(data: Record<string, any>): void {
    this.input = data.input;
    this.messages = data.messages || [];
    this.iterationCount = data.iterationCount || 0;
    this.isComplete = data.isComplete || false;
    this.nodeHistory = data.nodeHistory || [];
    this.startTime = data.startTime || Date.now();
    this.currentNode = data.currentNode;
  }
}