import axios from 'axios';
import { PaymentPayload, PaymentRequirements, AssetInfo, PaymentResponse, EVM_NETWORK_TO_CHAIN_ID, EVM_USDC } from '../types/x402';

const FACILITATOR_URL = 'https://www.x402.org/facilitator';

export interface X402Service {
  verifyPayment(payload: PaymentPayload, requirements: PaymentRequirements): Promise<boolean>;
  settlePayment(payload: PaymentPayload, requirements: PaymentRequirements): Promise<any>;
  getAssetForNetwork(network: string): AssetInfo | null;
  buildPaymentRequirements(
    network: string,
    payTo: string,
    maxAmountRequired: string,
    description?: string
  ): PaymentRequirements;
}

export function createX402Service(): X402Service {
  const getAssetForNetwork = (network: string): AssetInfo | null => {
    const chainId = EVM_NETWORK_TO_CHAIN_ID[network];
    if (!chainId) {
      return null;
    }
    
    const asset = EVM_USDC[chainId.toString()];
    if (!asset) {
      return null;
    }
    
    return asset;
  };

  const buildPaymentRequirements = (
    network: string,
    payTo: string,
    maxAmountRequired: string,
    description: string = ''
  ): PaymentRequirements => {
    const asset = getAssetForNetwork(network);
    if (!asset) {
      throw new Error(`Unsupported network: ${network}`);
    }

    return {
      scheme: 'exact',
      network: network,
      maxAmountRequired: maxAmountRequired,
      resource: 'https://x402ble.io',
      description: description,
      mimeType: 'application/json',
      payTo: payTo,
      maxTimeoutSeconds: 300,
      asset: asset.usdcAddress,
      extra: {
        name: asset.usdcName,
        version: '2',
      },
    };
  };

  const verifyPaymentInternal = async (
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<boolean> => {
    try {
      const requestPayload = {
        x402Version: payload.x402Version,
        paymentPayload: JSON.stringify(payload.payload),
        paymentRequirements: requirements,
      };

      const response = await axios.post<PaymentResponse>(
        `${FACILITATOR_URL}/verify`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.isValid === true;
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      return false;
    }
  };

  const settlePaymentInternal = async (
    payload: PaymentPayload,
    requirements: PaymentRequirements
  ): Promise<any> => {
    try {
      const requestPayload = {
        x402Version: payload.x402Version,
        paymentPayload: JSON.stringify(payload.payload),
        paymentRequirements: requirements,
      };

      const response = await axios.post<PaymentResponse>(
        `${FACILITATOR_URL}/settle`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        transaction: response.data.transaction,
        payer: response.data.payer,
        network: response.data.network,
      };
    } catch (error: any) {
      console.error('Payment settlement failed:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    verifyPayment: verifyPaymentInternal,
    settlePayment: settlePaymentInternal,
    getAssetForNetwork,
    buildPaymentRequirements,
  };
}

