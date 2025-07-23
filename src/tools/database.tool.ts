import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createDatabaseAgent } from "../agents/database";
import { logger } from "../utils/logger.util";

/**
 * Database query tool for ChatAgent integration
 * Allows the chat agent to query the database using natural language
 */
export const databaseQueryTool = new DynamicStructuredTool({
  name: "database_query",
  description: "Query a database using natural language. This tool can help you retrieve information from database tables, perform analysis, generate reports, and answer questions about stored data. It automatically converts your natural language query into SQL and executes it safely.",
  schema: z.object({
    query: z.string().describe("The natural language query to execute against the database. Be specific about what data you're looking for."),
    table_context: z.string().optional().describe("Optional context about specific tables to focus on, if known"),
    max_results: z.number().positive().optional().default(50).describe("Maximum number of results to return (default: 50)")
  }),
  func: async ({ query, table_context, max_results = 50 }) => {
    try {
      logger.info('Database query tool invoked', { 
        query, 
        table_context, 
        max_results 
      });

      // Create database agent instance
      const databaseAgent = createDatabaseAgent({
        model: 'openai/gpt-4o-mini', // Use efficient model for SQL generation
        temperature: 0.1, // Low temperature for consistent SQL generation
        allow_write_operations: false, // Safety: only allow read operations
        max_execution_time: 15000 // 15 second timeout
      });

      // Process the query
      const result = await databaseAgent.processQuery({
        query,
        table_context,
        max_results
      });

      // Format the response for the chat agent
      const response = {
        success: true,
        explanation: result.explanation,
        sql_query: result.sql_query,
        row_count: result.row_count,
        execution_time: result.execution_time,
        results: result.results
      };

      logger.info('Database query completed successfully', {
        rowCount: result.row_count,
        executionTime: result.execution_time
      });

      // Return formatted response
      return `Database Query Results:

${result.explanation}

SQL Query: ${result.sql_query}
Rows Returned: ${result.row_count}
Execution Time: ${result.execution_time}ms

${result.row_count > 0 ? `Sample Data:\n${JSON.stringify(result.results.slice(0, 3), null, 2)}` : 'No data found.'}`;

    } catch (error) {
      logger.error('Database query tool failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `I apologize, but I encountered an error while querying the database: ${errorMessage}. Please try rephrasing your query or check if the requested data exists.`;
    }
  },
});

/**
 * Database schema tool for ChatAgent integration
 * Allows the chat agent to explore database structure
 */
export const databaseSchemaTool = new DynamicStructuredTool({
  name: "database_schema",
  description: "Get information about the database schema, including tables, columns, and data types. This helps understand what data is available for querying.",
  schema: z.object({
    // No parameters needed for schema retrieval
  }),
  func: async () => {
    try {
      logger.info('Database schema tool invoked');

      // Create database agent instance
      const databaseAgent = createDatabaseAgent();

      // Get schema information
      const schema = await databaseAgent.getSchema();

      logger.info('Database schema retrieved successfully');

      return `Database Schema Information:

${schema}

You can now query this database using natural language with the database_query tool.`;

    } catch (error) {
      logger.error('Database schema tool failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `I apologize, but I encountered an error while retrieving the database schema: ${errorMessage}.`;
    }
  },
});

/**
 * Export all database tools
 */
export const databaseTools = [
  databaseQueryTool,
  databaseSchemaTool
];