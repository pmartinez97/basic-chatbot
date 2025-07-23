import { END, StateGraph, START } from "@langchain/langgraph";
import { DatabaseAgentStateAnnotation, DatabaseAgentConfig } from './state';
import {
  analyzeSchemaNode,
  generateSqlNode,
  executeQueryNode,
  formatResultsNode,
} from './nodes';

// Create a condition function to check for errors and route accordingly
function shouldContinue(state: any): "continue" | "end" {
  return state.error ? "end" : "continue";
}

// Wrapper functions to match LangGraph node signature
const wrappedAnalyzeSchema = async (state: any, config?: any) => {
  return await analyzeSchemaNode(state, config);
};

const wrappedGenerateSql = async (state: any, config?: any) => {
  return await generateSqlNode(state, config);
};

const wrappedExecuteQuery = async (state: any, config?: any) => {
  return await executeQueryNode(state, config);
};

const wrappedFormatResults = async (state: any, config?: any) => {
  return await formatResultsNode(state, config);
};

// Create the proper LangGraph StateGraph for database agent
export function createDatabaseAgentGraph(_config?: DatabaseAgentConfig) {
  const builder = new StateGraph(DatabaseAgentStateAnnotation)
    .addNode("analyze_schema", wrappedAnalyzeSchema)
    .addNode("generate_sql", wrappedGenerateSql)
    .addNode("execute_query", wrappedExecuteQuery)
    .addNode("format_results", wrappedFormatResults)
    .addEdge(START, "analyze_schema")
    .addConditionalEdges("analyze_schema", shouldContinue, {
      continue: "generate_sql",
      end: END,
    })
    .addConditionalEdges("generate_sql", shouldContinue, {
      continue: "execute_query", 
      end: END,
    })
    .addConditionalEdges("execute_query", shouldContinue, {
      continue: "format_results",
      end: END,
    })
    .addEdge("format_results", END);

  // Compile the graph
  const compiledGraph = builder.compile();

  return compiledGraph;
}

// Export graph metadata for visualization
export const getGraphMetadata = () => {
  return {
    nodes: [
      {
        id: 'analyze_schema',
        type: 'node',
        label: 'Analyze Schema',
        description: 'Analyze database schema and provide context'
      },
      {
        id: 'generate_sql',
        type: 'node',
        label: 'Generate SQL',
        description: 'Generate SQL query from natural language'
      },
      {
        id: 'execute_query',
        type: 'node',
        label: 'Execute Query',
        description: 'Execute SQL query safely'
      },
      {
        id: 'format_results',
        type: 'node',
        label: 'Format Results',
        description: 'Format query results into human-readable explanation'
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
        from: 'analyze_schema',
        to: 'generate_sql',
        type: 'conditional',
        label: 'Success',
        condition: 'continue'
      },
      {
        from: 'analyze_schema',
        to: '__end__',
        type: 'conditional',
        label: 'Error',
        condition: 'end'
      },
      {
        from: 'generate_sql',
        to: 'execute_query',
        type: 'conditional',
        label: 'Success',
        condition: 'continue'
      },
      {
        from: 'generate_sql',
        to: '__end__',
        type: 'conditional',
        label: 'Error',
        condition: 'end'
      },
      {
        from: 'execute_query',
        to: 'format_results',
        type: 'conditional',
        label: 'Success',
        condition: 'continue'
      },
      {
        from: 'execute_query',
        to: '__end__',
        type: 'conditional',
        label: 'Error',
        condition: 'end'
      },
      {
        from: 'format_results',
        to: '__end__',
        type: 'direct',
        label: 'Complete'
      }
    ],
    entryPoint: "analyze_schema",
    conditionalLogic: {
      "analyze_schema": {
        function: "shouldContinue",
        description: "Check for errors and continue or end",
        conditions: {
          "continue": "no error occurred",
          "end": "error occurred"
        }
      },
      "generate_sql": {
        function: "shouldContinue", 
        description: "Check for errors and continue or end",
        conditions: {
          "continue": "no error occurred",
          "end": "error occurred"
        }
      },
      "execute_query": {
        function: "shouldContinue",
        description: "Check for errors and continue or end", 
        conditions: {
          "continue": "no error occurred",
          "end": "error occurred"
        }
      }
    }
  };
};