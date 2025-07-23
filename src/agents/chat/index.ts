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

  async execute(input: ChatAgentInput, config?: ChatAgentConfig): Promise<ChatAgentOutput> {
    try {
      logger.info('Executing chat agent with LangGraph', { input: input.input_text });
      
      const validatedInput = this.validateInput(input);
      const validatedConfig = config ? this.validateConfig(config) : { 
        model: 'openai/gpt-4o-mini',
        temperature: 0.7 
      };

      // Create the LangGraph workflow
      const graph = createChatAgentGraph(validatedConfig);

      // Create initial state for LangGraph
      const initialState = {
        input: validatedInput,
        messages: [],
        iterationCount: 0,
        isComplete: false,
        nodeHistory: [],
        startTime: Date.now(),
        currentNode: undefined,
      };

      logger.info('Starting LangGraph workflow execution');
      
      // Execute the workflow using LangGraph
      const finalState = await graph.invoke(initialState);

      logger.info('LangGraph workflow execution completed', {
        nodeHistory: finalState.nodeHistory,
        iterations: finalState.iterationCount,
        executionTime: Date.now() - (finalState.startTime || Date.now()),
      });

      // Extract output from final state
      const lastMessage = finalState.messages[finalState.messages.length - 1];
      const output: ChatAgentOutput = {
        output_text: lastMessage.content as string,
        metadata: {
          iterations: finalState.iterationCount,
          messageCount: finalState.messages.length,
          nodeHistory: finalState.nodeHistory,
          executionTime: Date.now() - (finalState.startTime || Date.now()),
        }
      };

      return this.validateOutput(output);
    } catch (error) {
      logger.error('Error executing chat agent with LangGraph:', error);
      throw error;
    }
  }

  // Method to get the graph for visualization - now this actually reflects what's used!
  getGraph(config?: ChatAgentConfig) {
    return createChatAgentGraph(config);
  }
}