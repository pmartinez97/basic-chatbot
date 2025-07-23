import { z } from 'zod';
import { AgentMetadata, LLMConfig } from '../../types';

export abstract class AgentBase<TInput = any, TOutput = any, TConfig = any> {
  protected abstract metadata: AgentMetadata;
  protected abstract inputSchema: z.ZodSchema<TInput>;
  protected abstract outputSchema: z.ZodSchema<TOutput>;
  protected abstract configSchema: z.ZodSchema<TConfig>;

  abstract execute(input: TInput, config?: TConfig): Promise<TOutput>;

  getMetadata(): AgentMetadata {
    return this.metadata;
  }

  validateInput(input: unknown): TInput {
    return this.inputSchema.parse(input);
  }

  validateOutput(output: unknown): TOutput {
    return this.outputSchema.parse(output);
  }

  validateConfig(config: unknown): TConfig {
    return this.configSchema.parse(config);
  }
}

export abstract class AgentConfigurationBase {
  abstract llm: LLMConfig;
  abstract validate(): boolean;
}

export abstract class AgentStateBase {
  abstract toJSON(): Record<string, any>;
  abstract fromJSON(data: Record<string, any>): void;
}