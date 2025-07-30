import { AgentBase } from "../../core/base/agent.base";
import { AgentMetadata } from "../../types";
import { 
  ChatAgentInput, 
  ChatAgentOutput, 
  ChatAgentConfig,
  ChatAgentInputSchema,
  ChatAgentOutputSchema,
  ChatAgentConfigSchema,
} from "./state";
import { createChatAgentGraph } from "./graph";
import { logger } from "../../utils/logger.util";
import { isGraphInterrupt, Command } from "@langchain/langgraph";
import { ChatResponseWithInterrupt } from "../../types";

export class ChatAgent extends AgentBase<ChatAgentInput, ChatAgentOutput, ChatAgentConfig> {
  protected metadata: AgentMetadata = {
    id: "chat_agent",
    name: "Chat Agent",
    description: "A conversational AI agent that can engage in natural dialogue and assist with various tasks",
    version: "1.0.0",
    capabilities: [
      "Natural conversation",
      "Question answering",
      "Analysis and writing",
      "Problem solving",
      "Web search integration"
    ]
  };

  protected inputSchema = ChatAgentInputSchema;
  protected outputSchema = ChatAgentOutputSchema;
  protected configSchema = ChatAgentConfigSchema;

  constructor() {
    super();
  }

  async execute(input: ChatAgentInput, config?: ChatAgentConfig): Promise<ChatAgentOutput | ChatResponseWithInterrupt> {
    const validatedInput = this.validateInput(input);
    const validatedConfig = config ? this.validateConfig(config) : { 
      model: 'openai/gpt-4o-mini',
      temperature: 0.7 
    };

    try {
      logger.info('Executing chat agent with LangGraph', { input: input.input_text });

      // Create the LangGraph workflow
      const graph = createChatAgentGraph(validatedConfig);
      
      // Create configuration for LangGraph with thread_id for memory
      const graphConfig = validatedConfig.thread_id ? {
        configurable: { thread_id: validatedConfig.thread_id }
      } : undefined;
      
      // Create input state for this interaction
      const inputState = {
        input: validatedInput,
        extra_context: validatedInput.extra_context,
      };
      
      // Execute the workflow using LangGraph with memory support
      // LangGraph handles interrupts and state management automatically
      const finalState = await graph.invoke(inputState, graphConfig);

      // Check if the workflow was interrupted
      if (finalState.__interrupt__ && finalState.__interrupt__.length > 0) {
        logger.info('LangGraph workflow interrupted', { 
          interrupts: finalState.__interrupt__.length,
          thread_id: validatedConfig.thread_id 
        });
        return this.handleNativeInterruptFromResult(finalState.__interrupt__[0], validatedConfig.thread_id);
      }

      logger.info('LangGraph workflow execution completed', {
        iterations: finalState.iterationCount,
        messageCount: finalState.messages.length,
      });

      // Extract output from final state
      const lastMessage = finalState.messages[finalState.messages.length - 1];
      const output: ChatAgentOutput = {
        output_text: lastMessage.content as string,
        metadata: {
          iterations: finalState.iterationCount,
          messageCount: finalState.messages.length,
          thread_id: validatedConfig.thread_id,
        }
      };

      return this.validateOutput(output);
    } catch (error) {
      logger.error('Error executing chat agent:', error);
      
      // Check if this is a LangGraph interrupt (native handling)
      if (isGraphInterrupt(error)) {
        return this.handleNativeInterrupt(error, validatedConfig.thread_id);
      }
      
      throw error;
    }
  }

