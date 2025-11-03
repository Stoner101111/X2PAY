# ☕ X2PAY Coffee Machine - Advanced Example

Complete coffee machine implementation using x402-over-BLE protocol.

---

## 📋 Overview

This example demonstrates:
- BLE advertising for device discovery
- Multiple product options
- Dynamic pricing based on selection
- Custom message support
- Recurring payment subscriptions
- Mobile app integration

---

## 🛠️ Hardware Requirements

- ESP32 development board
- Coffee machine (or simulator with relay)
- Optional: LED display for status

---

## 💻 Software Requirements

### Arduino IDE:
- ESP32 board support
- ArduinoJson library
- BLE libraries (included in ESP32 package)

### Mobile App:
- React Native
- react-native-ble-plx
- viem
- @coinbase/x402/client

---

## 📱 Mobile App Integration

The example includes a React Native mobile app that:
1. Scans for nearby BLE devices
2. Auto-connects to x402 devices
3. Receives payment requirements
4. Signs transactions using wallet
5. Sends payment via BLE
6. Receives confirmation

**Key Features:**
- Automatic device discovery
- Payment requirement parsing
- x402 protocol signing
- Multiple product selection
- Custom messages
- Transaction confirmation

---

## 🔧 Setup Instructions

### 1. Arduino/ESP32 Setup

```bash
1. Install Arduino IDE
2. Add ESP32 board support
3. Install ArduinoJson library
4. Open COFFEE-MACHINE-EXAMPLE.ino
5. Upload to ESP32
```

### 2. Mobile App Setup

```bash
1. Install React Native
2. npm install react-native-ble-plx viem @coinbase/x402
3. Configure native Bluetooth permissions
4. Import MOBILE-APP-EXAMPLE.ts
5. Build and deploy to device
```

### 3. Testing

```
1. Power on ESP32 (should start BLE advertising)
2. Open mobile app
3. App will auto-discover nearby coffee machine
4. Select drink and pay
5. Coffee dispenses automatically
```

---

## 🎯 Features

### BLE Communication

**ESP32 (Device):**
- Advertises x402 service UUID
- Receives payment requirements requests
- Sends payment requirements
- Receives signed payments
- Activates coffee machine

**Mobile App (Client):**
- Scans for x402 devices
- Connects via BLE
- Subscribes to TX characteristic
- Sends payments via RX characteristic

### Payment Flow

```
1. Device advertises BLE service
2. App discovers and connects
3. Device sends payment requirements
4. App displays options to user
5. User selects drinks and messages
6. App signs payment with x402
7. Payment sent to device via BLE
8. Device verifies and dispenses
9. Device sends confirmation
```

### Dynamic Pricing

```cpp
// Premium drinks cost more
Latte → 2.0 USDC
Cappuccino → 2.0 USDC
Espresso → 1.5 USDC
Americano → 1.5 USDC
```

### Custom Messages

Users can add custom messages:
- "Extra shot please"
- "Decaf Latte"
- "Oat milk only"

---

## 📊 BLE Protocol

### Nordic UART Service

```
Service UUID: 6e400002-b5a3-f393-e0a9-e50e24dcca9e
TX (Device → App): 6e400003-b5a3-f393-e0a9-e50e24dcca9e
RX (App → Device): 6e400004-b5a3-f393-e0a9-e50e24dcca9e
```

### Message Format

**Payment Requirements (Device → App):**
```json
{
  "network": "base-sepolia",
  "price": "1500000",
  "payTo": "0x...",
  "description": "Smart coffee machine",
  "logo": "https://...",
  "options": ["Espresso", "Latte", "Cappuccino", "Americano"],
  "recurring": 30,
  "customMessage": true,
  "dynamicPricing": true
}
```

**Payment (App → Device):**
```json
{
  "txHash": "0x...",
  "options": ["Latte"],
  "customMessage": "Extra shot please",
  "timestamp": 1234567890
}
```

**Confirmation (Device → App):**
```json
{
  "status": "success",
  "message": "Coffee dispensed!"
}
```

---

## 🔐 Security

1. **Payment Verification**: Verify via x402 facilitator
2. **Signature Validation**: Check transaction signatures
3. **Timeout Handling**: Enforce maxTimeoutSeconds
4. **Network Validation**: Ensure correct blockchain network
5. **Amount Verification**: Verify payment amount

---

## 🎨 Customization

### Add More Drinks

```cpp
const String OPTIONS[] = {
  "Espresso", "Latte", "Cappuccino", "Americano",
  "Mocha", "Macchiato", "Frappuccino"
};
const int NUM_OPTIONS = 7;
```

### Change Pricing

```cpp
const String DEFAULT_PRICE = "1000000";  // 1.0 USDC
const String PREMIUM_PRICE = "2500000";  // 2.5 USDC
```

### Custom Brew Times

```cpp
void dispenseCoffee(String option) {
  int brewTime = 2000; // Default 2 seconds
  
  if (option == "Espresso") brewTime = 25000;  // 25 seconds
  if (option == "Latte") brewTime = 30000;     // 30 seconds
  
  digitalWrite(CONTROL_PIN, HIGH);
  delay(brewTime);
  digitalWrite(CONTROL_PIN, LOW);
}
```

---

## 🚀 Production Deployment

1. **Test on Base Sepolia**: Verify all features
2. **Switch to Mainnet**: Update network and addresses
3. **Secure Keys**: Use hardware secure storage
4. **Add Logging**: Monitor transactions
5. **User Training**: Provide instructions

---

## 📚 References

- x402 Protocol: https://x402.org
- ESP32 BLE: https://docs.espressif.com/projects/esp-idf/
- React Native BLE: https://github.com/dotintent/react-native-ble-plx
- viem: https://viem.sh

---

## 🎉 Success!

Your coffee machine is now accepting crypto payments over Bluetooth!

**Next Steps:**
1. Deploy to production
2. Add more features
3. Scale to multiple locations
4. Integrate with inventory management
5. Add analytics dashboard

