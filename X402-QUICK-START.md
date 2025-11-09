# 🚀 X402 Monetization Agent - Quick Start

Get up and running with x402 payments in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Create a `.env` file:

```env
PAYMENT_WALLET=0xYourWalletAddress
DEFAULT_NETWORK=base-sepolia
```

## Step 3: Start Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Step 4: Register a Service

### Option A: Using Dashboard
1. Open `http://localhost:3000/monetization-dashboard.html`
2. Click "Register New Service"
3. Fill in the form and submit

### Option B: Using API
```bash
curl -X POST http://localhost:3000/api/monetization/services \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-api",
    "name": "My API",
    "type": "api",
    "price": "0.10",
    "network": "base-sepolia",
    "payTo": "0xYourWalletAddress",
    "enabled": true
  }'
```

## Step 5: Protect an Endpoint

```typescript
import { getMonetizationAgent } from './services/monetizationAgent';

const agent = getMonetizationAgent();

app.post('/api/my-service',
  agent.createPaymentMiddleware('my-api'),
  async (req, res) => {
    // Payment verified - deliver service
    res.json({ success: true, data: '...' });
  }
);
```

## Step 6: Test Payment Flow

### Browser Test
1. Open `http://localhost:3000/x402-client-example.html`
2. Connect your wallet (MetaMask/Coinbase Wallet)
3. Make a payment request to your service
4. Confirm payment in wallet
5. Service should be delivered!

### API Test
```bash
# Get payment requirements (will return 402)
curl -X POST http://localhost:3000/api/my-service \
  -H "Content-Type: application/json" \
  -d '{}'

# Response includes payment requirements
# Use @coinbase/x402 SDK to create payment payload
# Then make request with paymentPayload
```

## Step 7: View Analytics

```bash
# Get statistics
curl http://localhost:3000/api/monetization/stats

# View dashboard
open http://localhost:3000/monetization-dashboard.html
```

## 🎉 Done!

Your x402 monetization agent is now running. Start accepting micropayments!

## Common Use Cases

### API Service
- Price: $0.10 per request
- Rate limit: 60 requests/minute
- Perfect for: AI inference, data queries

### Content Paywall
- Price: $0.05 per article
- Perfect for: Premium articles, videos

### Microservice
- Price: $0.25 per conversion
- Perfect for: File converters, validators

## Next Steps

- Read [X402-MONETIZATION-COMPLETE.md](./X402-MONETIZATION-COMPLETE.md) for full documentation
- Check out [X402-MONETIZATION-AGENT.md](./X402-MONETIZATION-AGENT.md) for detailed guide
- Explore example services in `src/services/exampleServices.ts`

## Need Help?

- Check the complete documentation
- Review API examples
- Test with testnet USDC first

Happy monetizing! 💰

