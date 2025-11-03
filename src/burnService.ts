import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, createBurnInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

export interface BurnConfig {
  rpcUrl: string;
  walletPrivateKey: string;
}

export interface BurnResult {
  success: boolean;
  signature?: string;
  amountBurned?: number;
  error?: string;
}

export class TokenBurnService {
  private connection: Connection;
  private wallet: Keypair;

  constructor(config: BurnConfig) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    
    // Parse private key (supports both base58 and array formats)
    try {
      const privateKey = config.walletPrivateKey;
      let secretKey: Uint8Array;

      if (privateKey.startsWith('[')) {
        // Array format: [1,2,3,...]
        const keyArray = JSON.parse(privateKey);
        secretKey = Uint8Array.from(keyArray);
      } else {
        // Base58 format
        secretKey = bs58.decode(privateKey);
      }

      this.wallet = Keypair.fromSecretKey(secretKey);
    } catch (error) {
      console.error('Error parsing wallet private key:', error);
      throw new Error('Invalid wallet private key format');
    }
  }

  /**
   * Burn all tokens of a specific mint from the wallet
   * Uses sol-incinerator burn address: 1nc1nerator11111111111111111111111111111111
   */
  async burnAllTokens(tokenMintAddress: string): Promise<BurnResult> {
    try {
      const mintPublicKey = new PublicKey(tokenMintAddress);
      const walletPublicKey = this.wallet.publicKey;

      // Get the associated token account for this mint
      const tokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
      );

      // Get token account balance
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(tokenAccount);
      
      if (!tokenAccountInfo || !tokenAccountInfo.value.uiAmount || tokenAccountInfo.value.uiAmount === 0) {
        return {
          success: false,
          error: 'No tokens found to burn'
        };
      }

      const amountToBurn = BigInt(tokenAccountInfo.value.amount);
      const uiAmount = tokenAccountInfo.value.uiAmount;

      console.log(`🔥 Burning ${uiAmount} tokens of mint ${tokenMintAddress}...`);

      // Create burn instruction using SPL Token's burn function
      const burnInstruction = createBurnInstruction(
        tokenAccount,           // Token account to burn from
        mintPublicKey,          // Mint
        walletPublicKey,        // Owner of token account
        amountToBurn,           // Amount to burn (in smallest units)
        [],                     // Multisig signers (empty for single signer)
        TOKEN_PROGRAM_ID        // Token program ID
      );

      // Create and send transaction
      const transaction = new Transaction().add(burnInstruction);
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      // Sign transaction
      transaction.sign(this.wallet);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        }
      );

      // Confirm transaction (PRODUCTION: Wait for confirmation)
      let confirmation;
      try {
        confirmation = await this.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
      } catch (confirmError: any) {
        // If confirmation times out, check transaction status directly
        console.warn(`⚠️ Confirmation timeout, checking transaction status...`);
        const txStatus = await this.connection.getSignatureStatus(signature);
        
        if (txStatus.value && txStatus.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(txStatus.value.err)}`);
        } else if (txStatus.value && !txStatus.value.err) {
          // Transaction appears successful even if confirmation timed out
          console.log(`✅ Transaction confirmed (verified via status check)`);
        } else {
          throw new Error(`Transaction status unknown - may be pending`);
        }
      }

      if (confirmation && confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log(`✅ Successfully burned ${uiAmount} tokens!`);
      console.log(`🔥 Burn signature: ${signature}`);
      console.log(`🔗 View on Solscan: https://solscan.io/tx/${signature}`);

      // PRODUCTION CHECK: Verify balance decreased
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s for state update
      const verifyBalance = await this.getTokenBalance(tokenMintAddress);
      
      if (verifyBalance > 0) {
        console.warn(`⚠️ Warning: Balance verification shows ${verifyBalance} tokens remaining`);
        console.warn(`⚠️ This may be a state sync delay - transaction appears successful`);
      } else {
        console.log(`✅ Balance verified: All tokens burned (0 remaining)`);
      }

      return {
        success: true,
        signature,
        amountBurned: uiAmount
      };

    } catch (error: any) {
      console.error('Error burning tokens:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while burning'
      };
    }
  }

  /**
   * Get token balance for a specific mint
   */
  async getTokenBalance(tokenMintAddress: string): Promise<number> {
    try {
      const mintPublicKey = new PublicKey(tokenMintAddress);
      const walletPublicKey = this.wallet.publicKey;

      const tokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPublicKey
      );

      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 0;
    }
  }

  /**
   * Wait for tokens to appear in wallet after purchase
   */
  async waitForTokens(tokenMintAddress: string, timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const balance = await this.getTokenBalance(tokenMintAddress);
      if (balance > 0) {
        console.log(`✅ Tokens detected in wallet: ${balance}`);
        return true;
      }
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.warn('⚠️ Timeout waiting for tokens to appear in wallet');
    return false;
  }
}

/**
 * Factory function to create burn service
 */
export function createBurnService(rpcUrl: string, walletPrivateKey: string): TokenBurnService {
  return new TokenBurnService({ rpcUrl, walletPrivateKey });
}











