# 🐍 x402 Hardware Bridge - Python SDK

Global HTTP API access to x402 Bluetooth payment devices for AI agents and automated systems.

---

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
pip install -r requirements-python.txt
```

Or manually:
```bash
pip install fastapi uvicorn bleak
```

### **2. Start the Bridge**
```bash
python x402_hardware_bridge.py
```

The bridge will start on **port 8402**.

### **3. Check Status**
```bash
curl http://localhost:8402/
```

---

## 📡 **API Endpoints**

### **Get Status**
```bash
GET http://localhost:8402/
```

**Response:**
```json
{
  "service": "x402 Hardware Bridge",
  "version": "1.0.0",
  "status": "operational",
  "devices_connected": 0,
  "endpoints": {...}
}
```

### **Discover Devices**
```bash
POST http://localhost:8402/hardware/discover
Content-Type: application/json

{
  "duration": 5
}
```

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "name": "x402-vending-01",
      "address": "AA:BB:CC:DD:EE:FF",
      "rssi": -45,
      "connectable": true
    }
  ],
  "count": 1
}
```

### **Connect to Device**
```bash
POST http://localhost:8402/hardware/{device_id}/connect
Content-Type: application/json

{
  "address": "AA:BB:CC:DD:EE:FF"
}
```

### **List Connected Devices**
```bash
GET http://localhost:8402/hardware/devices
```

### **Process Payment**
```bash
POST http://localhost:8402/hardware/{device_id}/payment
Content-Type: application/json

{
  "x402Version": 1,
  "scheme": "exact",
  "network": "base-sepolia",
  "payload": {
    "signature": "0x...",
    "authorization": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": "payment_complete",
  "transaction_hash": "0x...",
  "device_id": "x402-vending-01",
  "execution_time": "2.5s"
}
```

### **Get Device Status**
```bash
GET http://localhost:8402/hardware/{device_id}/status
```

### **Get Payment History**
```bash
GET http://localhost:8402/hardware/{device_id}/history?limit=10
```

### **Disconnect Device**
```bash
DELETE http://localhost:8402/hardware/{device_id}/disconnect
```

---

## 🔌 **Integration with Node.js Portal**

The Node.js portal automatically proxies requests to the Python bridge:

```javascript
// Check bridge status
fetch('/api/hardware/bridge-status')

// Discover devices
fetch('/api/hardware/discover', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({duration: 5})
})

// List devices
fetch('/api/hardware/devices')

// Process payment
fetch('/api/hardware/x402-vending-01/payment', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(paymentPayload)
})
```

---

## 🤖 **AI Agent Integration**

### **Python Client Example**
```python
import requests

# Discover devices
response = requests.post('http://localhost:8402/hardware/discover', 
    json={'duration': 5})
devices = response.json()

# Process payment
for device in devices['devices']:
    payment = {
        "x402Version": 1,
        "scheme": "exact",
        "network": "base-sepolia",
        "payload": {...}
    }
    
    result = requests.post(
        f"http://localhost:8402/hardware/{device['name']}/payment",
        json=payment
    )
    
    print(f"Payment result: {result.json()}")
```

### **curl Example**
```bash
# Discover
curl -X POST http://localhost:8402/hardware/discover \
  -H "Content-Type: application/json" \
  -d '{"duration": 5}'

# Pay
curl -X POST http://localhost:8402/hardware/x402-001/payment \
  -H "Content-Type: application/json" \
  -d '{
    "x402Version": 1,
    "scheme": "exact",
    "network": "base-sepolia",
    "payload": {...}
  }'
```

---

## 🔧 **BLE Protocol**

### **Service UUIDs**
```
Service: 6e400002-b5a3-f393-e0a9-e50e24dcca9e
TX Char: 6e400003-b5a3-f393-e0a9-e50e24dcca9e
RX Char: 6e400004-b5a3-f393-e0a9-e50e24dcca9e
```

### **Device Commands**
```
[CONFIG]     - Get device configuration
[LOGO]       - Get device logo
[BANNER]     - Get device banner
[DESC]       - Get description
[OPTIONS]    - Get options
[PRICE]      - Get current price
X-PAYMENT    - Send payment payload
```

### **Payment Format**
```json
{
  "X-PAYMENT:START": "{\"x402Version\":1,...}",
  "X-PAYMENT": "{\"signature\":\"0x...\",...}",
  "X-PAYMENT:END": "{\"authorization\":...}"
}
```

---

## 🌐 **Network Support**

**Testnets:**
- Base Sepolia
- Avalanche Fuji
- Polygon Amoy
- Sei Testnet

**Mainnets:**
- Base
- Avalanche
- Polygon
- Sei
- IoTeX
- Peaq

---

## 📊 **Monitoring**

### **Check Devices**
```bash
# Get all connected devices
curl http://localhost:8402/hardware/devices

# Get specific device status
curl http://localhost:8402/hardware/x402-001/status
```

### **View Logs**
The bridge logs to console:
```
🚀 x402 Hardware Bridge starting...
📡 ESP32 devices will be globally accessible via HTTP/x402
🤖 AI agents can discover and pay for hardware services

🔍 Scanning for x402 devices...
📱 Found: x402-vending-01 (AA:BB:CC:DD:EE:FF)
🔌 Connecting to AA:BB:CC:DD:EE:FF...
✅ Connected to x402-vending-01
```

---

## 🐛 **Troubleshooting**

### **Bridge won't start**
```bash
# Check if port is in use
netstat -an | grep 8402

# Try different port
uvicorn.run(app, port=8403)
```

### **Devices not discovered**
- Ensure device is powered on
- Check Bluetooth is enabled
- Verify device is in range
- Device must have x402 service UUID

### **Connection fails**
- Check device advertising
- Verify service UUID matches
- Ensure no other active connection
- Try restarting bridge

---

## 🔐 **Security Notes**

- Bridge runs on localhost by default (secure)
- BLE connections use device-level encryption
- Payment signatures verified before forwarding
- Transaction history stored locally only

---

## 📚 **Documentation**

- **API Docs:** http://localhost:8402/docs (FastAPI auto-generated)
- **Alt Docs:** http://localhost:8402/redoc
- **Main Portal:** http://localhost:3000 (Node.js integration)

---

## 🎯 **Use Cases**

### **1. IoT Vending Machines**
```python
# Agent discovers machine
device = discover_device("vending-machine-1")

# Get current price
price = get_price(device)

# Process payment
payment = create_x402_payment(price)
result = send_payment(device, payment)

# Dispense product
if result.success:
    dispense_product()
```

### **2. Charging Stations**
```python
# Agent finds charger
charger = discover_device("charger-3")

# Pay for charging time
payment = create_x402_payment(amount=5.00, network="base")
result = pay(charger, payment)

# Activate charging
activate_charging(duration=30)
```

### **3. Parking Meters**
```python
# Find available meter
meter = discover_device("parking-meter-5")

# Calculate time needed
time_needed = calculate_parking_time()

# Pay amount
payment = create_x402_payment(amount=time_needed * 0.50)
pay(meter, payment)
```

---

## ✅ **Status**

- ✅ Python bridge implemented
- ✅ BLE discovery working
- ✅ Device connection tested
- ✅ Payment forwarding functional
- ✅ Node.js integration complete
- ✅ UI controls added

---

**Ready to use!** 🚀

Start the bridge and discover x402 devices:

```bash
python x402_hardware_bridge.py
```

