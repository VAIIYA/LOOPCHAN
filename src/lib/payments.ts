import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';

// USDC mint address on Solana mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// LoopChan treasury wallet (you'll need to replace this with your actual treasury wallet)
// Using a placeholder that won't cause build errors
const TREASURY_WALLET = process.env.TREASURY_WALLET_ADDRESS 
  ? new PublicKey(process.env.TREASURY_WALLET_ADDRESS)
  : new PublicKey('11111111111111111111111111111112'); // System program as placeholder

// RPC endpoint - using Helius for better reliability
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY';

export interface PaymentRequest {
  fromWallet: string;
  amount: number; // Amount in USDC (e.g., 0.99 for $0.99)
  description: string;
  type: 'subscription' | 'advertising';
}

export interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
  transactionId?: string;
}

export class PaymentService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
  }

  /**
   * Process a USDC payment for subscriptions or advertising
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const fromPublicKey = new PublicKey(request.fromWallet);
      const treasuryPublicKey = TREASURY_WALLET;

      // Get the associated token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        fromPublicKey
      );

      const treasuryTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        treasuryPublicKey
      );

      // Check if the user has a USDC token account
      try {
        await getAccount(this.connection, fromTokenAccount);
      } catch (error) {
        return {
          success: false,
          error: 'USDC token account not found. Please ensure you have USDC in your wallet.'
        };
      }

      // Check if treasury has a USDC token account
      try {
        await getAccount(this.connection, treasuryTokenAccount);
      } catch (error) {
        return {
          success: false,
          error: 'Treasury USDC account not configured. Please contact support.'
        };
      }

      // Convert USDC amount to smallest unit (USDC has 6 decimals)
      const amountInSmallestUnit = Math.floor(request.amount * 1_000_000);

      // Create the transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        treasuryTokenAccount,
        fromPublicKey,
        amountInSmallestUnit
      );

      // Create and send the transaction
      const transaction = new Transaction().add(transferInstruction);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPublicKey;

      return {
        success: true,
        transactionId: transaction.signature?.toString(),
        signature: 'pending_user_signature'
      };

    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(signature: string): Promise<boolean> {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        commitment: 'confirmed'
      });

      if (!transaction) {
        return false;
      }

      // Check if the transaction was successful
      if (transaction.meta?.err) {
        return false;
      }

      // Verify the transaction includes a USDC transfer to our treasury
      const treasuryPublicKey = TREASURY_WALLET;
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        treasuryPublicKey
      );

      // Check if the transaction includes a transfer to our treasury
      const hasTransferToTreasury = transaction.meta?.postTokenBalances?.some(
        balance => balance.mint === USDC_MINT.toString() && 
                   balance.owner === treasuryTokenAccount.toString() &&
                   (balance.uiTokenAmount?.uiAmount || 0) > 0
      );

      return hasTransferToTreasury || false;

    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Get USDC balance for a wallet
   */
  async getUSDCBalance(walletAddress: string): Promise<number> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      
      const accountInfo = await getAccount(this.connection, tokenAccount);
      return Number(accountInfo.amount) / 1_000_000; // Convert from smallest unit to USDC

    } catch (error) {
      console.error('Error getting USDC balance:', error);
      return 0;
    }
  }

  /**
   * Check if a wallet has sufficient USDC balance
   */
  async hasSufficientBalance(walletAddress: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getUSDCBalance(walletAddress);
    return balance >= requiredAmount;
  }
}

// Export a singleton instance
export const paymentService = new PaymentService();
