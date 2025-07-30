import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatAgentState, ChatAgentConfig } from "./state";
import { ChatAgentPrompts } from "./prompts";
import { createLLM } from "../../utils/llm.util";
import { getLLMConfig } from "../../utils/config.util";
import { logger } from "../../utils/logger.util";
import { webSearchTool } from "../../tools/search.tool";
import { databaseTools } from "../../tools/database.tool";
import { humanAssistanceTool } from "../../tools/human-assistance.tool";

export async function inputNode(state: ChatAgentState): Promise<Partial<ChatAgentState>> {
  try {
    logger.info('Input node: Processing user input');
    
    // Create new human message from input
    const humanMessage = new HumanMessage(state.input.input_text);
    
    // Append to existing messages for conversation continuity
    const updatedMessages = [...state.messages, humanMessage];
    
    return {
      messages: updatedMessages,
      iterationCount: 0,
      extra_context: state.input.extra_context,
    };
  } catch (error) {
    logger.error('Error in input node:', error);
    throw error;
  }
}

export async function callModelNode(
  state: ChatAgentState,
  config: { configurable?: { model?: string } } = {}
): Promise<Partial<ChatAgentState>> {
  try {
    const modelString = config.configurable?.model || 'openai/gpt-4o-mini';
    const llmConfig = getLLMConfig(modelString);
    
    // Create LLM with tools bound (including human assistance)
    const allTools = [webSearchTool, ...databaseTools, humanAssistanceTool];
    const llmWithTools = createLLM(llmConfig, allTools);
    
    // Add system message with context if this is the first interaction
    let messages = [...state.messages];
    const hasSystemMessage = messages.some(msg => msg._getType() === 'system');
    
    if (!hasSystemMessage) {
      const systemPrompt = await ChatAgentPrompts.createChatPrompt(
        state.extra_context || '', 
        []
      );
      const systemMessage = new SystemMessage(systemPrompt);
      messages = [systemMessage, ...messages];
    }
    
    logger.info('Call model node: Invoking LLM');
    const response = await llmWithTools.invoke(messages);
    
    // Append the response to existing messages for conversation continuity
    const updatedMessages = [...messages, response];
    
    return {
      messages: updatedMessages,
      iterationCount: state.iterationCount + 1,
    };
  } catch (error) {
    logger.error('Error in call model node:', error);
    throw error;
  }
}

export async function finalizeNode(state: ChatAgentState): Promise<Partial<ChatAgentState>> {
  try {
    logger.info('Finalize node: Marking conversation as complete');
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