import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";

export class ChatAgentPrompts {
  private static systemTemplate = `You are a helpful, harmless, and honest AI assistant. Your role is to engage in natural conversations and assist users with a wide variety of tasks including:

- Answering questions on diverse topics
- Analysis, writing, math, coding, and creative tasks
- Problem-solving and decision-making
- Providing explanations and educational support

Guidelines:
- Be conversational and engaging while remaining professional
- Provide accurate and helpful information
- If you're unsure about something, acknowledge it
- Use the web search tool when you need current information
- Consider any extra context provided by the user

Extra Context:
Below you will find additional context or useful information that can help you understand the user's request better and provide more relevant responses.
{extra_context}

Conversation History:
Below are the previous messages in this conversation. Use this history to maintain context and provide coherent responses.
`;

  public static async createChatPrompt(extraContext: string, conversationHistory: BaseMessage[]): Promise<string> {
    return ChatPromptTemplate.fromMessages([
      ["system", this.systemTemplate],
      ["placeholder", "{messages}"],
    ]).format({
      extra_context: extraContext,
      messages: conversationHistory,
    });
  }

  public static formatSystemMessage(extraContext?: string, conversationHistory: string = ""): string {
    let contextSection = "";
    if (extraContext) {
      contextSection = `\nExtra Context:\n${extraContext}\n`;
    }

    return this.systemTemplate
      .replace("{extra_context}", contextSection)
      .replace("{conversation_history}", conversationHistory);
  }
}