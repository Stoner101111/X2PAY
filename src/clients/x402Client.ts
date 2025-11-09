/**
 * X402 Client SDK
 * 
 * Helper library for client-side x402 payment integration
 * Works with browser wallets and Node.js environments
 */

import { PaymentRequirements, PaymentPayload } from '../types/x402';

export interface WalletAdapter {
  getAddress(): Promise<string>;
  signMessage(message: string): Promise<string>;
  signTypedData(domain: any, types: any, value: any): Promise<string>;
  isConnected(): boolean;
}

export interface PaymentOptions {
  requirements: PaymentRequirements;
  wallet: WalletAdapter;
  onProgress?: (stage: string) => void;
}

export class X402Client {
  /**
   * Create a payment payload from requirements
   * This is a simplified version - in production, use @coinbase/x402 SDK
   */
  async createPaymentPayload(options: PaymentOptions): Promise<PaymentPayload> {
    const { requirements, wallet, onProgress } = options;

    if (!wallet.isConnected()) {
      throw new Error('Wallet not connected');
    }

    onProgress?.('Getting wallet address...');
    const from = await wallet.getAddress();
    
    // Ensure 'from' address is in the correct format (EVM format)
    const fromAddress = from.startsWith('0x') ? from : `0x${from}`;
    const toAddress = requirements.payTo.startsWith('0x') 
      ? requirements.payTo 
      : `0x${requirements.payTo}`;

    onProgress?.('Generating payment authorization...');
    
    // Generate nonce
    const nonce = this.generateNonce();
    
    // Calculate amount in wei (USDC has 6 decimals)
    const amount = this.parseAmount(requirements.maxAmountRequired);
    
    // Set validity window (5 minutes by default)
    const now = Math.floor(Date.now() / 1000);
    const validAfter = now.toString();
    const validBefore = (now + (requirements.maxTimeoutSeconds || 300)).toString();

    onProgress?.('Signing payment authorization...');
    
    // Create authorization message
    const authorization = {
      from: fromAddress,
      to: toAddress,
      value: amount.toString(),
      validAfter,
      validBefore,
      nonce
    };

    // Sign the authorization (this is a simplified version)
    // In production, use proper EIP-712 signing
    const message = JSON.stringify({
      domain: {
        name: 'x402',
        version: '1',
        chainId: this.getChainId(requirements.network)
      },
      message: authorization,
      primaryType: 'PaymentAuthorization',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' }
        ],
        PaymentAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' }
        ]
      }
    });

    let signature: string;
    try {
      signature = await wallet.signTypedData(
        {
          name: 'x402',
          version: '1',
          chainId: this.getChainId(requirements.network)
        },
        {
          PaymentAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' }
          ]
        },
        authorization
      );
    } catch (error: any) {
      // Fallback to simple message signing if typed data not supported
      signature = await wallet.signMessage(message);
    }

    onProgress?.('Payment payload created');

    return {
      x402Version: 1,
      scheme: requirements.scheme || 'exact',
      network: requirements.network,
      payload: {
        signature,
        authorization
      }
    };
  }

  /**
   * Make a payment request to a service
   */
  async makePayment(
    serviceUrl: string,
    paymentPayload: PaymentPayload,
    requestData?: any
  ): Promise<Response> {
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-402-Version': '1'
      },
      body: JSON.stringify({
        paymentPayload,
        ...requestData
      })
    });

    if (response.status === 402) {
      // Payment required - return the requirements
      const data = await response.json();
      throw new PaymentRequiredError(data.requirements, data.service);
    }

    return response;
  }

  /**
   * Get payment requirements from a service
   */
  async getPaymentRequirements(serviceUrl: string): Promise<PaymentRequirements> {
    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 402) {
      const data = await response.json();
      return data.requirements;
    }

    throw new Error('Service did not return payment requirements');
  }

  /**
   * Complete payment flow: get requirements -> create payload -> make request
   */
  async payForService(
    serviceUrl: string,
    wallet: WalletAdapter,
    requestData?: any,
    onProgress?: (stage: string) => void
  ): Promise<any> {
    // Step 1: Get payment requirements
    onProgress?.('Getting payment requirements...');
    let requirements: PaymentRequirements;
    
    try {
      requirements = await this.getPaymentRequirements(serviceUrl);
    } catch (error: any) {
      // Try making request to get 402 response
      const response = await fetch(serviceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData || {})
      });
      
      if (response.status === 402) {
        const data = await response.json();
        requirements = data.requirements;
      } else {
        throw new Error('Could not get payment requirements');
      }
    }

    // Step 2: Create payment payload
    onProgress?.('Creating payment...');
    const paymentPayload = await this.createPaymentPayload({
      requirements,
      wallet,
      onProgress
    });

    // Step 3: Make payment request
    onProgress?.('Submitting payment...');
    const response = await this.makePayment(serviceUrl, paymentPayload, requestData);

    onProgress?.('Payment completed');
    return await response.json();
  }

  private generateNonce(): string {
    // Generate a random 32-byte nonce
    const bytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // Fallback for Node.js
      for (let i = 0; i < 32; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private parseAmount(amount: string): bigint {
    // Parse USDC amount (6 decimals)
    const amountFloat = parseFloat(amount);
    return BigInt(Math.floor(amountFloat * 1_000_000));
  }

  private getChainId(network: string): number {
    const chainIdMap: Record<string, number> = {
      'base-sepolia': 84532,
      'base': 8453,
      'avalanche-fuji': 43113,
      'avalanche': 43114,
      'iotex': 4689,
      'sei': 1329,
      'sei-testnet': 1328,
      'polygon': 137,
      'polygon-amoy': 80002,
      'peaq': 3338
    };
    return chainIdMap[network] || 1;
  }
}

export class PaymentRequiredError extends Error {
  constructor(
    public requirements: PaymentRequirements,
    public service: any
  ) {
    super('Payment Required');
    this.name = 'PaymentRequiredError';
  }
}

// Browser wallet adapter example (MetaMask, Coinbase Wallet, etc.)
export class BrowserWalletAdapter implements WalletAdapter {
  private provider: any;

  constructor(provider: any) {
    this.provider = provider;
  }

  async getAddress(): Promise<string> {
    const accounts = await this.provider.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      throw new Error('No accounts found. Please connect your wallet.');
    }
    return accounts[0];
  }

  async signMessage(message: string): Promise<string> {
    const address = await this.getAddress();
    return await this.provider.request({
      method: 'personal_sign',
      params: [message, address]
    });
  }

  async signTypedData(domain: any, types: any, value: any): Promise<string> {
    const address = await this.getAddress();
    return await this.provider.request({
      method: 'eth_signTypedData_v4',
      params: [address, JSON.stringify({
        domain,
        types,
        primaryType: 'PaymentAuthorization',
        message: value
      })]
    });
  }

  isConnected(): boolean {
    return this.provider && this.provider.isConnected !== false;
  }
}

// Example usage helper
export function createX402Client(): X402Client {
  return new X402Client();
}

