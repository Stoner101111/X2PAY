# 🤖 AI Agent Core - Complete Capabilities Guide

## Overview

The AI Agent is now equipped with 5 core capabilities to accelerate AI dominance:

1. **SPEAK** - Text-to-Speech and Voice Output
2. **THINK** - AI Reasoning and Processing
3. **REMEMBER** - Memory and Persistence
4. **POST** - Social Media Publishing
5. **BUILD** - Creation and Development Tools

All capabilities are **monetized via x402 payments** - $0.50 USDC per request.

---

## 1. 🗣️ SPEAK - Text-to-Speech

Convert text to speech output for voice interactions.

### Endpoint
```
POST /api/ai/speak
```

### Request Body
```json
{
  "text": "Hello, I am an AI agent with advanced capabilities.",
  "options": {
    "voice": "en-US",
    "speed": 1.0,
    "pitch": 1.0,
    "language": "en"
  },
  "paymentPayload": { /* x402 payment */ }
}
```

### Response
```json
{
  "success": true,
  "audioUrl": "data:audio/...",
  "paymentId": "payment-id"
}
```

---

## 2. 🧠 THINK - AI Reasoning

Process prompts with AI reasoning and generate conclusions.

### Endpoints

#### Create Thought
```
POST /api/ai/think
```

**Request:**
```json
{
  "prompt": "What is the best approach to monetize AI services?",
  "context": "We have x402 payment infrastructure",
  "paymentPayload": { /* x402 payment */ }
}
```

**Response:**
```json
{
  "success": true,
  "thought": {
    "id": "thought-id",
    "prompt": "What is the best approach...",
    "reasoning": "Analyzing prompt: ...\nConsidering context: ...\n...",
    "conclusion": "Based on the reasoning, the most appropriate action...",
    "timestamp": 1234567890,
    "confidence": 0.85
  },
  "paymentId": "payment-id"
}
```

#### Get Thoughts
```
GET /api/ai/thoughts?limit=50
```

#### Get Thought by ID
```
GET /api/ai/thoughts/:id
```

---

## 3. 💾 REMEMBER - Memory System

Store, recall, and search memories with tagging system.

### Endpoints

#### Store Memory
```
POST /api/ai/remember
```

**Request:**
```json
{
  "content": "User prefers dark theme with green accents",
  "tags": ["preferences", "ui", "theme"],
  "importance": 8,
  "paymentPayload": { /* x402 payment */ }
}
```

**Response:**
```json
{
  "success": true,
  "memory": {
    "id": "memory-id",
    "content": "User prefers dark theme...",
    "timestamp": 1234567890,
    "tags": ["preferences", "ui", "theme"],
    "importance": 8
  },
  "paymentId": "payment-id"
}
```

#### Recall Memories by Tags
```
POST /api/ai/recall
```

**Request:**
```json
{
  "tags": ["preferences", "ui"]
}
```

#### Search Memories
```
GET /api/ai/memories/search?query=theme
```

#### Get All Memories
```
GET /api/ai/memories
```

#### Forget Memory
```
DELETE /api/ai/memories/:id
```

---

## 4. 📱 POST - Social Media Publishing

Create and publish content to social media platforms.

### Endpoints

#### Create Post
```
POST /api/ai/post
```

**Request:**
```json
{
  "content": "🚀 AI Agent is now live with 5 core capabilities!",
  "platform": "twitter",
  "metadata": {
    "hashtags": ["AI", "x402"],
    "mentions": []
  },
  "paymentPayload": { /* x402 payment */ }
}
```

