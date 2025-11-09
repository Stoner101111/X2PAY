# 💰 X402 Monetization Agent - Complete Implementation Guide

## 🎯 Overview

This is a complete, production-ready x402 monetization agent that enables instant, automated micropayments for digital services, content, APIs, and tools. It eliminates the need for user accounts, subscriptions, or manual checkouts, making small, frequent transactions viable and efficient.

## ✨ Key Features

### Core Capabilities
- **Multiple Monetization Models**: Support for APIs, digital content, microservices, AI agents, IoT devices, cloud services, storage, and compute
- **Automatic Payment Processing**: Verify and settle payments automatically via x402 facilitator
- **Payment Tracking & Analytics**: Complete revenue analytics with breakdowns by service, network, and type
- **Rate Limiting**: Per-service rate limiting to prevent abuse
- **Webhook Support**: Real-time payment notifications via webhooks
- **Easy Integration**: Simple Express middleware to protect any endpoint
- **Multiple Networks**: Support for Base, Polygon, Avalanche, Sei, IoTeX, Peaq, and more

### Monetization Models Supported

1. **Pay-Per-Request APIs/Cloud Services**
   - Charge for each API call, data query, or cloud service usage
   - Perfect for AI model inference, storage access, compute time
   - Example: $0.10 per API call

2. **Digital Content & Media Micropayments**
   - Paywall for articles, videos, digital downloads
   - Alternative to ads or bulk subscriptions
   - Example: $0.05 per article view

3. **Autonomous AI Agent Commerce**
   - AI agents can automatically pay for data, tools, or other services
   - Machine-to-machine economy
   - Example: $0.50 per AI processing task

4. **Microservices and Tooling**
   - Monetize small, focused tools on-demand
   - File converters, data validators, image generators
   - Example: $0.25 per file conversion

5. **IoT Device Payments**
   - Smart devices autonomously pay for services
   - Data access, maintenance, replacement parts
   - Example: $0.02 per device data access

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file:

```env
# Payment wallet address (EVM format, e.g., 0x...)
PAYMENT_WALLET=0xYourWalletAddress

# Default network (base-sepolia, base, polygon, etc.)
DEFAULT_NETWORK=base-sepolia

# Optional: Webhook URL for payment notifications
WEBHOOK_URL=https://your-webhook-endpoint.com/payments
```

### 3. Start the Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### 4. Register Your First Service

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
    "enabled": true,
    "rateLimit": {
      "requestsPerMinute": 60,
      "requestsPerHour": 1000
    }
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
  "type": "api|content|microservice|iot|ai_agent|cloud_service|storage|compute",
  "price": "0.10",
  "network": "base-sepolia",
  "payTo": "0x...",
  "description": "Optional description",
  "enabled": true,
  "rateLimit": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000,
    "requestsPerDay": 10000
  },
  "webhookUrl": "https://your-webhook.com/payments"
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
GET /api/monetization/services/:serviceId/payments?limit=10
```

#### Get Payments by Payer
```bash
GET /api/monetization/payments/payer/:payerAddress?limit=10
```

### Analytics

#### Get Statistics
```bash
GET /api/monetization/stats
```

Returns:
- Total revenue
- Total payments (successful, failed, pending)
- Revenue by service
- Revenue by network
- Revenue by type
- Hourly revenue (last 24 hours)
- Recent payments

## 🔧 Integration Examples

### Protecting an API Endpoint

```typescript
import { getEnhancedMonetizationAgent } from './services/enhancedMonetizationAgent';
import { ServiceType } from './services/enhancedMonetizationAgent';

const agent = getEnhancedMonetizationAgent();

// Register your service
agent.registerService({
  id: 'my-api',
  name: 'My API',
  type: ServiceType.API,
  price: '0.10',
  network: 'base-sepolia',
  payTo: process.env.PAYMENT_WALLET!,
  enabled: true,
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000
  },
  webhookUrl: process.env.WEBHOOK_URL
});

