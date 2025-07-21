# Bot Chat LLM

A Node.js application that creates an intelligent chatbot using LangGraph, OpenAI, and Tavily search capabilities. The bot can answer questions and perform web searches when needed.

## Features

- **AI-Powered Conversations**: Uses OpenAI's ChatGPT model for natural language processing
- **Web Search Integration**: Automatically searches the web using Tavily API when additional information is needed
- **Graph-Based Architecture**: Built with LangGraph for robust conversation flow management
- **Visual Graph Generation**: Generates a visual representation of the conversation flow as a PNG diagram

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API Key
- Tavily API Key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bot-chat-llm
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

## Usage

Run the application:
```bash
npx ts-node src/index.ts
```

The application will:
1. Generate a visual graph diagram (`graph.png`) showing the conversation flow
2. Execute a sample conversation asking "¿Cuál es la capital de Francia?" (What is the capital of France?)
3. Display the conversation in the console

## Project Structure

```
src/
├── entity/
│   └── state.entity.ts    # State management for the conversation graph
├── tools/
│   └── search.tool.ts     # Tavily web search tool configuration
├── utils/
│   └── llm.util.ts        # OpenAI model configuration and conversation logic
└── index.ts               # Main application entry point
```

## How It Works

1. **State Management**: The application uses LangGraph's state annotation to track conversation messages and iteration count
2. **LLM Integration**: OpenAI's ChatGPT model processes user messages and generates responses
3. **Tool Integration**: When the AI needs additional information, it can use the Tavily search tool to find relevant web results
4. **Flow Control**: The graph automatically decides whether to use tools or end the conversation based on the AI's response

## Configuration

### Temperature Setting
The AI model is configured with a temperature of 0.7 for balanced creativity and consistency. You can modify this in `src/utils/llm.util.ts`.

### Iteration Limit
The conversation is limited to 3 iterations to prevent infinite loops. This can be adjusted in the `should_continue` function in `src/utils/llm.util.ts`.

## API Keys Setup

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and navigate to API keys
3. Generate a new API key
4. Add it to your `.env` file

### Tavily API Key
1. Go to [Tavily](https://tavily.com/)
2. Sign up for an account
3. Generate an API key
4. Add it to your `.env` file

## Development

To modify the conversation or add new features:

1. **Add new tools**: Create new tool files in `src/tools/` and import them in `index.ts`
2. **Modify conversation logic**: Update the LLM function in `src/utils/llm.util.ts`
3. **Change conversation flow**: Modify the graph structure in `src/index.ts`

## Dependencies

- **@langchain/community**: Community tools and integrations for LangChain
- **@langchain/core**: Core LangChain functionality
- **@langchain/langgraph**: Graph-based conversation flow management
- **openai**: Official OpenAI API client
- **tavily**: Web search API for enhanced information retrieval
- **dotenv**: Environment variable management

## License

ISC