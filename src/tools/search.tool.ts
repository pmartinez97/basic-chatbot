import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Original Tavily tool for functionality
const tavilyTool = new TavilySearchResults({
  apiKey: process.env.TAVILY_API_KEY,
  maxResults: 5,
});

// Custom wrapper with proper schema for OpenAI function calling
export const webSearchTool = new DynamicStructuredTool({
  name: "tavily_search_results_json",
  description: "A search engine optimized for comprehensive, accurate, and trusted results. Useful for when you need to answer questions about current events, news, weather, stock prices, or any real-time information.",
  schema: z.object({
    query: z.string().describe("The search query to execute"),
  }),
  func: async ({ query }) => {
    try {
      const result = await tavilyTool.invoke(query);
      return result;
    } catch (error) {
      console.error("Search error:", error);
      return "I apologize, but I'm unable to search for current information right now. Please try again later.";
    }
  },
});