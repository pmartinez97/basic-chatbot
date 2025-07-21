import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

export const webSearchTool = new TavilySearchResults({
  apiKey: process.env.TAVILY_API_KEY,
});