/*
 * x402 Arduino/ESP32 Example
 * Accept USDC payments using x402 protocol over HTTPS
 * 
 * Features:
 * - Generate payment requirements JSON
 * - Verify payments via facilitator API
 * - HTTPS communication
 * - Simple device control
 * 
 * Requirements:
 * - ESP32 or similar with WiFi
 * - Arduino WiFi or HTTPClient library
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// x402 Configuration
const String network = "base-sepolia";  // or "base", "avalanche", etc.
const String payTo = "0xa78eD39F695615315458Bb066ac9a5F28Dfd65FE";
const String maxAmountRequired = "1000000";  // 1 USDC (micro-units: 1,000,000 = 1 USDC)

// x402 Facilitator API
const String facilitator_url = "https://www.x402.org/facilitator";

// Payment Requirements Cache
String cached_requirements = "";

// Device Control Pin (for activating your hardware)
const int deviceControlPin = 2;


void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=== x402 Payment Device ===");
  Serial.println("Initializing...");
  
  // Initialize WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed!");
    return;
  }
  
  // Build payment requirements
  cached_requirements = buildPaymentRequirements();
  
  Serial.println("\n=== Payment Requirements ===");
  Serial.println(cached_requirements);
  Serial.println("============================\n");
  
  // Setup device control pin
  pinMode(deviceControlPin, OUTPUT);
  digitalWrite(deviceControlPin, LOW);
  
  Serial.println("Device ready to accept payments!");
  Serial.println("Send payment payload via Serial to test\n");
}


void loop() {
  // Check for incoming payment payloads via Serial
  if (Serial.available()) {
    String paymentJson = Serial.readStringUntil('\n');
    paymentJson.trim();
    
    if (paymentJson.length() > 0) {
      Serial.print("\nReceived payment payload: ");
      Serial.println(paymentJson);
      
      // Verify payment
      bool isValid = verifyPayment(paymentJson);
      
      if (isValid) {
        Serial.println("✅ Payment verified successfully!");
        
        // Activate device
        activateDevice();
      } else {
        Serial.println("❌ Payment verification failed!");
      }
    }
  }
  
  delay(100);
}


/**
 * Build x402 payment requirements JSON
 */
String buildPaymentRequirements() {
  // Get USDC contract address for network
  String usdcAddress = getUsdcAddress(network);
  
  // Build requirements object
  JsonDocument req;
  req["scheme"] = "exact";
  req["network"] = network;
  req["maxAmountRequired"] = maxAmountRequired;
  req["resource"] = "https://x402ble.io";
  req["description"] = "Device payment - x402 Arduino";
  req["mimeType"] = "application/json";
  req["payTo"] = payTo;
  req["maxTimeoutSeconds"] = 300;
  req["asset"] = usdcAddress;
  
  JsonDocument extra;
  extra["name"] = "USDC";
  extra["version"] = "2";
  req["extra"] = extra;
  
  String output;
  serializeJson(req, output);
  return output;
}


/**
 * Get USDC contract address for network
 */
String getUsdcAddress(String network) {
  if (network == "base-sepolia") {
    return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  } else if (network == "base") {
    return "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  } else if (network == "avalanche") {
    return "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
  } else if (network == "polygon") {
    return "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
  } else if (network == "polygon-amoy") {
    return "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  } else if (network == "avalanche-fuji") {
    return "0x5425890298aed601595a70AB815c96711a31Bc65";
  } else if (network == "sei") {
    return "0xe15fc38f6d8c56af07bbcbe3baf5708a2bf42392";
  } else if (network == "sei-testnet") {
    return "0x4fcf1784b31630811181f670aea7a7bef803eaed";
  } else if (network == "iotex") {
    return "0xcdf79194c6c285077a58da47641d4dbe51f63542";
  } else if (network == "peaq") {
    return "0xbbA60da06c2c5424f03f7434542280FCAd453d10";
  }
  
  // Default to Base Sepolia
  return "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
}


/**
 * Verify payment using x402 facilitator API
 */
bool verifyPayment(String paymentPayload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Not connected to WiFi");
    return false;
  }
  
  HTTPClient http;
  http.begin(facilitator_url + "/verify");
  http.addHeader("Content-Type", "application/json");
  
  // Build verification request
  JsonDocument req;
  req["x402Version"] = 1;
  req["paymentPayload"] = paymentPayload;
  
  JsonDocument requirements;
  deserializeJson(requirements, cached_requirements);
  req["paymentRequirements"] = requirements;
  
  String requestBody;
  serializeJson(req, requestBody);
  
  Serial.println("Sending verification request...");
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.print("Verification response: ");
    Serial.println(response);
    
    // Parse response
    JsonDocument doc;
    deserializeJson(doc, response);
    
    bool isValid = doc["isValid"] | false;
    http.end();
    return isValid;
  } else {
    Serial.print("❌ HTTP Error: ");
    Serial.println(httpResponseCode);
    String errorBody = http.getString();
    Serial.println(errorBody);
    http.end();
    return false;
  }
}


/**
 * Activate device (e.g., relay, motor, display)
 */
void activateDevice() {
  Serial.println("🎉 Activating device...");
  
  // Turn on control pin for 2 seconds
  digitalWrite(deviceControlPin, HIGH);
  delay(2000);
  digitalWrite(deviceControlPin, LOW);
  
  Serial.println("✅ Device activated!");
}

