# 💰 X402 Monetization Agent - Complete Guide

## 🎯 Overview

The X402 Monetization Agent is a complete system for monetizing digital services, content, APIs, and tools using x402 micropayments. It enables instant, automated pay-per-use transactions without requiring user accounts, subscriptions, or manual checkouts.

## ✨ Features

- **Multiple Monetization Models**: Support for APIs, digital content, microservices, AI agents, and IoT devices
- **Automatic Payment Processing**: Verify and settle payments automatically
- **Payment Tracking**: Complete analytics and revenue tracking
- **Easy Integration**: Simple middleware to protect any endpoint
- **Management Dashboard**: Web-based interface to manage services
- **Multiple Networks**: Support for Base, Polygon, Avalanche, and more

## 🚀 Quick Start

### 1. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 2. Access the Dashboard

Open `http://localhost:3000/monetization-dashboard.html` in your browser.

### 3. Register Your First Service

Use the dashboard or API to register a service:

```bash
curl -X POST http://localhost:3000/api/monetization/services \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-api",
    "name": "My API Service",
    "type": "api",
    "price": "0.10",
    "network": "base-sepolia",
    "payTo": "0xYourWalletAddress",
    "description": "Premium API access",
    "enabled": true
  }'
```

## 📋 API Reference

### Service Management

#### List All Services
```bash
GET /api/monetization/services
```

#### Get Service by ID
```bash
GET /api/monetization/services/:serviceId
```

#### Register Service
```bash
POST /api/monetization/services
Content-Type: application/json

{
  "id": "service-id",
  "name": "Service Name",
  "type": "api|content|microservice|iot|ai_agent",
  "price": "0.10",
  "network": "base-sepolia",
  "payTo": "0x...",
  "description": "Optional description",
  "enabled": true
}
```

#### Get Payment Requirements
```bash
GET /api/monetization/services/:serviceId/payment-requirements
```

Returns payment requirements in x402 format that clients can use to make payments.

### Payment Processing

#### Verify Payment
```bash
POST /api/monetization/payments/verify
Content-Type: application/json

{
  "serviceId": "my-api",
  "paymentPayload": {
    "x402Version": 1,
    "scheme": "exact",
    "network": "base-sepolia",
    "payload": {
      "signature": "...",
      "authorization": {
        "from": "0x...",
        "to": "0x...",
        "value": "100000000",
        "validAfter": "...",
        "validBefore": "...",
        "nonce": "..."
      }
    }
  }
}
```

#### Get Payment Record
```bash
GET /api/monetization/payments/:paymentId
```

#### Get Payments for Service
```bash
GET /api/monetization/services/:serviceId/payments
```

### Analytics

#### Get Statistics
```bash
GET /api/monetization/stats
```

Returns:
- Total revenue
- Total payments
- Successful/failed payments
- Revenue by service
- Revenue by network

## 🔧 Integration Examples

### Protecting an API Endpoint

```typescript
import { getMonetizationAgent } from './services/monetizationAgent';

const agent = getMonetizationAgent();

// Register your service
agent.registerService({
  id: 'my-api',
  name: 'My API',
  type: ServiceType.API,
  price: '0.10',
  network: 'base-sepolia',
  payTo: '0xYourWalletAddress',
  enabled: true
});

// Protect your endpoint
app.post('/api/my-endpoint',
  agent.createPaymentMiddleware('my-api'),
  async (req, res) => {
    // Payment verified - process request
    const paymentId = req.paymentId;
    // Your business logic here
    res.json({ success: true, data: '...' });
  }
);
```

### Client-Side Payment Flow

```javascript
// 1. Get payment requirements
const requirementsResponse = await fetch(
  `/api/monetization/services/my-api/payment-requirements`
);
const { requirements } = await requirementsResponse.json();

// 2. Sign payment with wallet (using @coinbase/x402 or similar)
const paymentPayload = await signPayment(requirements);

// 3. Make request with payment
const apiResponse = await fetch('/api/my-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentPayload,
    // Your request data
  })
});

if (apiResponse.status === 402) {
  // Payment required - handle payment flow
  const { requirements } = await apiResponse.json();
  // Show payment UI to user
} else {
  // Payment verified - get response
  const data = await apiResponse.json();
}
```

## 🎨 Monetization Models

### 1. Pay-Per-Request APIs

Charge for each API call, data query, or cloud service usage.

**Use Cases:**
- AI model inference
- Data queries
- Cloud compute time
- Storage access

