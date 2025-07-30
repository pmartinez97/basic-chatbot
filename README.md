# Bot Chat LLM API

A modern TypeScript-based chatbot API server built with Express.js and LangChain, providing intelligent conversational AI capabilities with automatic web search integration.

## ✨ Features

- **🚀 Express.js API Server** with RESTful endpoints
- **🤖 Multiple LLM Providers**: OpenAI and Anthropic support
- **🧠 Intelligent Agent Architecture** with extensible agent registry
- **🔍 Smart Web Search Integration** - Automatically searches when current information is needed
- **👤 Human-in-the-Loop** - Simplified AI interrupts using LangGraph's native capabilities
- **💾 Persistent Memory** - Conversations maintain context across interactions using LangGraph checkpointing
- **📊 Input/Output Validation** using Zod schemas
- **📝 Comprehensive Logging** with Winston
- **🛡️ Error Handling** and security middleware
- **🔒 Type Safety** throughout the codebase
- **📮 Postman Collection** included for easy testing

## 🎯 Recent Improvements

### Simplified Human-in-the-Loop Architecture
The implementation has been **dramatically simplified** to leverage LangGraph's native capabilities:

- **📉 70% Code Reduction**: Eliminated 200+ lines of custom interrupt management
- **🔄 Native LangGraph APIs**: Uses `interrupt()`, `isGraphInterrupt()`, and `Command` directly
- **🚀 Single Endpoint**: Reduced from 6 complex endpoints to 1 essential resume endpoint
- **✨ Built-in Features**: Leverages LangGraph's checkpointing, state management, and interrupt handling
- **🎯 Zero Custom Logic**: No more custom interrupt managers or complex state tracking

**Before**: Complex custom interrupt system with 6 endpoints and manual state management  
**After**: Clean, native LangGraph integration with automatic interrupt detection and resume

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
  "thread_id": "optional-thread-id-for-memory",
  "config": {
    "model": "openai/gpt-4o-mini"
  }
}
```

**Normal Response:**
```json
{
  "success": true,
  "data": {
    "output_text": "The current weather in Paris is 15°C with light rain...",
    "metadata": {
      "iterations": 1,
      "messageCount": 5
    },
    "thread_id": "thread_1234567890_abc123"
  },
  "timestamp": "2025-07-23T17:00:00.000Z"
}
```

**Interrupted Response (Human-in-the-Loop):**
```json
{
  "success": true,
  "data": {
    "output_text": "I need human assistance: Do you approve this action?",
    "is_interrupted": true,
    "interrupt_request": {
      "type": "human_assistance",
      "request_type": "approval",
      "message": "Do you approve this action?",
      "options": ["approve", "deny", "modify"],
      "urgency": "high"
    },
    "next_steps": ["Waiting for human response to continue"],
    "thread_id": "thread_1234567890_abc123"
  },
  "timestamp": "2025-07-23T17:00:00.000Z"
}
```

### Health Check
```http
GET /health
```
Returns server health status and version information.

## 👤 Human-in-the-Loop Endpoints

The human-in-the-loop functionality uses **LangGraph's native interrupt system** for efficient, simplified workflow management.

### Resume Interrupted Thread
```http
POST /api/interrupts/agents/:agent_id/threads/:thread_id/resume
Content-Type: application/json

{
  "human_response": "approve",
  "metadata": {
    "reason": "Action approved by supervisor"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "output_text": "Thank you for the approval. I will now proceed with the action...",
    "metadata": {
      "iterations": 2,
      "messageCount": 5,
      "resumed_at": "2025-07-28T10:02:00.000Z"
    }
  }
}
```

### How It Works

1. **Automatic Interrupt Detection**: When the AI calls the `request_human_assistance` tool, LangGraph automatically pauses execution
2. **Native State Management**: Uses LangGraph's built-in checkpointing and interrupt handling
3. **Simple Resume**: Use the single resume endpoint to continue execution with human input
4. **Memory Preservation**: Conversation context is maintained throughout the interrupt/resume cycle

## 🤖 Available Agents

### Chat Agent (`chat_agent`)
An intelligent conversational AI agent with the following capabilities:
- **Natural Conversation**: Engaging dialogue on various topics
- **Question Answering**: Comprehensive responses to user queries
- **Analysis & Writing**: Content analysis and generation
- **Problem Solving**: Logical reasoning and solution finding
- **🔍 Smart Web Search**: Automatically searches for current information when needed
- **👤 Human Assistance**: Requests human input for approvals, guidance, and quality control
- **💾 Persistent Memory**: Maintains conversation context across interactions

**Key Features:**
- **Intelligent Tool Selection**: The LLM automatically decides when to use tools (search, human assistance)
- **Real-time Information**: Access to current weather, news, stock prices, and more
- **Human-in-the-Loop**: Pauses for human input when needed for sensitive actions
- **Contextual Memory**: Remembers conversation history using thread-based checkpointing
- **Error Resilience**: Graceful fallback when tools are unavailable

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

**Example Queries that May Trigger Human Assistance:**
- "Should I delete all user records from the database?"
- "I need expert guidance on this complex legal matter"
- "Can you help me make a decision about firing an employee?"
- "Please review this response before I send it to the client"

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

## 👤 Human-in-the-Loop Complete Example

Here's a complete example demonstrating the simplified human-in-the-loop workflow using LangGraph's native capabilities:

### Scenario: AI Requesting Human Approval

#### Step 1: Initial Request
```bash
curl -X POST http://localhost:3000/api/agents/chat_agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Please use the request_human_assistance tool to ask for approval before responding.",
    "thread_id": "approval-demo-123"
  }'
