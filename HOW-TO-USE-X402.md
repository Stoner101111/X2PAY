# 📖 How to Use Your x402 Payment System

## 🚀 Quick Start

### 1. **Start Your Server**
```bash
npm run dev
```

### 2. **Open in Browser**
```
http://localhost:3000
```

### 3. **You'll See:**
- ✨ MilkyWay Control Deck (main dashboard)
- 💳 x402 Payments - Tap to Pay (payment config)
- 📡 Tap-to-Pay Scanner (Bluetooth)
- 💡 Pricing Strategy link (top right)

---

## 💳 **Accept x402 Payments**

### **Step-by-Step:**

1. **Navigate to x402 Payments Panel**
   - Scroll to the "🚀 x402 Payments - Tap to Pay" section

2. **Configure Your Payment**
   - **Network:** Select your blockchain (Base Sepolia for testing)
   - **Amount:** Enter USDC amount (e.g., "10.00")
   - **Pay To:** Your wallet address (starts with 0x...)
   - **Description:** Optional payment description

3. **Generate Requirements**
   - Click "Generate Payment Requirements"
   - JSON appears with all payment details
   - Copy this JSON for your integration

4. **Share with Customers**
   - Use the requirements JSON in your app
   - Customers sign with their wallet
   - Payment gets verified automatically
   - Settlement happens on-chain

### **Example Output:**
```json
{
  "success": true,
  "requirements": {
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "10.00",
    "resource": "https://x402ble.io",
    "description": "Product purchase",
    "payTo": "0xYourAddress...",
    "maxTimeoutSeconds": 300,
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }
}
```

---

## 📡 **Tap-to-Pay with Bluetooth**

### **Requirements:**
- Chrome, Edge, or Opera browser
- HTTPS or localhost
- x402-compatible BLE device
- Device must be in range and discoverable

### **How to Connect:**

1. **Click "Scan for Devices"**
   - Browser prompts to select a device
   - Choose your x402 device from the list

2. **Connection Established**
   - Status changes to "Connected" (green dot)
   - Device name appears
   - Payment info displays automatically

3. **Receive Payments**
   - Device sends payment requests
   - Payment notifications appear in real-time
   - Transaction hash shown on completion

### **What Happens:**
```
User taps device → BLE connects → Payment request sent
→ User approves → Payment verified → Settled on-chain
→ Confirmation displayed
```

---

## 💡 **Pricing Strategy Tool**

### **Access:**
Click "💡 Pricing Strategy" link in the header

### **Features:**

#### **Compare 3 Models:**
1. **Freemium** ⚡ (Recommended)
   - Free open source libraries
   - Premium features at $29-$299/mo

2. **Transaction Fee** 📈
   - 0.5% standard rate
   - Scales with volume

3. **Hybrid** 💰
   - Low base + transaction fees
   - Balances revenue streams

#### **Analyze Segments:**
- **Hobbyists & Makers** - 1-10 devices, low willingness
- **IoT Startups** - 10-1,000 devices, medium willingness  
- **Enterprise** - 1,000+ devices, high willingness

#### **Get Recommendations:**
- Phase 1: Focus on adoption (Months 1-6)
- Phase 2: Introduce monetization (Months 6-12)

---

## 🧪 **Testing**

### **Testnet Setup:**

1. **Get Testnet USDC**
   - Visit Base Sepolia faucets
   - Get free testnet USDC for testing

2. **Test Payment Flow**
   ```
   Generate Requirements
   → Sign with MetaMask  
   → Verify Payment
   → Settle on Chain
   ```

3. **Verify Results**
   - Check transaction hash
   - View on testnet explorer
   - Confirm USDC received

### **API Testing:**

```bash
# Test payment requirements
curl -X POST http://localhost:3000/api/x402/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "network": "base-sepolia",
    "amount": "1.00",
    "payTo": "0xYourAddress",
    "description": "Test payment"
  }'
```

---

## 📊 **Integration Examples**

### **Simple Payment Button**
```html
<button onclick="generatePayment()">Pay 10 USDC</button>

<script>
async function generatePayment() {
  const response = await fetch('/api/x402/requirements', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      network: 'base-sepolia',
      amount: '10.00',
      payTo: '0xYourAddress'
    })
  });
  const data = await response.json();
  console.log('Payment requirements:', data.requirements);
  // Send to wallet for signing
}
</script>
```

### **Bluetooth Integration**
```javascript
// Already implemented in your portal!
// Just click "Scan for Devices" button
// Code is in public/index.html
```

---

## 🎯 **Use Cases**

### **1. Digital Products**
- Accept payment for downloads
- Grant access to content
- Premium features unlock

### **2. IoT Machine Payments**
- Vending machines
- Car charging stations
- Laundry services
- Parking meters

### **3. API Access**
- Per-request billing
- Subscription services
- Rate-limited access
- Premium endpoints

### **4. Marketplace**
- Buy/sell transactions
- Commission fees
- Escrow services
- Subscription products

---

## 📈 **Production Checklist**

Before going live:

- [ ] Test on testnet thoroughly
- [ ] Get real mainnet USDC
- [ ] Verify facilitator is responding
- [ ] Test all networks you need
- [ ] Set up monitoring
- [ ] Configure error handling
- [ ] Review security practices
- [ ] Get user feedback

---

## 🔧 **Troubleshooting**

### **Issue:** Portal won't load
**Fix:** Run `npm run dev` and check console

### **Issue:** Bluetooth scan fails
**Fix:** Use Chrome/Edge, ensure device is discoverable

### **Issue:** Payment verification fails
**Fix:** Check network name spelling, verify timestamp

### **Issue:** Build errors
**Fix:** Run `npm install && npm run build`

---

## 📚 **More Help**

- **Full Docs:** [X402-PAYMENTS.md](X402-PAYMENTS.md)
- **Quick Start:** [QUICK-START-X402.md](QUICK-START-X402.md)
- **Technical:** [X402-IMPLEMENTATION-SUMMARY.md](X402-IMPLEMENTATION-SUMMARY.md)
- **Status:** [PORTAL-WORKING.md](PORTAL-WORKING.md)

---

## 🎊 **You're Ready!**

Your x402 payment system is complete and ready to accept payments!

**Happy building! 🚀**

