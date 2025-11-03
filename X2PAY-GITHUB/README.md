# 🚀 X2PAY - Machine Economy Revolution

<div align="center">

![X2PAY Banner](https://via.placeholder.com/800x200/0A0E27/0066FF?text=X2PAY)

**Transform Any Device Into a Self-Sustaining Revenue Stream**

[![Live Demo](https://img.shields.io/badge/Demo-Live-success)](https://solana-trading-agent-adfhqau9w-idatorresm-8500s-projects.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 🌐 Revolutionary IoT Monetization

**X2PAY** enables machines to autonomously charge for services via instant Bluetooth payments. The future of machine-to-machine economy is here.

**Live Portal:** [https://solana-trading-agent-adfhqau9w-idatorresm-8500s-projects.vercel.app](https://solana-trading-agent-adfhqau9w-idatorresm-8500s-projects.vercel.app)

---

## ✨ Features

- 💰 **Autonomous Monetization** - Devices charge for services without human intervention
- 📡 **Bluetooth Low Energy** - Tap-to-pay via x402-over-BLE protocol
- ⚡ **Instant Payments** - USDC micropayments in seconds
- 🤖 **Machine Economy** - Enable any IoT device to generate revenue
- 🔄 **Buy & Burn** - Automated token supply reduction system
- 📊 **Real-time Dashboard** - Monitor all activity live
- 🌍 **Global Access** - Works on any device with Bluetooth

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- Solana wallet
- Pump.fun API key

### Installation

```bash
# Clone repository
git clone https://github.com/Stoner101111/X2PAY.git
cd X2PAY

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

Visit: http://localhost:3000

---

## 📋 Project Structure

```
x2pay/
├── public/              # Frontend portal
│   ├── index.html       # Main X2PAY portal
│   └── pricing.html     # Pricing strategy tool
├── src/                 # Backend server
│   ├── index.ts         # Express server
│   ├── pumpApi.ts       # Pump.fun integration
│   ├── burnService.ts   # Token burning logic
│   └── services/
│       └── x402Service.ts  # Payment protocol
├── api/                 # Vercel serverless
│   └── index.js         # Serverless wrapper
├── arduino/             # Hardware examples
│   └── x402_arduino_example.ino
├── x402_hardware_bridge.py  # Python bridge
└── package.json
```

---

## 🔧 Configuration

Create a `.env` file:

```env
# Solana Configuration
SOLANA_PUBLIC_KEY=your_public_key
SOLANA_PRIVATE_KEY=your_private_key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Pump.fun API
PUMP_API_KEY=your_api_key

# Auto-Buy Settings
AUTO_BUY_ENABLED=true
AUTO_BUY_AMOUNT=0.02
AUTO_BUY_INTERVAL=30000

# Server
NODE_ENV=production
PORT=3000
```

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Docker

```bash
docker build -t x2pay .
docker run -p 3000:3000 --env-file .env x2pay
```

---

## 📡 API Endpoints

### x402 Payments
- `POST /api/x402/requirements` - Generate payment requirements
- `POST /api/x402/verify` - Verify payment
- `POST /api/x402/settle` - Settle payment

### Buy & Burn
- `POST /api/auto-buy/start` - Start auto-buy
- `POST /api/auto-buy/stop` - Stop auto-buy
- `GET /api/auto-buy/status` - Get status

### Health
- `GET /api/health` - Health check

---

## 🤖 Hardware Integration

### Arduino/ESP32

```cpp
#include "X402Aurdino.h"

const String network = "base-sepolia";
const String payTo = "0xa78eD39F695615315458Bb066ac9a5F28Dfd65FE";
const String maxAmountRequired = "1000000";

void setup() {
  String requirements = buildDefaultPaymentRementsJson(
    network, payTo, maxAmountRequired
  );
  Serial.println(requirements);
}
```

### Python Bridge

```bash
pip install -r requirements-python.txt
python x402_hardware_bridge.py
```

---

## 📊 Technologies

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express, TypeScript
- **Blockchain:** Solana, USDC, x402 Protocol
- **Hardware:** Arduino, ESP32, BLE
- **Deployment:** Vercel, Netlify, Docker

---

## 📚 Documentation

- [Quick Start Guide](QUICK-START-X402.md)
- [x402 Payments](X402-PAYMENTS.md)
- [Hardware Bridge](PYTHON-BRIDGE-README.md)
- [Deployment Guide](PUBLISH-TO-WEB.md)
- [Full Implementation](COMPLETE-IMPLEMENTATION.md)

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built on the x402 payment protocol
- Inspired by [x4pay.org](https://x4pay.org)
- Powered by Coinbase Facilitator

---

## 📞 Contact

**Live Portal:** [X2PAY Portal](https://solana-trading-agent-adfhqau9w-idatorresm-8500s-projects.vercel.app)

**Documentation:** See project docs folder

---

<div align="center">

**Welcome to the Machine Economy** 🚀

Made with ❤️ for the crypto community

[⭐ Star us on GitHub](https://github.com/Stoner101111/X2PAY)

</div>
