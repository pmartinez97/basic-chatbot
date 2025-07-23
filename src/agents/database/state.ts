import { z } from 'zod';
import { Annotation } from "@langchain/langgraph";

// Input schema for database agent
export const DatabaseAgentInputSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  table_context: z.string().optional().describe('Optional context about tables to query'),
  max_results: z.number().positive().optional().default(100).describe('Maximum number of results to return'),
});

// Output schema for database agent
export const DatabaseAgentOutputSchema = z.object({
  sql_query: z.string().describe('Generated SQL query'),
  results: z.array(z.record(z.string(), z.any())).describe('Query results'),
  row_count: z.number().describe('Number of rows returned'),
  execution_time: z.number().describe('Query execution time in milliseconds'),
  explanation: z.string().describe('Human-readable explanation of the results'),
});

// Configuration schema for database agent
export const DatabaseAgentConfigSchema = z.object({
  model: z.string().default('openai/gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.1), // Lower temperature for SQL generation
  max_tokens: z.number().positive().optional(),
  allow_write_operations: z.boolean().default(false).describe('Allow INSERT, UPDATE, DELETE operations'),
  max_execution_time: z.number().positive().default(30000).describe('Max query execution time in ms'),
});

// Type definitions
export type DatabaseAgentInput = z.infer<typeof DatabaseAgentInputSchema>;
export type DatabaseAgentOutput = z.infer<typeof DatabaseAgentOutputSchema>;
export type DatabaseAgentConfig = z.infer<typeof DatabaseAgentConfigSchema>;

// LangGraph State Annotation - proper LangGraph state management
export const DatabaseAgentStateAnnotation = Annotation.Root({
  input: Annotation<DatabaseAgentInput>({
    reducer: (_, update) => update,
  }),
  sql_query: Annotation<string | undefined>({
    reducer: (_, update) => update,
  }),
  results: Annotation<any[] | undefined>({
    reducer: (_, update) => update,
  }),
  row_count: Annotation<number | undefined>({
    reducer: (_, update) => update,
  }),
  execution_time: Annotation<number | undefined>({
    reducer: (_, update) => update,
  }),
  explanation: Annotation<string | undefined>({
    reducer: (_, update) => update,
  }),
  schema_context: Annotation<string | undefined>({
    reducer: (_, update) => update,
  }),
  error: Annotation<string | undefined>({
    reducer: (_, update) => update,
  }),
});

export type DatabaseAgentState = typeof DatabaseAgentStateAnnotation.State;