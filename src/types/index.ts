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
  thread_id?: string; // For memory persistence across conversations
}

export interface ChatResponse {
  output_text: string;
  metadata?: Record<string, any>;
}

// Human-in-the-loop types (simplified, leveraging LangGraph native types)
export interface HumanInterruptRequest {
  type: 'human_assistance';
  request_type: 'approval' | 'guidance' | 'custom_input' | 'quality_review';
  message: string;
  context?: string;
  options?: string[];
  urgency: 'low' | 'normal' | 'high';
  timestamp: string;
  interrupt_id?: string;
}

export interface ChatResponseWithInterrupt extends ChatResponse {
  is_interrupted: boolean;
  interrupt_request?: HumanInterruptRequest;
  next_steps?: string[];
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