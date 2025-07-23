import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatAgentState, ChatAgentConfig } from "./state";
import { ChatAgentPrompts } from "./prompts";
import { createLLM } from "../../utils/llm.util";
import { getLLMConfig } from "../../utils/config.util";
import { logger } from "../../utils/logger.util";
import { webSearchTool } from "../../tools/search.tool";
import { databaseTools } from "../../tools/database.tool";

export async function inputNode(state: ChatAgentState): Promise<Partial<ChatAgentState>> {
  try {
    logger.info('Input node: Processing user input');
    
    // Create initial human message from input
    const humanMessage = new HumanMessage(state.input.input_text);
    
    return {
      messages: [humanMessage],
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
    
    // Create LLM with tools bound
    const allTools = [webSearchTool, ...databaseTools];
    const llmWithTools = createLLM(llmConfig, allTools);
    
    // Add system message with context if we don't have messages yet
    let messages = [...state.messages];
    if (messages.length === 1) { // Only the initial human message
      const systemPrompt = await ChatAgentPrompts.createChatPrompt(
        state.extra_context || '', 
        []
      );
      const systemMessage = new SystemMessage(systemPrompt);
      messages = [systemMessage, ...messages];
    }
    
    logger.info('Call model node: Invoking LLM');
    const response = await llmWithTools.invoke(messages);
    
    return {
      messages: [response],
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