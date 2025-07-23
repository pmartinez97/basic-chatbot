import { ChatAgentState, ChatAgentConfig, ChatAgentStateInterface } from "./state";
import { inputNode, callModelNode, finalizeNode, shouldContinue } from "./nodes";
import { logger } from "../../utils/logger.util";

// Custom Graph Executor - simulates LangGraph but actually works
export class ChatAgentGraphExecutor {
  private config?: ChatAgentConfig;

  constructor(config?: ChatAgentConfig) {
    this.config = config;
  }

  async invoke(initialState: ChatAgentStateInterface): Promise<ChatAgentStateInterface> {
    logger.info("Graph Executor: Starting workflow execution");
    
    // Create a state object that we can track through the workflow
    const state = new ChatAgentState(initialState.input);
    Object.assign(state, initialState);

    try {
      // Step 1: Input node
      logger.info("Graph Executor: Executing input node");
      state.enterNode("input");
      const inputResult = await inputNode(state);
      state.messages = inputResult.messages || state.messages;
      state.iterationCount = inputResult.iterationCount || state.iterationCount;
      state.exitNode();

      // Step 2: Call model node (with potential loops)
      let shouldContinueLoop = true;
      while (shouldContinueLoop) {
        logger.info("Graph Executor: Executing call_model node");
        state.enterNode("call_model");
        const modelResult = await callModelNode(state, this.config);
        state.messages = modelResult.messages || state.messages;
        state.iterationCount = modelResult.iterationCount || state.iterationCount;
        state.exitNode();

        // Check if we should continue or finalize
        const decision = shouldContinue(state);
        logger.info(`Graph Executor: Decision from call_model: ${decision}`, {
          iterationCount: state.iterationCount,
          isComplete: state.isComplete
        });

        shouldContinueLoop = decision === "continue";
      }

      // Step 3: Finalize node
      logger.info("Graph Executor: Executing finalize node");
      state.enterNode("finalize");
      const finalResult = await finalizeNode(state);
      state.isComplete = finalResult.isComplete || state.isComplete;
      state.exitNode();

      logger.info("Graph Executor: Workflow execution completed", {
        nodeHistory: state.nodeHistory,
        iterations: state.iterationCount,
        executionTime: state.getExecutionTime(),
      });

      return state;
    } catch (error) {
      logger.error("Graph Executor: Error during workflow execution:", error);
      throw error;
    }
  }
}

// Factory function to create the graph executor (replaces LangGraph)
export function createChatAgentGraph(config?: ChatAgentConfig) {
  return new ChatAgentGraphExecutor(config);
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
        description: "Call LLM with optional web search tools"
      },
      {
        id: "finalize",
        type: "node", 
        label: "Finalize",
        description: "Mark execution as complete"
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
        to: "finalize", 
        type: "conditional",
        label: "Complete",
        condition: "end"
      },
      {
        from: "call_model",
        to: "call_model",
        type: "conditional", 
        label: "Continue",
        condition: "continue"
      },
      {
        from: "finalize",
        to: "__end__",
        type: "direct",
        label: "Finish"
      }
    ],
    entryPoint: "input",
    conditionalLogic: {
      "call_model": {
        function: "shouldContinue",
        description: "Determines if more iterations are needed or if execution is complete",
        conditions: {
          "continue": "iterationCount < 3 && !isComplete",
          "end": "iterationCount >= 3 || isComplete"
        }
      }
    }
  };
};