import * as dotenv from "dotenv";
dotenv.config();

import { writeFileSync } from "fs";
import { END, StateGraph, START } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { StateAnnotation } from "./entity/state.entity";
import { llm } from "./utils/llm.util";
import { webSearchTool } from "./tools/search.tool";
import { isAIMessage } from "@langchain/core/messages";

const toolNode = new ToolNode([webSearchTool]);

const builder = new StateGraph(StateAnnotation)
  .addNode("llm", llm)
  .addNode("tools", toolNode)
  .addEdge(START, "llm")
  .addConditionalEdges("llm", toolsCondition, {
    tools: "tools",
    __end__: END,
  })
  .addEdge("tools", "llm");

// Build the graph
const graph = builder.compile();

// Generate the graph in PNG format
(async () => {
  const representation = await graph.getGraphAsync();
  const mermaidPng = await representation.drawMermaidPng();
  const arrayBuffer = await mermaidPng.arrayBuffer();
  writeFileSync("graph.png", new Uint8Array(arrayBuffer));
})();

// Execute the graph
(async () => {
  const { HumanMessage } = await import("@langchain/core/messages");
  
  const result = await graph.invoke({
    messages: [new HumanMessage("¿Cuál es la capital de Francia?")],
  });

  console.log("\nConversación final:\n");
  for (const message of result.messages) {
    if (message.content) {
      const role = isAIMessage(message) ? "Asistente" : "Usuario";
      console.log(`${role}: ${message.content}`);
    }
  }
})();