import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { LLMConfig } from "../types";
import { config } from "./config.util";
import { webSearchTool } from "../tools/search.tool";
import { State } from "../entity/state.entity";

export function createLLM(llmConfig: LLMConfig, tools?: any[]) {
  let llm;
  
  switch (llmConfig.provider) {
    case 'openai':
      llm = new ChatOpenAI({
        model: llmConfig.model,
        temperature: llmConfig.temperature || 0.7,
        maxTokens: llmConfig.maxTokens,
        openAIApiKey: config.openaiApiKey,
      });
      break;

    case 'anthropic':
      llm = new ChatAnthropic({
        model: llmConfig.model,
        temperature: llmConfig.temperature || 0.7,
        maxTokens: llmConfig.maxTokens,
        apiKey: config.anthropicApiKey,
      });
      break;

    default:
      throw new Error(`Unsupported LLM provider: ${llmConfig.provider}`);
  }

  // Bind tools if provided
  if (tools && tools.length > 0) {
    return llm.bindTools(tools);
  }

  return llm;
}

// Legacy code for backward compatibility
const model = new ChatOpenAI({
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
}).bindTools([webSearchTool]);

export const llm = async (state: State) => {
  const response = await model.invoke(state.messages);
  
  return {
    messages: [response],
    iteration: state.iteration + 1,
  };
};

export const should_continue = (state: State): "yes" | "no" => {
  if (state.iteration >= 3) return "no";
  return "yes";
};