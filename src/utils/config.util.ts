import * as dotenv from 'dotenv';
import { z } from 'zod';
import { LLMConfig, LLMProvider } from '../types';

dotenv.config();

const ConfigSchema = z.object({
  port: z.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  tavilyApiKey: z.string().optional(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // LangSmith configuration
  langsmithApiKey: z.string().optional(),
  langsmithProject: z.string().default('bot-chat-llm'),
  langsmithTracing: z.boolean().default(false),
  
  // LangGraph Studio configuration
  langchainApiKey: z.string().optional(),
  langchainProject: z.string().default('bot-chat-llm'),
  langchainTracingV2: z.boolean().default(false),
  langchainEndpoint: z.string().default('https://api.smith.langchain.com'),
  langgraphApiPort: z.number().default(3001),
  
  // Database configuration
  databaseUrl: z.string().default('sqlite:./data/app.db'),
  databaseType: z.string().default('sqlite'),
});

export type Config = z.infer<typeof ConfigSchema>;

export const config: Config = ConfigSchema.parse({
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  tavilyApiKey: process.env.TAVILY_API_KEY,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // LangSmith configuration
  langsmithApiKey: process.env.LANGSMITH_API_KEY,
  langsmithProject: process.env.LANGSMITH_PROJECT || 'bot-chat-llm',
  langsmithTracing: process.env.LANGSMITH_TRACING === 'true',
  
  // LangGraph Studio configuration
  langchainApiKey: process.env.LANGCHAIN_API_KEY || process.env.LANGSMITH_API_KEY,
  langchainProject: process.env.LANGCHAIN_PROJECT || process.env.LANGSMITH_PROJECT || 'bot-chat-llm',
  langchainTracingV2: process.env.LANGCHAIN_TRACING_V2 === 'true',
  langchainEndpoint: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
  langgraphApiPort: Number(process.env.LANGGRAPH_API_PORT) || 3001,
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL || 'sqlite:./data/app.db',
  databaseType: process.env.DATABASE_TYPE || 'sqlite',
});

export function getLLMConfig(modelString: string): LLMConfig {
  const [provider, model] = modelString.split('/') as [LLMProvider, string];
  
  if (!provider || !model) {
    throw new Error(`Invalid model string format: ${modelString}. Expected format: provider/model`);
  }

  if (provider === 'openai' && !config.openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  if (provider === 'anthropic' && !config.anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }

  return {
    provider,
    model,
    temperature: 0.7,
  };
}

export function validateEnvironment(): void {
  const errors: string[] = [];

  if (!config.openaiApiKey && !config.anthropicApiKey) {
    errors.push('At least one LLM provider API key must be configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}