/*
 * x402 Arduino/ESP32 - Coffee Machine Example
 * Accept USDC payments via x402-over-BLE protocol
 * 
 * Features:
 * - Bluetooth Low Energy (BLE) advertising
 * - Multiple drink options
 * - Dynamic pricing
 * - Custom messages
 * - Recurring payments
 * 
 * Uses: X402Aurdino.h library (from x4pay-core)
 * Based on: https://github.com/AbhinavBuilds/x4-pay-core
 */

#include <WiFi.h>
#include "X402Aurdino.h"
#include "x4pay-core.h"

// Device Configuration
const String DEVICE_NAME = "x402-Coffee-Machine";
const String NETWORK = "base-sepolia";
const String PRICE = "1500000"; // 1.5 USDC (in micro-units)
const String PAY_TO = "0xa78eD39F695615315458Bb066ac9a5F28Dfd65FE";
const String LOGO = "https://example.com/logo.jpg";
const String BANNER = "https://example.com/banner.jpg";
const String DESCRIPTION = "Smart coffee machine accepting crypto payments";

// Coffee Options
const String options[] = {"Espresso", "Latte", "Cappuccino", "Americano"};
X402Ble* device;

// Payment received callback
void onPaymentReceived(const std::vector<String>& selectedOptions, const String& context) {
  Serial.println("Payment received! Making coffee...");
  
  // Process each selected drink
  for (const auto& option : selectedOptions) {
    Serial.println("Selected: " + option);
    // Add your coffee machine control logic here
    makeCoffee(option);
  }
}

// Coffee making function
void makeCoffee(String drinkType) {
  Serial.println("Making " + drinkType + "...");
  
  // TODO: Add your coffee machine hardware control here
  // Example: digitalWrite(RELAY_PIN, HIGH); delay(2000); digitalWrite(RELAY_PIN, LOW);
  
  Serial.println(drinkType + " ready!");
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== x402 Coffee Machine ===");
  
  // Optional: Connect to WiFi for production features
  // WiFi.begin("yourWiFi", "password");
  
  // Create Bluetooth (BLE) payment device
  device = new X402Ble(DEVICE_NAME, PRICE, PAY_TO, NETWORK, LOGO, DESCRIPTION, BANNER);
  
  // Enable advanced features
  device->enableRecuring(30);           // 30 second recurring payments
  device->enableOptions(options, 4);    // Coffee options
  device->allowCustomised();            // Allow custom messages
  
  // Set payment callback
  device->setOnPay(onPaymentReceived);
  
  // Set dynamic pricing callback
  device->setDynamicPriceCallback([](const std::vector<String>& opts, const String& ctx) {
    // Premium drinks cost more
    for (const auto& opt : opts) {
      if (opt == "Latte" || opt == "Cappuccino") {
        return "2000000"; // 2 USDC for premium drinks
      }
    }
    return "1500000"; // Default 1.5 USDC
  });
  
  // Start the BLE device
  device->begin();
  Serial.println("Bluetooth (BLE) device started!");
  Serial.println("Waiting for mobile app connection...");
}

void loop() {
  // Check payment status
  if (device->getStatusAndReset()) {
    Serial.println("Payment received! Dispensing coffee...");
    // Additional post-payment logic here if needed
  }
  
  delay(100);
}