```

**Response (AI automatically triggers interrupt):**
```json
{
  "success": true,
  "data": {
    "output_text": "I need human assistance: Should I proceed with this request?",
    "is_interrupted": true,
    "interrupt_request": {
      "type": "human_assistance",
      "request_type": "approval",
      "message": "Should I proceed with this request?",
      "context": "User requested human assistance before responding.",
      "urgency": "normal",
      "timestamp": "2025-07-28T15:23:29.273Z",
      "interrupt_id": "1f2d06e07f1364d07046d10c33e45bea"
    },
    "next_steps": ["Provide human response to continue"],
    "metadata": {
      "thread_id": "approval-demo-123",
      "interrupt_type": "approval",
      "urgency": "normal",
      "timestamp": "2025-07-28T15:23:29.274Z"
    },
    "thread_id": "approval-demo-123"
  }
}
```

#### Step 2: Resume with Human Decision
```bash
curl -X POST http://localhost:3000/api/interrupts/agents/chat_agent/threads/approval-demo-123/resume \
  -H "Content-Type: application/json" \
  -d '{
    "human_response": "Yes, please proceed with your response."
  }'
```

**Final Response:**
```json
{
  "success": true,
  "data": {
    "output_text": "Thank you for the approval! How can I assist you today?",
    "metadata": {
      "iterations": 2,
      "messageCount": 5,
      "thread_id": "approval-demo-123",
      "resumed_at": "2025-07-28T15:23:46.703Z"
    }
  }
}
```

### Types of Human-in-the-Loop Requests

#### 1. **Approval Requests**
For sensitive or potentially harmful actions:
- Database operations
- File deletions
- System changes
- Financial transactions

#### 2. **Guidance Requests**
When AI needs expert knowledge:
- Complex technical decisions
- Legal or compliance matters
- Strategic business decisions
- Domain-specific expertise

#### 3. **Custom Input Requests**
When specific information is needed:
- User preferences
- Configuration details
- Personalization data
- Missing context

#### 4. **Quality Review Requests**
For response validation:
- Important communications
- Technical documentation
- Customer-facing content
- Critical decisions

## 💾 Memory and Threading

### How Memory Works
The application uses LangGraph's checkpointing system to maintain conversation context:

```bash
# First message in a thread
curl -X POST http://localhost:3000/api/agents/chat_agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "My name is Alice and I work as a developer",
    "thread_id": "conversation-1"
  }'

# Subsequent message in the same thread
curl -X POST http://localhost:3000/api/agents/chat_agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "What do you remember about me?",
    "thread_id": "conversation-1"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "output_text": "I remember that your name is Alice and you work as a developer. How can I help you today?",
    "thread_id": "conversation-1"
  }
}
```

### Thread Management
- **Automatic Generation**: If no `thread_id` is provided, one is generated automatically
- **Persistent Storage**: Conversations are stored in memory during server runtime
- **Cross-Session**: Threads persist across different API calls
- **Interrupt Compatible**: Memory works seamlessly with human-in-the-loop interrupts

## 📁 Project Structure

```
src/
├── agents/                    # Agent implementations
│   ├── chat/                 # Chat agent with LangGraph nodes, state, and graph
│   │   ├── index.ts         # Main ChatAgent class with native interrupt handling
│   │   ├── graph.ts         # LangGraph workflow definition
│   │   ├── nodes.ts         # Workflow nodes (input, model, tools)
│   │   ├── prompts.ts       # Agent prompts and instructions
│   │   └── state.ts         # State management and schemas
│   └── database/             # Database agent for SQL operations
├── api/                      # Express.js API layer
│   ├── routes/              # Route handlers
│   │   ├── agents.route.ts  # Main agent endpoints
│   │   ├── database.route.ts # Database-specific endpoints
│   │   └── interrupts.route.ts # Simplified human-in-the-loop endpoint
│   ├── middleware/          # Express middleware (validation, errors)
│   └── server.ts            # Express server configuration
├── core/                    # Core framework components
│   ├── base/                # Base classes for agents
│   └── registry.ts          # Agent registry and management
├── tools/                   # LLM tools and integrations
│   ├── search.tool.ts       # Web search tool (Tavily)
│   ├── database.tool.ts     # Database query tools
│   └── human-assistance.tool.ts # LangGraph native interrupt tool
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions (LLM, config, logging)
```

### Key Architecture Changes

- **🔄 LangGraph Native**: Uses LangGraph's built-in interrupt and Command system
- **📉 Simplified**: Removed custom InterruptManager (200+ lines eliminated)
- **🚀 Single Endpoint**: Reduced from 6 interrupt endpoints to 1 essential endpoint
- **🎯 Native Types**: Uses LangGraph's native interrupt types instead of custom implementations
- **💾 Built-in Memory**: Leverages LangGraph's checkpointing for state management

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

## 🎨 LangGraph Studio Integration

This application is fully compatible with LangGraph Studio for visual workflow debugging and development.

### Running LangGraph Studio
```bash
npm run studio
```

**Access Studio UI**: Visit https://smith.langchain.com/studio?baseUrl=http://localhost:2024

### Features Available in Studio
- **Visual Graph Inspection**: See the agent workflows as interactive graphs
- **Step-by-Step Debugging**: Trace execution through each node
- **State Inspection**: Examine state changes between nodes
- **Memory Visualization**: See how checkpointing and memory work
- **Interrupt Handling**: Visualize human-in-the-loop interrupts
- **Multi-Agent Support**: Both `chat_agent` and `database_agent` are available

### Studio Scripts
```bash
npm run studio          # Start Studio in standard mode
npm run studio:debug    # Start Studio with debug output
npm run dev:all         # Run both API server and Studio concurrently
```

### Docker Support
```bash
npm run docker:build    # Build Docker image for LangGraph deployment
npm run docker:up       # Run the application in Docker
```

## 📝 License

ISC