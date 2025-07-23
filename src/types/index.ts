export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: string[];
}

export interface ChatRequest {
  input_text: string;
  extra_context?: string;
  config?: Record<string, any>;
}

export interface ChatResponse {
  output_text: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export type LLMProvider = 'openai' | 'anthropic';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}