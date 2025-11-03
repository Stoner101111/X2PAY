# 🔗 X2PAY Integration Examples

Complete integration code for React Native and React (Web) applications using X2PAY x402-over-BLE protocol.

---

## 📱 React Native Integration

Complete mobile app integration with BLE scanning, auto-connect, and x402 payments.

### Install Dependencies

```bash
npm install react-native-ble-plx viem @coinbase/x402 wagmi
```

### Full Implementation

```typescript
import React, { useState, useEffect } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { signPaymentHeader } from '@coinbase/x402/client';

// BLE UUIDs for X402 Nordic UART service
const SERVICE_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const RX_CHAR_UUID = "6e400004-b5a3-f393-e0a9-e50e24dcca9e";

export function X2PAYClient() {
  const [manager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [paymentRequirements, setPaymentRequirements] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Auto-scan for nearby devices
  useEffect(() => {
    manager.startDeviceScan(
      [SERVICE_UUID],
      null,
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device && device.rssi >= -50) {
          console.log(`Found device: ${device.name} (${device.rssi} dBm)`);
          connectToDevice(device);
          manager.stopDeviceScan();
        }
      }
    );

    return () => {
      manager.stopDeviceScan();
      if (connectedDevice) {
        connectedDevice.cancelConnection();
      }
    };
  }, []);

  // Connect to BLE device
  const connectToDevice = async (device: Device) => {
    try {
      console.log(`Connecting to ${device.name}...`);
      
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics();
      
      // Subscribe to TX characteristic for receiving data
      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        TX_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            const data = characteristic.value;
            handleReceivedData(Buffer.from(data, 'base64').toString());
          }
        },
        'payment-monitor'
      );

      setConnectedDevice(connectedDevice);
      
      // Request payment requirements
      await sendCommand(connectedDevice, '[CONFIG]');
      
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  // Handle received BLE data
  const handleReceivedData = (data: string) => {
    if (data.startsWith('402://')) {
      const jsonData = JSON.parse(data.slice(6));
      
      if (jsonData.network && jsonData.price) {
        setPaymentRequirements({
          network: jsonData.network,
          payTo: jsonData.payTo,
          maxAmountRequired: jsonData.price,
          options: jsonData.options || []
        });
      }
    }
  };

  // Send command to device
  const sendCommand = async (device: Device, command: string) => {
    if (!connectedDevice) return;

    try {
      const writeCharacteristic = await connectedDevice.writeCharacteristicWithoutResponseForService(
        SERVICE_UUID,
        RX_CHAR_UUID,
        Buffer.from(command).toString('base64')
      );
      
      console.log('Command sent:', command);
    } catch (error) {
      console.error('Write error:', error);
    }
  };

  // Process payment
  const handlePayment = async (selectedOptions: string[], customText?: string) => {
    if (!connectedDevice || !paymentRequirements) {
      console.error('Device or requirements missing');
      return;
    }

    try {
      // Get user's decrypted private key
      const privateKey = await getDecryptedPrivateKey(); // Implement this
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      
      // Create wallet client
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http()
      });

      // Prepare payment header
      const paymentHeader = {
        from: account.address,
        network: paymentRequirements.network,
        timestamp: Math.floor(Date.now() / 1000),
        options: selectedOptions
      };

      // Sign payment with x402 protocol
      const signedPayment = await signPaymentHeader(
        walletClient,
        paymentRequirements,
        paymentHeader
      );

      // Send payment to device
      await sendPaymentToDevice(connectedDevice, signedPayment, selectedOptions, customText);

      console.log('✅ Payment sent successfully!');
      
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  // Send payment payload to device
  const sendPaymentToDevice = async (
    device: Device,
    signedPayment: string,
    options: string[],
    customText?: string
  ) => {
    const payload = {
      payment: signedPayment,
      options,
      customText
    };

    const command = `X-PAYMENT:START${JSON.stringify(payload)}`;
    await sendCommand(device, command);
  };

  return {
    connectedDevice,
    paymentRequirements,
    isScanning,
    handlePayment
  };
}
```

---

## 🌐 React Web Integration (Web Bluetooth)

Complete web app integration using Web Bluetooth API with wagmi.

### Install Dependencies

```bash
npm install wagmi viem @coinbase/x402 @tanstack/react-query
```

### Full Implementation

