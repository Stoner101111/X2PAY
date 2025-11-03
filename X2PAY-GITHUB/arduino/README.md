# 🛠️ Arduino/ESP32 x402 Integration

Accept USDC payments on physical hardware using x402 protocol.

---

## 📋 **Requirements**

### **Hardware:**
- ESP32 development board
- WiFi connection
- Optional: Relay, motor, or display for device control

### **Software:**
- Arduino IDE or PlatformIO
- ESP32 board support
- Arduino libraries:
  - `WiFi` (built-in)
  - `HTTPClient` (built-in)
  - `ArduinoJson` (install from Library Manager)

---

## 🔧 **Installation**

### **1. Install ArduinoJson**
```
Arduino IDE → Tools → Manage Libraries → Search "ArduinoJson" → Install
```

### **2. Configure WiFi**
Edit `x402_arduino_example.ino`:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### **3. Configure Payment Settings**
```cpp
const String network = "base-sepolia";
const String payTo = "0xa78eD39F695615315458Bb066ac9a5F28Dfd65FE";
const String maxAmountRequired = "1000000";  // 1 USDC
```

### **4. Upload to ESP32**
```
Arduino IDE → Select Board: ESP32 → Upload
```

---

## 🎯 **How It Works**

### **1. Device Startup**
- Connects to WiFi
- Generates payment requirements JSON
- Prints requirements to Serial
- Waits for payment

### **2. Payment Verification**
- Receives payment payload via Serial (or HTTP)
- Sends to x402 facilitator API
- Verifies signature
- Activates device on success

### **3. Device Activation**
- Turns on control pin for 2 seconds
- Add your custom logic here

---

## 📡 **Supported Networks**

| Network | USDC Address |
|---------|-------------|
| Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Avalanche Fuji | `0x5425890298aed601595a70AB815c96711a31Bc65` |
| Avalanche | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |
| Polygon Amoy | `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` |
| Polygon | `0x3c499c542cef5e3811e1192ce70d8cc03d5c3359` |
| Sei Testnet | `0x4fcf1784b31630811181f670aea7a7bef803eaed` |
| Sei | `0xe15fc38f6d8c56af07bbcbe3baf5708a2bf42392` |
| IoTeX | `0xcdf79194c6c285077a58da47641d4dbe51f63542` |
| Peaq | `0xbbA60da06c2c5424f03f7434542280FCAd453d10` |

---

## 🧪 **Testing**

### **Serial Monitor**
```
1. Upload sketch to ESP32
2. Open Serial Monitor (115200 baud)
3. Device prints payment requirements
4. Send payment JSON to test
```

### **Payment Requirements Example**
```json
{
  "scheme": "exact",
  "network": "base-sepolia",
  "maxAmountRequired": "1000000",
  "resource": "https://x402ble.io",
  "description": "Device payment - x402 Arduino",
  "mimeType": "application/json",
  "payTo": "0xa78eD39F695615315458Bb066ac9a5F28Dfd65FE",
  "maxTimeoutSeconds": 300,
  "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  "extra": {
    "name": "USDC",
    "version": "2"
  }
}
```

---

## 🔌 **Device Control**

### **Basic Relay Control**
```cpp
const int relayPin = 2;

void activateDevice() {
  digitalWrite(relayPin, HIGH);
  delay(2000);  // 2 seconds
  digitalWrite(relayPin, LOW);
}
```

### **Servo Motor**
```cpp
#include <Servo.h>
Servo myServo;

void activateDevice() {
  myServo.write(90);
  delay(1000);
  myServo.write(0);
}
```

### **LCD Display**
```cpp
#include <LiquidCrystal.h>
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void activateDevice() {
  lcd.clear();
  lcd.print("Payment OK!");
  delay(2000);
  lcd.clear();
}
```

---

## 📊 **Integration Examples**

### **Vending Machine**
```cpp
void activateDevice() {
  // Dispense product
  digitalWrite(product1Pin, HIGH);
  delay(1000);
  digitalWrite(product1Pin, LOW);
  
  Serial.println("Product dispensed!");
}
```

### **Charging Station**
```cpp
void activateDevice() {
  // Activate charger for 30 minutes
  digitalWrite(chargerPin, HIGH);
  delay(1800000);  // 30 minutes
  digitalWrite(chargerPin, LOW);
  
  Serial.println("Charging complete!");
}
```

### **Parking Meter**
```cpp
void activateDevice() {
  // Set parking time
  int hours = 2;
  Serial.print("Parking activated for ");
  Serial.print(hours);
  Serial.println(" hours");
  
  // Timer logic here
}
```

---

## 🔐 **Security Notes**

1. **HTTPS Only**: Always use HTTPS for facilitator API
2. **Signature Verification**: Never skip verification
3. **Timeout**: Check maxTimeoutSeconds in requirements
4. **Network**: Use testnets for development
5. **Secrets**: Never commit WiFi credentials

---

## 🐛 **Troubleshooting**

### **WiFi Connection Fails**
- Check SSID and password
- Verify WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
- Check router settings

### **Payment Verification Fails**
- Ensure correct network configured
- Verify USDC address matches network
- Check Serial output for error messages
- Test facilitator API manually

### **Device Not Activating**
- Check device control pin connection
- Verify pin mode set to OUTPUT
- Test pin with simple blink sketch

---

## 📚 **References**

- **x402 Protocol**: https://x402.org
- **ESP32 Docs**: https://docs.espressif.com/projects/esp-idf/
- **ArduinoJson**: https://arduinojson.org
- **Facilitator API**: https://www.x402.org/facilitator

---

## 🚀 **Next Steps**

1. ✅ Upload to ESP32
2. ✅ Test WiFi connection
3. ✅ Generate payment requirements
4. ✅ Try verification with test payment
5. ✅ Add your device control logic
6. ✅ Deploy to production!

---

**Ready to accept x402 payments on hardware!** 🎉

