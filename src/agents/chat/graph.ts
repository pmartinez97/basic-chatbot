import { END, StateGraph, START } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatAgentStateAnnotation, ChatAgentConfig } from "./state";
import { inputNode, callModelNode } from "./nodes";
import { webSearchTool } from "../../tools/search.tool";
import { databaseTools } from "../../tools/database.tool";

// Create the tool node with all available tools
const toolNode = new ToolNode([webSearchTool, ...databaseTools]);

// Create the proper LangGraph StateGraph
export function createChatAgentGraph(_config?: ChatAgentConfig) {
  const builder = new StateGraph(ChatAgentStateAnnotation)
    .addNode("message", inputNode)
    .addNode("call_model", callModelNode)
    .addNode("tools", toolNode)
    .addEdge(START, "message")
    .addEdge("message", "call_model")
    .addConditionalEdges("call_model", toolsCondition, {
      tools: "tools",
      __end__: END,
    })
    .addEdge("tools", "call_model");

  // Compile the graph
  const compiledGraph = builder.compile();

  return compiledGraph;
}

// Export graph metadata for visualization
export const getGraphMetadata = () => {
  return {
    nodes: [
      {
        id: "input",
        type: "node",
        label: "Input Processing",
        description: "Process user input and create initial messages"
      },
      {
        id: "call_model", 
        type: "node",
        label: "LLM Call",
        description: "Call LLM with tools available"
      },
      {
        id: "tools",
        type: "node", 
        label: "Tools",
        description: "Execute tool calls made by the LLM"
      },
      {
        id: "__end__",
        type: "end",
        label: "End",
        description: "Workflow completion"
      }
    ],
    edges: [
      {
        from: "input",
        to: "call_model",
        type: "direct",
        label: "Process"
      },
      {
        from: "call_model",
        to: "tools", 
        type: "conditional",
        label: "Tool calls",
        condition: "tools"
      },
      {
        from: "call_model",
        to: "__end__",
        type: "conditional", 
        label: "Complete",
        condition: "__end__"
      },
      {
        from: "tools",
        to: "call_model",
        type: "direct",
        label: "Continue"
      }
    ],
    entryPoint: "input",
    conditionalLogic: {
      "call_model": {
        function: "toolsCondition",
        description: "Determines if tools need to be called or if execution is complete",
        conditions: {
          "tools": "response has tool_calls",
          "__end__": "response has no tool_calls"
        }
      }
    }
  };
};