// Protect your endpoint
app.post('/api/my-endpoint',
  agent.createPaymentMiddleware('my-api'),
  async (req, res) => {
    // Payment verified - process request
    const paymentId = (req as any).paymentId;
    const paymentAmount = (req as any).paymentAmount;
    
    // Your business logic here
    const result = await processRequest(req.body);
    
    res.json({
      success: true,
      data: result,
      paymentId,
      message: 'Request processed successfully'
    });
  }
);
```

### Client-Side Payment Flow

```javascript
// Using the X402 Client SDK
import { createX402Client, BrowserWalletAdapter } from './clients/x402Client';

const client = createX402Client();
const wallet = new BrowserWalletAdapter(window.ethereum);

// Complete payment flow
try {
  const result = await client.payForService(
    'http://localhost:3000/api/services/data-query',
    wallet,
    { query: 'example query' },
    (stage) => console.log(`Payment stage: ${stage}`)
  );
  
  console.log('Service delivered:', result);
} catch (error) {
  if (error.name === 'PaymentRequiredError') {
    // Handle payment requirement
    console.log('Payment required:', error.requirements);
  } else {
    console.error('Error:', error);
  }
}
```

### Browser Example

See `public/x402-client-example.html` for a complete browser-based example using MetaMask or Coinbase Wallet.

## 🎨 Monetization Model Examples

### 1. Pay-Per-Request API

```typescript
agent.registerService({
  id: 'ai-inference',
  name: 'AI Model Inference',
  type: ServiceType.API,
  price: '0.25', // $0.25 per inference
  network: 'base',
  payTo: '0x...',
  enabled: true,
  description: 'GPT-4 inference API',
  metadata: {
    model: 'gpt-4',
    maxTokens: 4000
  }
});
```

### 2. Digital Content Paywall

```typescript
agent.registerService({
  id: 'premium-article',
  name: 'Premium Article',
  type: ServiceType.CONTENT,
  price: '0.05', // $0.05 per article
  network: 'base',
  payTo: '0x...',
  enabled: true,
  description: 'Access premium article content'
});
```

### 3. File Conversion Microservice

```typescript
agent.registerService({
  id: 'file-converter',
  name: 'File Format Converter',
  type: ServiceType.MICROSERVICE,
  price: '0.25', // $0.25 per conversion
  network: 'base',
  payTo: '0x...',
  enabled: true,
  metadata: {
    supportedFormats: ['pdf', 'docx', 'txt', 'html'],
    maxFileSize: '10MB'
  }
});
```

### 4. AI Agent Processing

```typescript
agent.registerService({
  id: 'ai-agent-process',
  name: 'AI Agent Processing',
  type: ServiceType.AI_AGENT,
  price: '0.50', // $0.50 per task
  network: 'base',
  payTo: '0x...',
  enabled: true,
  description: 'AI agent processing and task execution'
});
```

### 5. IoT Device Data Access

```typescript
agent.registerService({
  id: 'iot-device-access',
  name: 'IoT Device Data',
  type: ServiceType.IOT,
  price: '0.02', // $0.02 per access
  network: 'base',
  payTo: '0x...',
  enabled: true,
  metadata: {
    deviceTypes: ['sensor', 'actuator', 'gateway'],
    dataTypes: ['temperature', 'humidity', 'pressure']
  }
});
```

### 6. Cloud Storage Service

```typescript
agent.registerService({
  id: 'cloud-storage',
  name: 'Cloud Storage',
  type: ServiceType.STORAGE,
  price: '0.01', // $0.01 per GB stored per day
  network: 'base',
  payTo: '0x...',
  enabled: true,
  description: 'Pay-per-use cloud storage'
});
```

### 7. Compute Service

```typescript
agent.registerService({
  id: 'compute-time',
  name: 'Compute Time',
  type: ServiceType.COMPUTE,
  price: '0.10', // $0.10 per compute hour
  network: 'base',
  payTo: '0x...',
  enabled: true,
  description: 'On-demand compute resources'
});
```

## 🔐 Security Features

- **Payment Verification**: Cryptographic signature verification via x402 facilitator
- **Nonce Protection**: Prevents duplicate payments
- **Time-Windowed Authorization**: Payments expire after timeout
- **Network Validation**: Ensures correct blockchain network
- **Automatic Settlement**: Secure on-chain settlement
- **Rate Limiting**: Per-service rate limiting to prevent abuse
- **Webhook Verification**: (Recommended) Verify webhook signatures

## 📊 Monitoring & Analytics

### Dashboard Features

Access the monetization dashboard at `http://localhost:3000/monetization-dashboard.html`:

