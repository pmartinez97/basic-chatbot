import { DynamicStructuredTool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";
import { logger } from "../utils/logger.util";

// Define the schema for human assistance requests
const HumanAssistanceSchema = z.object({
  request_type: z.enum(['approval', 'guidance', 'custom_input', 'quality_review']).describe(
    "The type of human assistance needed: 'approval' for permission requests, 'guidance' for expert help, 'custom_input' for specific information, 'quality_review' for response validation"
  ),
  message: z.string().describe("The specific question or request for the human"),
  context: z.string().optional().describe("Additional context about the situation"),
  options: z.array(z.string()).optional().describe("Available options for the human to choose from (for approval or selection requests)"),
  urgency: z.enum(['low', 'normal', 'high']).default('normal').describe("Priority level of the request"),
});

export type HumanAssistanceRequest = z.infer<typeof HumanAssistanceSchema>;


/**
 * Human Assistance Tool - Allows the AI agent to request human intervention
 * This tool uses LangGraph's interrupt() function to pause execution and wait for human input
 */
export const humanAssistanceTool = new DynamicStructuredTool({
  name: "request_human_assistance",
  description: `Request help from a human when you need:
    - Approval for sensitive actions (like deleting data or making important decisions)
    - Expert guidance on complex topics you're uncertain about
    - Specific information that only the user can provide
    - Quality review of your response before sending it
    
    This will pause the conversation and wait for human input before continuing.`,
  
  schema: HumanAssistanceSchema,
  
  func: async ({ request_type, message, context, options, urgency }) => {
    logger.info('Human assistance requested', { 
      request_type, 
      message: message.substring(0, 100) + '...', 
      urgency 
    });

    // Prepare the interrupt payload with all necessary information
    const interruptPayload = {
      type: 'human_assistance',
      request_type,
      message,
      context,
      options,
      urgency,
      timestamp: new Date().toISOString(),
    };

    // Use LangGraph's interrupt function to pause execution
    // This will throw a GraphInterrupt exception that the execution engine will handle
    // We should NOT catch this exception - let it bubble up to LangGraph
    const humanResponse = interrupt(interruptPayload);

    // This code will only run after the human provides input and execution resumes
    logger.info('Human assistance received, resuming execution', { 
      response_length: typeof humanResponse === 'string' ? humanResponse.length : 'non-string' 
    });

    // Return the human's response to continue the workflow
    return humanResponse;
  },
});

/**
 * Utility function to create specific types of human assistance requests
 */
export class HumanAssistance {
  /**
   * Request approval for a sensitive action
   */
  static async requestApproval(action: string, context?: string, options?: string[]): Promise<string> {
    return await humanAssistanceTool.func({
      request_type: 'approval',
      message: `Do you approve this action: ${action}?`,
      context,
      options: options || ['approve', 'deny', 'modify'],
      urgency: 'high',
    });
  }

  /**
   * Request expert guidance on a complex topic
   */
  static async requestGuidance(topic: string, context?: string): Promise<string> {
    return await humanAssistanceTool.func({
      request_type: 'guidance',
      message: `I need your expert guidance on: ${topic}`,
      context,
      urgency: 'normal',
    });
  }

  /**
   * Request specific custom input from the user
   */
  static async requestCustomInput(question: string, context?: string): Promise<string> {
    return await humanAssistanceTool.func({
      request_type: 'custom_input',
      message: question,
      context,
      urgency: 'normal',
    });
  }

  /**
   * Request quality review of a response before sending
   */
  static async requestQualityReview(response: string, context?: string): Promise<string> {
    return await humanAssistanceTool.func({
      request_type: 'quality_review',
      message: `Please review this response before I send it: ${response}`,
      context,
      options: ['approve', 'modify', 'rewrite'],
      urgency: 'normal',
    });
  }
}