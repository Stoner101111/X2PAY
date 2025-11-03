import axios, { AxiosResponse } from 'axios';

export interface PumpApiConfig {
  apiKey: string;
  baseUrl?: string;
  walletPublicKey?: string;
  walletPrivateKey?: string;
  rpcUrl?: string;
}

export interface CollectCreatorFeeRequest {
  action: 'collectCreatorFee';
  priorityFee: number;
  pool: 'pump';
}

export interface BuyTokenRequest {
  action: 'buy';
  mint: string; // Token mint address
  amount: number; // SOL amount
  priorityFee: number;
  pool: 'pump';
}

export interface CreateTokenRequest {
  action: 'create';
  tokenMetadata: {
    name: string;
    symbol: string;
    uri: string;
  };
  mint: string; // Keypair as string
  denominatedInSol: boolean;
  amount: number; // Dev buy amount in SOL
  slippage: number;
  priorityFee: number;
  pool: 'pump';
}

export interface IpfsUploadRequest {
  name: string;
  symbol: string;
  description: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  showName: string;
}

export interface PumpApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  txSignature?: string;
  metadataUri?: string;
}

export class PumpApiService {
  private config: PumpApiConfig;
  private baseUrl: string;

  constructor(config: PumpApiConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://pumpportal.fun/api';
  }

  /**
   * Get wallet public key
   */
  getWalletPublicKey(): string | undefined {
    return this.config.walletPublicKey;
  }

  /**
   * Get wallet private key (for internal use only)
   */
  getWalletPrivateKey(): string | undefined {
    return this.config.walletPrivateKey;
  }

  /**
   * Get RPC URL
   */
  getRpcUrl(): string {
    return this.config.rpcUrl || 'https://api.mainnet-beta.solana.com';
  }

  /**
   * Collect all creator fees from pump.fun
   */
  async collectCreatorFee(priorityFee: number = 0.000001): Promise<PumpApiResponse> {
    try {
      const url = `${this.baseUrl}/trade?api-key=${this.config.apiKey}`;
      
      const request = {
        action: 'collectCreatorFee',
        priorityFee,
        pool: 'pump'
      };
      
      const response: AxiosResponse = await axios.post(url, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      return {
        success: true,
        data: response.data,
        txSignature: response.data?.signature || response.data?.txSignature,
      };
    } catch (error: any) {
      console.error('Error collecting creator fees:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Buy tokens using SOL amount
   */
  async buyToken(mint: string, amount: number, priorityFee: number = 0.000001, slippage: number = 10): Promise<PumpApiResponse> {
    try {
      const url = `${this.baseUrl}/trade?api-key=${this.config.apiKey}`;
      
      const request = {
        action: 'buy',
        mint,
        amount,
        denominatedInSol: 'true', // Specify that amount is in SOL
        priorityFee,
        pool: 'pump',
        slippage
      };
      
      const response: AxiosResponse = await axios.post(url, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Buy token API response:', JSON.stringify(response.data, null, 2));
      console.log('Looking for signature in:', Object.keys(response.data || {}));

      return {
        success: true,
        data: response.data,
        txSignature: response.data?.signature || response.data?.txSignature || response.data?.txid || response.data?.transaction,
      };
    } catch (error: any) {
      console.error('Error buying tokens:', error);
      console.error('Error details:', error.response?.data);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Upload metadata to IPFS
   */
  async uploadToIpfs(metadata: IpfsUploadRequest, imageBuffer: Buffer): Promise<PumpApiResponse> {
    try {
      const formData = new FormData();
      
      // Add metadata fields
      formData.append('name', metadata.name);
      formData.append('symbol', metadata.symbol);
      formData.append('description', metadata.description);
      formData.append('showName', metadata.showName);
      
      if (metadata.twitter) formData.append('twitter', metadata.twitter);
      if (metadata.telegram) formData.append('telegram', metadata.telegram);
      if (metadata.website) formData.append('website', metadata.website);
      
      // Add image file
      const blob = new Blob([imageBuffer as any], { type: 'image/png' });
      formData.append('file', blob, 'token-image.png');
      
      const response: AxiosResponse = await axios.post('https://pump.fun/api/ipfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file upload
      });

      return {
        success: true,
        data: response.data,
        metadataUri: response.data?.metadataUri,
      };
    } catch (error: any) {
      console.error('Error uploading to IPFS:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a new token
   */
  async createToken(
    tokenMetadata: { name: string; symbol: string; uri: string },
    mintKeypair: string,
    devBuyAmount: number = 1,
    slippage: number = 10,
    priorityFee: number = 0.0005
  ): Promise<PumpApiResponse> {
    try {
      const url = `${this.baseUrl}/trade?api-key=${this.config.apiKey}`;
      
      const request = {
        action: 'create',
        tokenMetadata,
        mint: mintKeypair,
        denominatedInSol: true,
        amount: devBuyAmount,
        slippage,
        priorityFee,
        pool: 'pump'
      };
      
      const response: AxiosResponse = await axios.post(url, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      return {
        success: true,
        data: response.data,
        txSignature: response.data?.signature || response.data?.txSignature,
      };
    } catch (error: any) {
      console.error('Error creating token:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error occurred',
      };
    }
  }
}

// Export a default instance factory
export function createPumpApiService(apiKey: string, walletPublicKey?: string, walletPrivateKey?: string, rpcUrl?: string): PumpApiService {
  return new PumpApiService({ 
    apiKey, 
    walletPublicKey, 
    walletPrivateKey, 
    rpcUrl 
  });
}