  /**
   * Handle interrupts from workflow result (when __interrupt__ is present)
   */
  private handleNativeInterruptFromResult(interrupt: any, threadId?: string): ChatResponseWithInterrupt {
    logger.info('Handling LangGraph interrupt from result', { threadId });
    
    const interruptValue = interrupt.value;
    
    if (!interruptValue || !threadId) {
      logger.error('Invalid interrupt or missing thread_id');
      throw new Error('Failed to handle interrupt: missing required data');
    }

    // Extract interrupt information using LangGraph native structure
    const response: ChatResponseWithInterrupt = {
      output_text: `I need human assistance: ${interruptValue.message || 'Human input required'}`,
      is_interrupted: true,
      interrupt_request: {
        type: 'human_assistance',
        request_type: interruptValue.request_type || 'approval',
        message: interruptValue.message || 'Human input required',
        context: interruptValue.context,
        options: interruptValue.options,
        urgency: interruptValue.urgency || 'normal',
        timestamp: new Date().toISOString(),
        interrupt_id: interrupt.interrupt_id,
      },
      next_steps: ['Provide human response to continue'],
      metadata: {
        thread_id: threadId,
        interrupt_type: interruptValue.request_type || 'approval',
        urgency: interruptValue.urgency || 'normal',
        timestamp: new Date().toISOString(),
      }
    };

    logger.info('Interrupt from result handled successfully', { 
      threadId, 
      request_type: interruptValue.request_type 
    });

    return response;
  }

  /**
   * Handle interrupts using LangGraph's native interrupt system
   */
  private handleNativeInterrupt(error: any, threadId?: string): ChatResponseWithInterrupt {
    logger.info('Handling LangGraph native interrupt', { threadId });
    
    const interrupt = error.interrupts[0]; // Get first interrupt
    const interruptValue = interrupt.value;
    
    if (!interruptValue || !threadId) {
      logger.error('Invalid interrupt or missing thread_id');
      throw new Error('Failed to handle interrupt: missing required data');
    }

    // Extract interrupt information using LangGraph native structure
    const response: ChatResponseWithInterrupt = {
      output_text: `I need human assistance: ${interruptValue.message || 'Human input required'}`,
      is_interrupted: true,
      interrupt_request: {
        type: 'human_assistance',
        request_type: interruptValue.request_type || 'approval',
        message: interruptValue.message || 'Human input required',
        context: interruptValue.context,
        options: interruptValue.options,
        urgency: interruptValue.urgency || 'normal',
        timestamp: new Date().toISOString(),
        interrupt_id: interrupt.interrupt_id,
      },
      next_steps: ['Provide human response to continue'],
      metadata: {
        thread_id: threadId,
        interrupt_type: interruptValue.request_type || 'approval',
        urgency: interruptValue.urgency || 'normal',
        timestamp: new Date().toISOString(),
      }
    };

    logger.info('Native interrupt handled successfully', { 
      threadId, 
      request_type: interruptValue.request_type 
    });

    return response;
  }

  /**
   * Resume execution using LangGraph's native Command system
   */
  async resumeExecution(threadId: string, humanResponse: string, config?: ChatAgentConfig): Promise<ChatAgentOutput> {
    logger.info('Resuming execution with human response', { threadId });
    
    const validatedConfig = config ? this.validateConfig(config) : { 
      model: 'openai/gpt-4o-mini',
      temperature: 0.7,
      thread_id: threadId
    };

    // Create the LangGraph workflow
    const graph = createChatAgentGraph(validatedConfig);
    
    // Create configuration for resuming
    const graphConfig = {
      configurable: { thread_id: threadId }
    };
    
    // Use LangGraph's native Command to resume execution
    const command = new Command({
      resume: humanResponse
    });
    
    // Resume execution
    const finalState = await graph.invoke(command, graphConfig);
    
    logger.info('Execution resumed successfully', {
      iterations: finalState.iterationCount,
      messageCount: finalState.messages.length,
    });

    // Extract output from final state
    const lastMessage = finalState.messages[finalState.messages.length - 1];
    const output: ChatAgentOutput = {
      output_text: lastMessage.content as string,
      metadata: {
        iterations: finalState.iterationCount,
        messageCount: finalState.messages.length,
        thread_id: threadId,
        resumed_at: new Date().toISOString(),
      }
    };

    return this.validateOutput(output);
  }

  // Method to get the graph for visualization - now this actually reflects what's used!
  getGraph(config?: ChatAgentConfig) {
    return createChatAgentGraph(config);
  }
}