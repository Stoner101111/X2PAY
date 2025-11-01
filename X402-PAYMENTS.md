# 🚀 x402 Payments - Tap to Pay System

## Overview

This project now includes **x402 payment protocol** integration for accepting USDC payments over multiple blockchains. x402 is a payment protocol for HTTPS-based cryptocurrency payments developed by Coinbase.

## What is x402?

x402 is an open payment protocol that enables secure, permissionless cryptocurrency payments over HTTPS. It's designed for web applications to accept payments without requiring users to install special software or plugins.

### Key Features

- ✅ **Multi-chain Support**: Base, Avalanche, Polygon, and more
- ✅ **USDC Payments**: Accept USD Coin across EVM-compatible chains
- ✅ **Secure Verification**: Built-in payment verification system
- ✅ **Settlement**: Automatic payment settlement after verification
- ✅ **No Plugins Required**: Works with standard web wallets

## Reference Implementation

This implementation is based on the [x4-pay-core](https://github.com/AbhinavBuilds/x4-pay-core) project, which demonstrates Bluetooth-based x402 payments for Arduino/ESP32 devices.

## API Endpoints

### 1. Generate Payment Requirements

Generate payment requirements for a specific network and amount.

**Endpoint:** `POST /api/x402/requirements`

**Request Body:**
```json
{
  "network": "base-sepolia",
  "payTo": "0x...",
  "amount": "1.00",
  "description": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "requirements": {
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "1.00",
    "resource": "https://x402ble.io",
    "description": "Payment for services",
    "mimeType": "application/json",
    "payTo": "0x...",
    "maxTimeoutSeconds": 300,
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }
}
```

### 2. Verify Payment

Verify a payment signature and authorization.

**Endpoint:** `POST /api/x402/verify`

**Request Body:**
```json
{
  "paymentPayload": {
    "x402Version": 1,
    "scheme": "exact",
    "network": "base-sepolia",
    "payload": {
      "signature": "...",
      "authorization": {
        "from": "0x...",
        "to": "0x...",
        "value": "1.00",
        "validAfter": "...",
        "validBefore": "...",
        "nonce": "..."
      }
    }
  },
  "paymentRequirements": { /* requirements object */ }
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true
}
```

### 3. Settle Payment

Complete the payment settlement after verification.

**Endpoint:** `POST /api/x402/settle`

**Request Body:** Same as verify endpoint

**Response:**
```json
{
  "success": true,
  "transaction": "0x...",
  "payer": "0x...",
  "network": "base-sepolia"
}
```

## Supported Networks

### EVM-Compatible Chains

| Network | Chain ID | USDC Address | Testnet/Mainnet |
|---------|----------|--------------|-----------------|
| Base Sepolia | 84532 | 0x036CbD53842c5426634e7929541eC2318f3dCF7e | Testnet |
| Base | 8453 | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 | Mainnet |
| Avalanche Fuji | 43113 | 0x5425890298aed601595a70AB815c96711a31Bc65 | Testnet |
| Avalanche | 43114 | 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E | Mainnet |
| Polygon Amoy | 80002 | 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582 | Testnet |
| Polygon | 137 | 0x3c499c542cef5e3811e1192ce70d8cc03d5c3359 | Mainnet |
| Sei Testnet | 1328 | 0x4fcf1784b31630811181f670aea7a7bef803eaed | Testnet |
| Sei | 1329 | 0xe15fc38f6d8c56af07bbcbe3baf5708a2bf42392 | Mainnet |
| IoTeX | 4689 | 0xcdf79194c6c285077a58da47641d4dbe51f63542 | Mainnet |
| Peaq | 3338 | 0xbbA60da06c2c5424f03f7434542280FCAd453d10 | Mainnet |

## Usage Examples

### Web UI

Navigate to `http://localhost:3000` and use the **x402 Payments** panel to:
1. Select your network
2. Enter payment amount
3. Provide recipient address
4. Generate payment requirements JSON

### Direct API Usage

```bash
# Generate payment requirements
curl -X POST http://localhost:3000/api/x402/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "network": "base-sepolia",
    "payTo": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": "5.00",
    "description": "Service payment"
  }'

# Verify a payment
curl -X POST http://localhost:3000/api/x402/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": { /* payment payload */ },
    "paymentRequirements": { /* requirements */ }
  }'
```

## Architecture

```
Client Application
  ↓
Payment Requirements Request
  ↓
Server: Build Requirements
  ↓
Client: Sign Payment with Wallet
  ↓
Payment Payload
  ↓
Server: Verify Payment
  ↓
Facilitator API: Validate
  ↓
Server: Settle Payment
  ↓
Facilitator API: Execute Transfer
  ↓
Payment Complete
```

## Files

### Service Layer
- `src/services/x402Service.ts` - Core x402 payment service
- `src/types/x402.ts` - TypeScript types and network configurations

### API Routes
- `src/index.ts` - x402 payment endpoints added

### UI Components
- `public/index.html` - Payment requirements generator UI

## Facilitation

Payments are facilitated through the x402 facilitator service at `https://www.x402.org/facilitator`. This is an open facilitator that handles:

1. **Verification**: Validates payment signatures and authorizations
2. **Settlement**: Executes the actual USDC transfer on-chain
3. **Network Support**: Multi-chain transaction coordination

## Security Considerations

- ✅ All payments use cryptographic signatures
- ✅ Payment authorization includes time windows (`validAfter`/`validBefore`)
- ✅ Nonce-based replay protection
- ✅ Network-specific asset validation
- ✅ Facilitator-based settlement (no server-side key management)

## Testing

### Testnet Testing

For development and testing:
1. Use Base Sepolia or Polygon Amoy testnets
2. Get testnet USDC from faucets
3. Configure MetaMask or another wallet for testnet
4. Test the full payment flow

### Mainnet Usage

For production:
1. Ensure correct network selection
2. Verify USDC addresses are correct for the network
3. Test with small amounts first
4. Monitor facilitator responses

## Related Projects

- [x402 Protocol](https://github.com/coinbase/x402) - Official Coinbase x402 implementation
- [x4-pay-core](https://github.com/AbhinavBuilds/x4-pay-core) - Arduino/ESP32 BLE payment implementation
- [@coinbase/x402](https://www.npmjs.com/package/@coinbase/x402) - Official npm package

## Future Enhancements

Potential improvements:
- [ ] BLE-based payments for physical devices
- [ ] Recurring payment support
- [ ] Multi-asset support beyond USDC
- [ ] Payment status tracking
- [ ] Webhook notifications
- [ ] Payment analytics dashboard

## Troubleshooting

### "Unsupported network" Error
- Verify the network name matches exactly (e.g., "base-sepolia", not "base sepolia")
- Check that the network is in the EVM_NETWORK_TO_CHAIN_ID mapping

### "USDC not found" Error
- Ensure the chain ID has a corresponding USDC address
- Verify network configuration is complete

### Verification Failures
- Check that payment signatures are valid
- Ensure `validBefore` timestamp hasn't expired
- Verify nonce uniqueness
- Confirm network matches in both payload and requirements

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check [x402 documentation](https://github.com/coinbase/x402)
- Reference [x4-pay-core examples](https://github.com/AbhinavBuilds/x4-pay-core)
- Review facilitator API responses for specific errors

