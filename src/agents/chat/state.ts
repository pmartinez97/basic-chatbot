import { z } from 'zod';
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

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
  thread_id: z.string().optional(), // For memory persistence
});

export type ChatAgentInput = z.infer<typeof ChatAgentInputSchema>;
export type ChatAgentOutput = z.infer<typeof ChatAgentOutputSchema>;
export type ChatAgentConfig = z.infer<typeof ChatAgentConfigSchema>;

// LangGraph State Annotation - proper LangGraph state management
export const ChatAgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  input: Annotation<ChatAgentInput>({
    reducer: (_, update) => update,
  }),
  iterationCount: Annotation<number>({
    default: () => 0,
    reducer: (current, update) => update,
  }),
  isComplete: Annotation<boolean>({
    default: () => false,
    reducer: (_, update) => update,
  }),
  extra_context: Annotation<string | undefined>({
    reducer: (_, update) => update,
  }),
});

export type ChatAgentState = typeof ChatAgentStateAnnotation.State;