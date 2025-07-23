import { Client } from 'langsmith';
import { config } from './config.util';
import { logger } from './logger.util';

// Global LangSmith client instance
let langsmithClient: Client | null = null;

/**
 * Initialize LangSmith client with configuration
 */
export function initializeLangSmith(): Client | null {
  if (!config.langsmithApiKey) {
    logger.info('LangSmith API key not provided, tracing disabled');
    return null;
  }

  if (!langsmithClient) {
    try {
      langsmithClient = new Client({
        apiKey: config.langsmithApiKey,
        apiUrl: 'https://api.smith.langchain.com',
      });

      // Set environment variables for LangChain tracing
      process.env.LANGCHAIN_TRACING = config.langsmithTracing ? 'true' : 'false';
      process.env.LANGCHAIN_PROJECT = config.langsmithProject;
      process.env.LANGCHAIN_API_KEY = config.langsmithApiKey;

      logger.info('LangSmith tracing initialized', {
        project: config.langsmithProject,
        tracing: config.langsmithTracing
      });
    } catch (error) {
      logger.error('Failed to initialize LangSmith client:', error);
      langsmithClient = null;
    }
  }

  return langsmithClient;
}

/**
 * Get the initialized LangSmith client
 */
export function getLangSmithClient(): Client | null {
  return langsmithClient || initializeLangSmith();
}

/**
 * Create a run in LangSmith for tracking
 */
export async function createRun(
  name: string,
  runType: 'llm' | 'chain' | 'tool' | 'retriever',
  inputs: Record<string, any>,
  sessionId?: string
): Promise<string | null> {
  const client = getLangSmithClient();
  if (!client || !config.langsmithTracing) {
    return null;
  }

  try {
    const run = await client.createRun({
      name,
      run_type: runType,
      inputs,
      project_name: config.langsmithProject,
    });
    
    return (run as any)?.id || null;
  } catch (error) {
    logger.error('Failed to create LangSmith run:', error);
    return null;
  }
}

/**
 * End a run in LangSmith with outputs
 */
export async function endRun(
  runId: string,
  outputs: Record<string, any>,
  error?: string
): Promise<void> {
  const client = getLangSmithClient();
  if (!client || !config.langsmithTracing || !runId) {
    return;
  }

  try {
    await client.updateRun(runId, {
      outputs,
      error: error || undefined,
      end_time: Date.now(),
    });
  } catch (updateError) {
    logger.error('Failed to end LangSmith run:', updateError);
  }
}

/**
 * Log an event to LangSmith
 */
export async function logEvent(
  runId: string,
  name: string,
  data: Record<string, any>
): Promise<void> {
  const client = getLangSmithClient();
  if (!client || !config.langsmithTracing || !runId) {
    return;
  }

  try {
    await client.createRun({
      name,
      run_type: 'tool',
      inputs: data,
      project_name: config.langsmithProject,
      parent_run_id: runId,
      start_time: Date.now(),
      end_time: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to log event to LangSmith:', error);
  }
}

/**
 * Decorator for tracing function calls
 */
export function traceable<T extends (...args: any[]) => any>(
  name: string,
  runType: 'llm' | 'chain' | 'tool' | 'retriever' = 'tool'
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      const runId = await createRun(
        `${name}.${propertyKey}`,
        runType,
        { args: args.length > 0 ? args[0] : {} }
      );

      try {
        const result = await originalMethod.apply(this, args);
        
        if (runId) {
          await endRun(runId, { result });
        }
        
        return result;
      } catch (error) {
        if (runId) {
          await endRun(runId, {}, error instanceof Error ? error.message : String(error));
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Simple wrapper for tracing async functions
 */
export async function withTracing<T>(
  name: string,
  inputs: Record<string, any>,
  fn: () => Promise<T>,
  runType: 'llm' | 'chain' | 'tool' | 'retriever' = 'tool'
): Promise<T> {
  const runId = await createRun(name, runType, inputs);
  
  try {
    const result = await fn();
    
    if (runId) {
      await endRun(runId, { result });
    }
    
    return result;
  } catch (error) {
    if (runId) {
      await endRun(runId, {}, error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
}