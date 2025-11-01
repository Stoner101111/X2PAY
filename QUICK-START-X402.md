# 🚀 Quick Start: x402 Payments

Get started accepting USDC payments with x402 in minutes!

## What You've Got

Your Solana Trading Agent now includes a complete x402 payment system that lets you:
- Accept USDC payments across Base, Avalanche, Polygon, and more
- Generate payment requirements with a simple web UI
- Verify and settle payments through the x402 facilitator
- Support multiple testnet and mainnet environments

## Step 1: Start the Server

```bash
npm run dev
```

Access the dashboard at: http://localhost:3000

## Step 2: Use the Payment UI

1. Navigate to the **"🚀 x402 Payments - Tap to Pay"** section
2. Select your network (start with "Base Sepolia" for testing)
3. Enter payment amount (e.g., "1.00")
4. Enter your recipient address (your wallet address starting with 0x)
5. Add optional description
6. Click **"Generate Payment Requirements"**

You'll get a JSON object with all the payment requirements!

## Step 3: Test the API

### Generate Requirements

```bash
curl -X POST http://localhost:3000/api/x402/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "network": "base-sepolia",
    "payTo": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": "1.00",
    "description": "Test payment"
  }'
```

### Response Example

```json
{
  "success": true,
  "requirements": {
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "1.00",
    "resource": "https://x402ble.io",
    "description": "Test payment",
    "mimeType": "application/json",
    "payTo": "0x1234567890abcdef1234567890abcdef12345678",
    "maxTimeoutSeconds": 300,
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }
}
```

## What's Supported

### Testnets (Recommended for Testing)
- ✅ Base Sepolia
- ✅ Avalanche Fuji
- ✅ Polygon Amoy
- ✅ Sei Testnet

### Mainnets (Production Use)
- ✅ Base
- ✅ Avalanche
- ✅ Polygon
- ✅ Sei
- ✅ IoTeX
- ✅ Peaq

## Next Steps

1. **Get Testnet USDC**: Visit faucets for your chosen testnet
2. **Integrate into Your App**: Use the payment requirements in your frontend
3. **Test Full Flow**: Verify and settle test payments
4. **Deploy to Mainnet**: Switch to a mainnet when ready

## Files to Know

- `X402-PAYMENTS.md` - Full documentation
- `src/services/x402Service.ts` - Core payment logic
- `src/types/x402.ts` - Type definitions and network configs
- `public/index.html` - Payment UI components

## Need Help?

- Check [X402-PAYMENTS.md](X402-PAYMENTS.md) for detailed docs
- Review [x4-pay-core](https://github.com/AbhinavBuilds/x4-pay-core) examples
- Test with the web UI at http://localhost:3000

## Example Use Cases

1. **Digital Products**: Accept payment for downloads, access, etc.
2. **Services**: Payment for consulting, development, design work
3. **Marketplace**: Transactions in a decentralized marketplace
4. **Subscriptions**: Recurring payment support (coming soon)

Happy building! 🎉