**Example:**
```typescript
agent.registerService({
  id: 'ai-inference',
  name: 'AI Model Inference',
  type: ServiceType.API,
  price: '0.25', // $0.25 per inference
  network: 'base',
  payTo: '0x...',
  enabled: true
});
```

### 2. Digital Content Micropayments

Charge per article view, video playback, or digital download.

**Use Cases:**
- Premium articles
- Video content
- Digital downloads
- Music streaming

**Example:**
```typescript
agent.registerService({
  id: 'premium-article',
  name: 'Premium Article',
  type: ServiceType.CONTENT,
  price: '0.05', // $0.05 per article
  network: 'base',
  payTo: '0x...',
  enabled: true
});
```

### 3. Microservices & Tools

Monetize small, focused tools on-demand.

**Use Cases:**
- File converters
- Data validators
- Image generators
- Code formatters

**Example:**
```typescript
agent.registerService({
  id: 'file-converter',
  name: 'File Format Converter',
  type: ServiceType.MICROSERVICE,
  price: '0.25', // $0.25 per conversion
  network: 'base',
  payTo: '0x...',
  enabled: true
});
```

### 4. AI Agent Commerce

Enable AI agents to autonomously pay for services.

**Use Cases:**
- Agent-to-agent payments
- Autonomous data access
- Tool usage fees
- Service orchestration

**Example:**
```typescript
agent.registerService({
  id: 'ai-agent-process',
  name: 'AI Agent Processing',
  type: ServiceType.AI_AGENT,
  price: '0.50', // $0.50 per task
  network: 'base',
  payTo: '0x...',
  enabled: true
});
```

### 5. IoT Device Payments

Enable smart devices to autonomously pay for services.

**Use Cases:**
- Device data access
- Maintenance services
- Replacement parts
- Service subscriptions

**Example:**
```typescript
agent.registerService({
  id: 'iot-device-access',
  name: 'IoT Device Data',
  type: ServiceType.IOT,
  price: '0.02', // $0.02 per access
  network: 'base',
  payTo: '0x...',
  enabled: true
});
```

## 🔐 Security Features

- **Payment Verification**: Cryptographic signature verification
- **Nonce Protection**: Prevents duplicate payments
- **Time-Windowed Authorization**: Expires after timeout
- **Network Validation**: Ensures correct blockchain network
- **Automatic Settlement**: Secure on-chain settlement

## 📊 Monitoring & Analytics

### Dashboard Features

- Real-time revenue tracking
- Payment statistics
- Service performance
- Network analytics
- Revenue breakdown by service/network

### Access Dashboard

Visit `http://localhost:3000/monetization-dashboard.html`

## 🌐 Supported Networks

### Testnets
- Base Sepolia
- Polygon Amoy
- Avalanche Fuji

### Mainnets
- Base
- Polygon
- Avalanche
- Sei
- IoTeX
- Peaq

## 🔄 Payment Flow

1. **Client requests service** → Server returns 402 Payment Required with requirements
2. **Client signs payment** → Uses wallet to sign payment authorization
3. **Client sends payment** → Includes signed payment payload in request
4. **Server verifies** → Validates signature and authorization
5. **Server settles** → Completes transaction on blockchain
6. **Service delivered** → Client receives requested resource

## 📝 Environment Variables

Optional configuration in `.env`:

```env
# Payment wallet address (defaults to placeholder)
PAYMENT_WALLET=0xYourWalletAddress

# Network defaults
DEFAULT_NETWORK=base-sepolia
```

## 🧪 Testing

### Test Payment Flow

1. Register a test service
2. Get payment requirements
3. Use testnet USDC to make payments
4. Verify payments appear in dashboard
5. Check analytics

### Example Test

```bash
# Register service
curl -X POST http://localhost:3000/api/monetization/services \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-api",
    "name": "Test API",
    "type": "api",
    "price": "0.01",
    "network": "base-sepolia",
    "payTo": "0xYourAddress",
    "enabled": true
  }'

# Get requirements
curl http://localhost:3000/api/monetization/services/test-api/payment-requirements

# Get stats
curl http://localhost:3000/api/monetization/stats
```

## 📚 Additional Resources

- [x402 Protocol Documentation](https://x402.org)
- [Coinbase x402 Facilitator](https://www.x402.org/facilitator)
- [x402 SDK](https://github.com/coinbase/x402)

## 🎉 Success!

Your X402 Monetization Agent is ready to monetize any service with instant micropayments!

**Next Steps:**
1. Register your services via dashboard or API
2. Integrate payment middleware into your endpoints
3. Start accepting USDC payments
4. Monitor revenue in the dashboard

**Happy monetizing! 🚀**

