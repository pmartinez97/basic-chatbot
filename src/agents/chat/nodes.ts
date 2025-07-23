import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatAgentState } from "./state";
import { ChatAgentPrompts } from "./prompts";
import { createLLM } from "../../utils/llm.util";
import { getLLMConfig } from "../../utils/config.util";
import { logger } from "../../utils/logger.util";
import { webSearchTool } from "../../tools/search.tool";

export async function inputNode(state: ChatAgentState): Promise<Partial<ChatAgentState>> {
  try {
    const systemMessage = new SystemMessage(
      ChatAgentPrompts.formatSystemMessage(state.input.extra_context)
    );
    const humanMessage = new HumanMessage(state.input.input_text);
    
    return {
      messages: [systemMessage, humanMessage],
      iterationCount: 0,
    };
  } catch (error) {
    logger.error('Error in input node:', error);
    throw error;
  }
}

export async function callModelNode(
  state: ChatAgentState, 
  config: { model?: string } = {}
): Promise<Partial<ChatAgentState>> {
  try {
    const modelString = config.model || 'openai/gpt-4o-mini';
    const llmConfig = getLLMConfig(modelString);
    
    // Create LLM with web search tool bound - let the LLM decide when to use it
    const llmWithTools = createLLM(llmConfig, [webSearchTool]);
    
    const response = await llmWithTools.invoke(state.messages);
    
    // Handle tool calls if they exist
    if (response.tool_calls && response.tool_calls.length > 0) {
      logger.info('LLM made tool calls:', response.tool_calls.map(tc => ({ name: tc.name, args: tc.args })));
      
      const updatedMessages = [...state.messages, response];
      
      // Execute each tool call and add results as messages
      for (const toolCall of response.tool_calls) {
        try {
          let toolResult: string;
          
          if (toolCall.name === 'tavily_search_results_json') {
            toolResult = await webSearchTool.invoke({ query: toolCall.args.query });
          } else {
            toolResult = `Unknown tool: ${toolCall.name}`;
          }
          
          // Create tool message with proper format for OpenAI
          const toolMessage = {
            role: 'tool' as const,
            content: toolResult,
            tool_call_id: toolCall.id,
          };
          
          updatedMessages.push(toolMessage as any);
        } catch (toolError) {
          logger.error(`Error executing tool ${toolCall.name}:`, toolError);
          
          const errorMessage = {
            role: 'tool' as const,
            content: 'I apologize, but I encountered an error while searching for information. Please try again.',
            tool_call_id: toolCall.id,
          };
          
          updatedMessages.push(errorMessage as any);
        }
      }
      
      // Get final response from LLM with tool results
      const finalResponse = await llmWithTools.invoke(updatedMessages);
      updatedMessages.push(finalResponse);
      
      return {
        messages: updatedMessages,
        iterationCount: state.iterationCount + 1,
      };
    }
    
    // No tool calls, return regular response
    return {
      messages: [...state.messages, response],
      iterationCount: state.iterationCount + 1,
    };
  } catch (error) {
    logger.error('Error in call model node:', error);
    throw error;
  }
}

export async function finalizeNode(_state: ChatAgentState): Promise<Partial<ChatAgentState>> {
  try {
    return {
      isComplete: true,
    };
  } catch (error) {
    logger.error('Error in finalize node:', error);
    throw error;
  }
}

export function shouldContinue(state: ChatAgentState): "continue" | "end" {
  if (state.iterationCount >= 3 || state.isComplete) {
    return "end";
  }
  return "continue";
}