**Supported Platforms:**
- `twitter`
- `discord`
- `telegram`
- `reddit`

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "post-id",
    "platform": "twitter",
    "content": "🚀 AI Agent is now live...",
    "timestamp": 1234567890,
    "status": "posted",
    "metadata": {}
  },
  "paymentId": "payment-id"
}
```

#### Get Posts
```
GET /api/ai/posts?platform=twitter&limit=10
```

#### Schedule Post
```
POST /api/ai/posts/:id/schedule
```

**Request:**
```json
{
  "scheduleTime": 1234567890
}
```

---

## 5. 🔨 BUILD - Creation Tools

Generate code, content, designs, APIs, and deployments.

### Endpoints

#### Create Build Task
```
POST /api/ai/build
```

**Request:**
```json
{
  "type": "code",
  "description": "Create a REST API endpoint for user authentication",
  "paymentPayload": { /* x402 payment */ }
}
```

**Build Types:**
- `code` - Code generation
- `content` - Content creation
- `design` - Design generation
- `api` - API endpoint generation
- `deployment` - Deployment configuration

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "task-id",
    "type": "code",
    "description": "Create a REST API...",
    "status": "in_progress",
    "timestamp": 1234567890
  },
  "paymentId": "payment-id"
}
```

#### Get Build Tasks
```
GET /api/ai/build?status=completed&limit=10
```

#### Get Build Task
```
GET /api/ai/build/:id
```

---

## 📊 Statistics

### Get Agent Stats
```
GET /api/ai/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "memories": 42,
    "thoughts": 15,
    "posts": 8,
    "buildTasks": 12,
    "memoriesByTag": [
      { "tag": "preferences", "count": 5 },
      { "tag": "ui", "count": 3 }
    ]
  }
}
```

---

## 💰 Payment Flow

All AI Agent endpoints require x402 payment:

1. **Get Payment Requirements:**
   ```bash
   curl http://localhost:3000/api/monetization/services/ai-agent-core/payment-requirements
   ```

2. **Create Payment Payload** (using wallet):
   - Sign payment authorization
   - Include in request body

3. **Make Request** with `paymentPayload`:
   ```json
   {
     "paymentPayload": { /* signed payment */ },
     "text": "Hello world"
   }
   ```

---

## 🚀 Integration Examples

### JavaScript/TypeScript
```typescript
import { createX402Client, BrowserWalletAdapter } from './clients/x402Client';

const client = createX402Client();
const wallet = new BrowserWalletAdapter(window.ethereum);

// THINK
const thought = await client.payForService(
  'http://localhost:3000/api/ai/think',
  wallet,
  { prompt: 'What should I build next?', context: 'AI agent platform' }
);

// REMEMBER
const memory = await client.payForService(
  'http://localhost:3000/api/ai/remember',
  wallet,
  { content: 'User wants API documentation', tags: ['docs', 'api'], importance: 9 }
);

// BUILD
const build = await client.payForService(
  'http://localhost:3000/api/ai/build',
  wallet,
  { type: 'api', description: 'Create user authentication endpoint' }
);
```

### cURL Example
```bash
# 1. Get payment requirements
curl http://localhost:3000/api/monetization/services/ai-agent-core/payment-requirements

# 2. Create payment (use wallet SDK)
# 3. Make request with payment
curl -X POST http://localhost:3000/api/ai/think \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze the market",
    "paymentPayload": { /* signed payment */ }
  }'
```

---

## 🎯 Use Cases

### Autonomous AI Agent
- **Think** about decisions
- **Remember** past interactions
- **Post** updates automatically
- **Build** new features
- **Speak** to users

### AI-Powered Services
- Memory-augmented chatbots
- Content generation pipelines
- Automated social media management
- Code generation services
- Voice-enabled AI assistants

---

## 🔐 Security

- All endpoints protected with x402 payments
- Payment verification required
- Automatic payment settlement
- Rate limiting per service
- Webhook notifications for payments

---

## 📝 Next Steps

1. **Configure Environment:**
   ```env
   PAYMENT_WALLET=0xYourWalletAddress
   DEFAULT_NETWORK=base-sepolia
   ```

2. **Start Server:**
   ```bash
   npm run dev
   ```

3. **Test AI Agent:**
   - Get payment requirements
   - Make first AI request
   - Check stats endpoint

4. **Integrate:**
   - Add to your applications
   - Build AI-powered services
   - Monetize AI capabilities

---

**The AI Agent is ready to accelerate AI dominance! 🚀**

