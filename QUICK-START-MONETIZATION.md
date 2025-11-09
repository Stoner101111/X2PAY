# 🚀 Quick Start - X402 Monetization Agent

## Start in 3 Steps

### Step 1: Start the Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### Step 2: Open the Dashboard

Visit: **http://localhost:3000/monetization-dashboard.html**

### Step 3: Register Your First Service

1. Click the **"Register Service"** tab
2. Fill in the form:
   - **Service ID**: `my-first-service`
   - **Service Name**: `My First Service`
   - **Type**: Choose from API, Content, Microservice, IoT, or AI Agent
   - **Price**: `0.10` (10 cents in USDC)
   - **Network**: `base-sepolia` (for testing)
   - **Pay To**: Your wallet address (starting with `0x`)
3. Click **"Register Service"**

## ✅ You're Ready!

Your service is now registered and ready to accept payments. The system includes 5 example services that are already set up:

1. **Data Query API** - `/api/services/data-query`
2. **Premium Article** - `/api/services/content/:articleId`
3. **File Converter** - `/api/services/convert-file`
4. **AI Agent Processing** - `/api/services/ai-process`
5. **IoT Device Access** - `/api/services/iot-access`

## 🧪 Test a Payment

### Using cURL

```bash
# Try to access a service (will return 402 Payment Required)
curl -X POST http://localhost:3000/api/services/data-query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

You'll get a `402 Payment Required` response with payment requirements.

### Using the Dashboard

1. Go to **"Services"** tab to see all registered services
2. Go to **"Analytics"** tab to see revenue statistics
3. Go to **"Payments"** tab to view payment history

## 📊 View Stats

```bash
curl http://localhost:3000/api/monetization/stats
```

## 🔧 Protect Your Own Endpoint

Add payment middleware to any endpoint:

```typescript
// In your route file
import { getMonetizationAgent } from './services/monetizationAgent';

const agent = getMonetizationAgent();

// Register your service first (or use dashboard)
agent.registerService({
  id: 'my-api',
  name: 'My API',
  type: 'api',
  price: '0.10',
  network: 'base-sepolia',
  payTo: '0xYourAddress',
  enabled: true
});

// Protect your endpoint
app.post('/api/my-endpoint',
  agent.createPaymentMiddleware('my-api'),
  (req, res) => {
    // Payment verified! Process request
    res.json({ success: true, data: '...' });
  }
);
```

## 📚 Full Documentation

See **[X402-MONETIZATION-AGENT.md](X402-MONETIZATION-AGENT.md)** for complete API reference and examples.

## 🎯 Next Steps

1. ✅ Register your services
2. ✅ Test with testnet USDC
3. ✅ Integrate into your endpoints
4. ✅ Monitor revenue in dashboard
5. ✅ Deploy to production

**Happy monetizing! 💰**

