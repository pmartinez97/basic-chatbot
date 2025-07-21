import { ChatOpenAI } from "@langchain/openai";
import { State } from "../entity/state.entity";
import { webSearchTool } from "../tools/search.tool";

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