```typescript
import { useState, useRef } from 'react';
import { useWalletClient } from 'wagmi';
import { preparePaymentHeader, signPaymentHeader } from '@coinbase/x402/client';

// Web Bluetooth constants (Nordic UART service)
const SERVICE_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const RX_CHAR_UUID = "6e400004-b5a3-f393-e0a9-e50e24dcca9e";

interface BluetoothGATT {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  rx: BluetoothRemoteGATTCharacteristic;
  tx: BluetoothRemoteGATTCharacteristic;
}

function BluetoothPaymentApp() {
  const { data: walletClient } = useWalletClient();
  const [connected, setConnected] = useState(false);
  const [paymentRequirements, setPaymentRequirements] = useState<any>(null);
  const [deviceName, setDeviceName] = useState<string>('');
  const gattRefs = useRef<Partial<BluetoothGATT>>({});

  // Scan and connect to device
  const handleScanClick = async () => {
    try {
      if (!navigator.bluetooth) {
        alert("Web Bluetooth API is not available in this browser.");
        return;
      }

      // Request device with Nordic UART service
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      });

      console.log('Connecting to device:', device.name);
      setDeviceName(device.name || 'Unknown Device');

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const rx = await service.getCharacteristic(RX_CHAR_UUID);
      const tx = await service.getCharacteristic(TX_CHAR_UUID);

      // Listen for device notifications
      await tx.startNotifications();
      tx.addEventListener('characteristicvaluechanged', handleBLENotification);

      gattRefs.current = { device, server, rx, tx };
      setConnected(true);

      // Request payment requirements
      await sendBLEData('[CONFIG]');

    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      if (error.name !== 'NotFoundError') {
        alert('Connection error: ' + error.message);
      }
    }
  };

  // Handle received data from device
  const handleBLENotification = (event: any) => {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(value);

    console.log('Received:', text);

    if (text.startsWith('402://')) {
      const data = JSON.parse(text.slice(6));
      
      if (data.network && data.price) {
        setPaymentRequirements({
          network: data.network,
          payTo: data.payTo,
          maxAmountRequired: data.price,
          description: data.description,
          options: data.options || []
        });
      }
    }
  };

  // Send data to device
  const sendBLEData = async (data: string) => {
    if (!gattRefs.current.rx) return;

    try {
      const encoder = new TextEncoder();
      await gattRefs.current.rx.writeValue(encoder.encode(data));
      console.log('Sent:', data);
    } catch (error) {
      console.error('Send error:', error);
    }
  };

  // Process payment
  const handlePayment = async (selectedOptions: string[], customText?: string) => {
    if (!paymentRequirements || !walletClient) {
      alert('Missing requirements or wallet');
      return;
    }

    try {
      // Prepare x402 payment header
      const paymentHeader = preparePaymentHeader(
        walletClient.account.address,
        1,
        paymentRequirements
      );

      // Sign payment with wallet
      const signedMessage = await signPaymentHeader(
        walletClient,
        paymentRequirements,
        paymentHeader
      );

      // Parse and prepare payload
      const payload = {
        payment: signedMessage,
        options: selectedOptions,
        customText
      };

      // Send to device via Web Bluetooth
      const command = `X-PAYMENT:START${JSON.stringify(payload)}`;
      await sendBLEData(command);

      console.log('✅ Payment sent!');

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + error);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (gattRefs.current.device?.gatt?.connected) {
      gattRefs.current.device.gatt.disconnect();
    }
    gattRefs.current = {};
    setConnected(false);
    setPaymentRequirements(null);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">X2PAY Tap-to-Pay</h1>

        {!connected ? (
          <div className="text-center">
            <button
              onClick={handleScanClick}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl font-semibold"
            >
              Scan for Devices
            </button>
            <p className="mt-4 text-gray-400">
              Connect to a nearby x402 payment device
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Connected</h2>
                <p className="text-gray-400">{deviceName}</p>
              </div>
              <button
                onClick={handleDisconnect}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Disconnect
              </button>
            </div>

            {paymentRequirements && (
              <div className="bg-gray-900 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">
                  {paymentRequirements.description}
                </h3>
                <p className="text-gray-400 mb-4">
                  Price: {(parseInt(paymentRequirements.maxAmountRequired) / 1_000_000).toFixed(2)} USDC
                </p>

                {paymentRequirements.options && (
                  <div className="space-y-2 mb-4">
                    {paymentRequirements.options.map((option: string, index: number) => (
                      <label key={index} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handlePayment(['Espresso'])}
                  className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
                >
                  Pay & Activate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BluetoothPaymentApp;
```

---

## 🔧 WiFi Configuration

For the Arduino/ESP32 examples, you need to configure WiFi:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

---

## 📚 Complete Examples Repository

All code examples are available at:

**GitHub**: https://github.com/Stoner101111/X2PAY

**Arduino Examples**:
- `arduino/x402_arduino_example.ino` - Basic implementation
- `arduino/x402_coffee_machine.ino` - Advanced with recurring payments

**Integration**:
- React Native (mobile)
- React Web (Web Bluetooth)
- Python FastAPI bridge

---

## 🚀 Quick Start

1. **Arduino Device**: Upload `x402_coffee_machine.ino` to ESP32
2. **Mobile App**: Use React Native integration
3. **Web App**: Use React integration with Web Bluetooth

---

## 📖 Full Documentation

See [arduino/README.md](arduino/README.md) for complete hardware integration guide.

---

**Ready to build x402-over-BLE payment systems!** 🎉

