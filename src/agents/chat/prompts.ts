import { ChatPromptTemplate } from "@langchain/core/prompts";

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

{extra_context}

Conversation History:
{conversation_history}`;

  public static createChatPrompt(extraContext?: string): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ["system", this.systemTemplate],
      ["placeholder", "{messages}"],
    ]);
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