- Real-time revenue tracking
- Payment statistics (total, successful, failed, pending)
- Service performance metrics
- Network analytics
- Revenue breakdown by service/network/type
- Hourly revenue charts
- Recent payment history

### API Analytics Endpoint

```bash
GET /api/monetization/stats
```

Returns comprehensive statistics including:
- Total revenue and payment counts
- Breakdown by service, network, and type
- Hourly revenue for last 24 hours
- Recent payment records

## 🌐 Supported Networks

### Testnets
- Base Sepolia (84532)
- Polygon Amoy (80002)
- Avalanche Fuji (43113)
- Sei Testnet (1328)

### Mainnets
- Base (8453)
- Polygon (137)
- Avalanche (43114)
- Sei (1329)
- IoTeX (4689)
- Peaq (3338)

## 🔄 Payment Flow

1. **Client requests service** → Server returns 402 Payment Required with requirements
2. **Client signs payment** → Uses wallet to sign payment authorization (EIP-712)
3. **Client sends payment** → Includes signed payment payload in request
4. **Server verifies** → Validates signature and authorization via x402 facilitator
5. **Server settles** → Completes transaction on blockchain
6. **Webhook triggered** → (Optional) Notifies webhook URL
7. **Service delivered** → Client receives requested resource

## 📝 Environment Variables

Required:
```env
PAYMENT_WALLET=0xYourWalletAddress
```

Optional:
```env
DEFAULT_NETWORK=base-sepolia
WEBHOOK_URL=https://your-webhook-endpoint.com/payments
NODE_ENV=production
```

## 🧪 Testing

### Test Payment Flow

1. Register a test service
2. Get payment requirements
3. Use testnet USDC to make payments
4. Verify payments appear in dashboard
5. Check analytics

### Example Test Script

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

## 🚀 Production Deployment

### Best Practices

1. **Use Environment Variables**: Never hardcode wallet addresses or keys
2. **Enable Webhooks**: Set up webhook URLs for payment notifications
3. **Configure Rate Limits**: Set appropriate rate limits for each service
4. **Monitor Analytics**: Regularly check revenue and payment statistics
5. **Use Mainnet**: Switch to mainnet networks for production
6. **Set Up Alerts**: Monitor failed payments and errors

### Deployment Checklist

- [ ] Configure production wallet address
- [ ] Set up webhook endpoint
- [ ] Configure rate limits for all services
- [ ] Test payment flow on testnet
- [ ] Switch to mainnet networks
- [ ] Set up monitoring and alerts
- [ ] Configure backup for payment records
- [ ] Set up analytics dashboard

## 📚 Additional Resources

- [x402 Protocol Documentation](https://x402.org)
- [Coinbase x402 Facilitator](https://www.x402.org/facilitator)
- [x402 SDK (@coinbase/x402)](https://github.com/coinbase/x402)
- [EIP-712 Typed Data Signing](https://eips.ethereum.org/EIPS/eip-712)

## 🎉 Success!

Your X402 Monetization Agent is ready to monetize any service with instant micropayments!

**Next Steps:**
1. Register your services via dashboard or API
2. Integrate payment middleware into your endpoints
3. Test with testnet USDC
4. Deploy to production with mainnet
5. Monitor revenue in the dashboard

**Happy monetizing! 🚀**

