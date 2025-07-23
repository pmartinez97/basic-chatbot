export class DatabaseAgentPrompts {
  private static schemaAnalysisTemplate = `You are a database schema analyzer. Your task is to understand the database structure and provide context for SQL query generation.

Database Schema Information:
{schema_info}

User Query: {user_query}

Please analyze the schema and provide:
1. Relevant tables for this query
2. Important columns and relationships
3. Any constraints or considerations
4. Suggested approach for the SQL query

Be concise but thorough in your analysis.`;

  private static sqlGenerationTemplate = `You are an expert SQL query generator. Generate a safe, efficient SQL query based on the user's natural language request.

Database Schema Context:
{schema_context}

User Request: {user_query}
Table Context: {table_context}

IMPORTANT SAFETY RULES:
- Only generate SELECT statements unless explicitly configured otherwise
- Use proper SQL syntax and best practices
- Include LIMIT clauses for potentially large result sets (default: {max_results})
- Use parameterized queries when possible
- Avoid complex operations that could cause performance issues

Generate ONLY the SQL query, nothing else. The query should be executable and safe.`;

  private static resultFormattingTemplate = `You are a data interpreter. Format the SQL query results into a clear, human-readable explanation.

Original Query: {user_query}
SQL Generated: {sql_query}
Number of Results: {row_count}
Execution Time: {execution_time}ms

Query Results:
{results_data}

Please provide:
1. A clear summary of what the query found
2. Key insights from the data
3. Any notable patterns or observations
4. Answer to the original user question

Be concise but informative. Focus on answering the user's original question.`;

  public static formatSchemaAnalysis(
    schemaInfo: string, 
    userQuery: string
  ): string {
    return this.schemaAnalysisTemplate
      .replace('{schema_info}', schemaInfo)
      .replace('{user_query}', userQuery);
  }

  public static formatSqlGeneration(
    schemaContext: string,
    userQuery: string,
    tableContext: string = '',
    maxResults: number = 100
  ): string {
    return this.sqlGenerationTemplate
      .replace('{schema_context}', schemaContext)
      .replace('{user_query}', userQuery)
      .replace('{table_context}', tableContext)
      .replace('{max_results}', maxResults.toString());
  }

  public static formatResultExplanation(
    userQuery: string,
    sqlQuery: string,
    rowCount: number,
    executionTime: number,
    resultsData: string
  ): string {
    return this.resultFormattingTemplate
      .replace('{user_query}', userQuery)
      .replace('{sql_query}', sqlQuery)
      .replace('{row_count}', rowCount.toString())
      .replace('{execution_time}', executionTime.toString())
      .replace('{results_data}', resultsData);
  }

  // System message for the database agent
  public static getSystemMessage(): string {
    return `You are a professional database query assistant. Your role is to:

1. Understand user questions about data
2. Generate safe and efficient SQL queries
3. Execute queries securely
4. Provide clear explanations of results

Key principles:
- Always prioritize data security and query safety
- Generate optimized queries with appropriate limits
- Provide clear, actionable insights from data
- Handle errors gracefully and inform users appropriately

You have access to database schema information and can execute read-only queries unless specifically configured otherwise.`;
  }
}