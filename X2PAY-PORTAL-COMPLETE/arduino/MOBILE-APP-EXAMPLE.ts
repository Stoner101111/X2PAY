/*
 * X2PAY Mobile App - React Native Example
 * Bluetooth Low Energy (BLE) payment client for x402 devices
 * 
 * Technologies:
 * - React Native
 * - react-native-ble-plx (BLE library)
 * - viem (Ethereum wallet)
 * - @coinbase/x402/client (x402 protocol)
 * 
 * Based on: https://github.com/AbhinavBuilds/x4-pay-core
 */

import { BleManager } from 'react-native-ble-plx';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { signPaymentHeader } from '@coinbase/x402/client';

// BLE UUIDs for X402 Nordic UART service
const SERVICE_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const RX_CHAR_UUID = "6e400004-b5a3-f393-e0a9-e50e24dcca9e";

const manager = new BleManager();

/**
 * Scan for nearby x402 devices and auto-connect
 */
export const scanAndConnect = async () => {
  return new Promise((resolve, reject) => {
    manager.startDeviceScan([SERVICE_UUID], null, async (error, device) => {
      if (error) {
        reject(error);
        return;
      }

      if (device && device.rssi >= -30) { // Very close device
        manager.stopDeviceScan();
        const connectedDevice = await connectToDevice(device);
        resolve(connectedDevice);
      }
    });
  });
};

/**
 * Connect to a specific x402 BLE device
 */
export const connectToDevice = async (device: any) => {
  try {
    const connectedDevice = await device.connect();
    await connectedDevice.discoverAllServicesAndCharacteristics();
    
    console.log('Connected to:', connectedDevice.name);
    return connectedDevice;
  } catch (error) {
    console.error('Connection error:', error);
    throw error;
  }
};

/**
 * Get payment requirements from device
 */
export const getPaymentRequirements = async (device: any) => {
  try {
    // Subscribe to TX characteristic to receive data
    const txCharacteristic = await device.characteristicForService(
      SERVICE_UUID,
      TX_CHAR_UUID
    );

    return new Promise((resolve) => {
      txCharacteristic.monitor((error: any, characteristic: any) => {
        if (characteristic) {
          const data = characteristic.value;
          const jsonData = JSON.parse(atob(data)); // Base64 decode
          resolve(jsonData);
        }
      });
    });
  } catch (error) {
    console.error('Error getting requirements:', error);
    throw error;
  }
};

/**
 * Send payment to device via BLE
 */
export const sendPaymentToDevice = async (
  device: any,
  signedPayment: string,
  options?: string[],
  customText?: string
) => {
  try {
    const rxCharacteristic = await device.characteristicForService(
      SERVICE_UUID,
      RX_CHAR_UUID
    );

    const paymentData = {
      txHash: signedPayment,
      options: options || [],
      customMessage: customText || '',
      timestamp: Date.now()
    };

    const jsonString = JSON.stringify(paymentData);
    const base64Data = btoa(jsonString); // Base64 encode

    await rxCharacteristic.writeWithResponse(base64Data);
    console.log('Payment sent to device');
  } catch (error) {
    console.error('Error sending payment:', error);
    throw error;
  }
};

/**
 * Main payment handler
 */
export const handlePayment = async (
  device: any,
  options?: string[],
  customText?: string,
  userPin?: string
) => {
  try {
    // Get payment requirements from device
    const requirements = await getPaymentRequirements(device);
    
    console.log('Payment requirements:', requirements);

    // Get user's decrypted private key
    const privateKey = await getDecryptedPrivateKey(userPin || '');
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia, // or 'base' for mainnet
      transport: http()
    });

    // Create payment header
    const paymentHeader = {
      x402Version: 1,
      paymentPayload: {
        // Add payment details here
      },
      paymentRequirements: requirements
    };

    // Sign payment with x402 protocol
    const signedPayment = await signPaymentHeader(
      walletClient,
      requirements,
      paymentHeader
    );

    console.log('Payment signed:', signedPayment);

    // Send to device via BLE
    await sendPaymentToDevice(device, signedPayment, options, customText);

    return signedPayment;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
};

/**
 * Get decrypted private key from secure storage
 */
const getDecryptedPrivateKey = async (pin: string): Promise<string> => {
  // Implement your secure storage logic here
  // This should decrypt the private key using the user's PIN
  // For security, use React Native Keychain or similar
  return '0x...'; // Placeholder
};

/**
 * Example usage in React Native component
 */
/*
import React, { useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { scanAndConnect, handlePayment } from './MobileAppExample';

const CoffeeApp = () => {
  const [device, setDevice] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Auto-scan on mount
    scanAndConnect()
      .then(setDevice)
      .then(() => setConnected(true))
      .catch(console.error);
  }, []);

  const orderCoffee = async (drinkType: string) => {
    try {
      const txHash = await handlePayment(device, [drinkType], 'Extra shot please');
      console.log('Order placed! TX:', txHash);
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  return (
    <View>
      <Text>Connected: {connected ? 'Yes' : 'No'}</Text>
      <Button title="Order Espresso" onPress={() => orderCoffee('Espresso')} />
      <Button title="Order Latte" onPress={() => orderCoffee('Latte')} />
      <Button title="Order Cappuccino" onPress={() => orderCoffee('Cappuccino')} />
    </View>
  );
};
*/

