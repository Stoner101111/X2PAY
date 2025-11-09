# ☕ Coffee Machine Quick Start

Get your coffee machine accepting crypto payments in 15 minutes!

---

## 🎯 What You're Building

A Bluetooth-enabled coffee machine that:
- Advertises via BLE
- Accepts USDC payments
- Supports multiple drink options
- Has dynamic pricing
- Works with mobile apps

---

## 🚀 5-Step Setup

### Step 1: Flash ESP32

```bash
1. Open Arduino IDE
2. Open COFFEE-MACHINE-EXAMPLE.ino
3. Select Board: ESP32 Dev Module
4. Upload to your device
```

### Step 2: Check Serial Monitor

```
Open Serial Monitor (115200 baud)
You should see:
  "=== x402 Coffee Machine ==="
  "BLE device is now advertising!"
```

### Step 3: Install Mobile App Dependencies

```bash
npm install react-native-ble-plx viem @coinbase/x402
```

### Step 4: Import Example Code

```typescript
import { scanAndConnect, handlePayment } from './MobileAppExample';
```

### Step 5: Test Payment

```bash
1. Power on coffee machine (ESP32)
2. Open mobile app
3. App auto-discovers device
4. Select drink and pay
5. Coffee dispenses!
```

---

## ✅ Success Checklist

- [ ] ESP32 flashed successfully
- [ ] Serial monitor shows "advertising"
- [ ] Mobile app discovers device
- [ ] Payment goes through
- [ ] Coffee dispenses!

---

## 🔧 Troubleshooting

**Device not found?**
- Check BLE is enabled
- Ensure device is within 5 meters
- Verify SERVICE_UUID matches

**Payment fails?**
- Check network configuration
- Verify USDC address
- Check facilitator API connection

**Coffee doesn't dispense?**
- Check CONTROL_PIN connection
- Test relay separately
- Verify power supply

---

**🎉 You now have a crypto coffee machine!**

