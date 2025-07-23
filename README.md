# Bot Chat LLM API

A modern TypeScript-based chatbot API server built with Express.js and LangChain, providing intelligent conversational AI capabilities with automatic web search integration.

## ✨ Features

- **🚀 Express.js API Server** with RESTful endpoints
- **🤖 Multiple LLM Providers**: OpenAI and Anthropic support
- **🧠 Intelligent Agent Architecture** with extensible agent registry
- **🔍 Smart Web Search Integration** - Automatically searches when current information is needed
- **📊 Input/Output Validation** using Zod schemas
- **📝 Comprehensive Logging** with Winston
- **🛡️ Error Handling** and security middleware
- **🔒 Type Safety** throughout the codebase
- **📮 Postman Collection** included for easy testing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment template and configure:
```bash
cp .env.template .env
# Edit .env with your API keys
```

3. Configure your API keys in `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here  
TAVILY_API_KEY=your_tavily_api_key_here
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Legacy Script (Original Implementation)
```bash
npm run legacy
```

## 📡 API Endpoints

### List All Agents
```http
GET /api/agents
```
Returns all available agents with their capabilities and metadata.

### Get Agent Metadata
```http
GET /api/agents/:id
```
Get detailed information about a specific agent.

### Chat with Agent
```http
POST /api/agents/:id/chat
Content-Type: application/json

{
  "input_text": "What is the current weather in Paris?",
  "extra_context": "Optional additional context",
  "config": {
    "model": "openai/gpt-4o-mini"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "output_text": "The current weather in Paris is 15°C with light rain...",
    "metadata": {
      "iterations": 1,
      "messageCount": 5
    }
  },
  "timestamp": "2025-07-23T17:00:00.000Z"
}
```

### Health Check
```http
GET /health
```
Returns server health status and version information.

## 🤖 Available Agents

### Chat Agent (`chat_agent`)
An intelligent conversational AI agent with the following capabilities:
- **Natural Conversation**: Engaging dialogue on various topics
- **Question Answering**: Comprehensive responses to user queries
- **Analysis & Writing**: Content analysis and generation
- **Problem Solving**: Logical reasoning and solution finding
- **🔍 Smart Web Search**: Automatically searches for current information when needed

**Key Features:**
- **Intelligent Tool Selection**: The LLM automatically decides when to use web search
- **Real-time Information**: Access to current weather, news, stock prices, and more
- **Contextual Awareness**: Understands when current vs. historical information is needed
- **Error Resilience**: Graceful fallback when search is unavailable

**Example Queries that Trigger Web Search:**
- "What's the current weather in Tokyo?"
- "What is Apple's stock price today?"
- "What are the latest news about AI?"
- "Current exchange rate EUR to USD"

**Example Queries that DON'T Trigger Web Search:**
- "What is 2+2?"
- "Explain how Python works"
- "Write a poem about cats"
- "What is the capital of France?"

## 📮 Postman Collection

A complete Postman collection is included for easy API testing:

1. **Import Collection**: Import `postman_collection.json` into Postman
2. **Import Environment**: Import `postman_environment.json` for environment variables
3. **Set Agent ID**: Update the `agentId` variable to `chat_agent`

**Available Test Requests:**
- **Basic Chat**: Simple conversation without web search
- **Weather Search**: Test web search with weather queries
- **News Search**: Test web search with current events
- **Stock Search**: Test web search with financial data

## 🧪 Usage Examples

### Basic Conversation
```bash
curl -X POST http://localhost:3000/api/agents/chat_agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Hello! How can you help me?",
    "extra_context": "General conversation"
  }'
```

### Current Information Query (Triggers Web Search)
```bash
curl -X POST http://localhost:3000/api/agents/chat_agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "What is the current price of Bitcoin?",
    "extra_context": ""
  }'
```

### Knowledge Query (No Web Search)
```bash
curl -X POST http://localhost:3000/api/agents/chat_agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Explain the concept of recursion in programming",
    "extra_context": ""
  }'
```

## 📁 Project Structure

```
src/
├── agents/           # Agent implementations
│   └── chat/        # Chat agent with nodes, prompts, and state
├── api/             # Express.js API layer
│   ├── routes/      # Route handlers
│   ├── middleware/  # Express middleware (validation, errors)
│   └── server.ts    # Express server configuration
├── core/            # Core framework components
│   ├── base/        # Base classes for agents
│   └── registry.ts  # Agent registry and management
├── tools/           # LLM tools and integrations
│   └── search.tool.ts # Web search tool (Tavily)
├── types/           # TypeScript type definitions
└── utils/           # Utility functions (LLM, config, logging)
```

## Configuration

The application supports configuration via environment variables:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (error/warn/info/debug)
- `CORS_ORIGIN`: CORS origin configuration
- API keys for various services

## Error Handling

- Input validation with detailed error messages
- Structured error responses
- Comprehensive logging
- Graceful error recovery

## 🔍 Web Search Integration

### How It Works
The web search integration uses **intelligent tool selection** where the LLM automatically decides when to search for current information:

1. **User sends query** → Agent processes with LLM
2. **LLM determines** if current information is needed
3. **If yes** → Automatically calls Tavily search tool
4. **Search results** → Fed back to LLM for comprehensive response
5. **Final answer** → Includes current, real-time information

### Technical Implementation
```typescript
// LLM with bound tools - automatic tool selection
const llmWithTools = createLLM(llmConfig, [webSearchTool]);
const response = await llmWithTools.invoke(state.messages);

// Handle tool calls automatically
if (response.tool_calls && response.tool_calls.length > 0) {
  // Execute tools and get results
  // Feed results back to LLM for final response
}
```

### Search Tool Configuration
The web search tool is implemented using:
- **Provider**: Tavily API (optimized for LLM responses)
- **Max Results**: 5 search results per query
- **Schema**: Proper Zod validation for OpenAI function calling
- **Error Handling**: Graceful fallback when search fails

## 🛠️ Adding New Agents

1. Create agent directory in `src/agents/your_agent/`
2. Implement agent class extending `AgentBase`
3. Define state, configuration, and validation schemas using Zod
4. Create nodes for agent workflow (input, processing, output)
5. Register agent in `AgentRegistry`

**Example Agent Structure:**
```
src/agents/your_agent/
├── index.ts      # Main agent class
├── nodes.ts      # Workflow nodes
├── prompts.ts    # Prompt templates
└── state.ts      # State and schema definitions
```

## 📊 Monitoring & Logs

- **Winston Logging**: Comprehensive logging with different levels
- **Request Tracking**: All API requests are logged with metadata
- **Error Tracking**: Detailed error logging with stack traces
- **Tool Usage**: Web search calls are logged for monitoring

## 🚨 Troubleshooting

### Common Issues
- **"Invalid schema" errors**: Ensure API keys are properly configured
- **Empty responses**: Check if LLM provider API key is valid
- **Search not working**: Verify TAVILY_API_KEY is set correctly

### Debug Mode
Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

## 📝 License

ISC