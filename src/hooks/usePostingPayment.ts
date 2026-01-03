import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { POSTING_FEE } from '@/lib/admin';

export interface PostingPaymentState {
  isProcessing: boolean;
  isVerifying: boolean;
  error: string | null;
  success: boolean;
  transactionSignature: string | null;
}

export const usePostingPayment = () => {
  const { wallet } = useWallet();
  const [paymentState, setPaymentState] = useState<PostingPaymentState>({
    isProcessing: false,
    isVerifying: false,
    error: null,
    success: false,
    transactionSignature: null
  });

  const processPayment = useCallback(async (): Promise<string | null> => {
    if (!wallet.connected || !wallet.publicKey) {
      setPaymentState(prev => ({
        ...prev,
        error: 'Please connect your wallet first'
      }));
      return null;
    }

    setPaymentState({
      isProcessing: true,
      isVerifying: false,
      error: null,
      success: false,
      transactionSignature: null
    });

    try {
      // Step 1: Get the transaction from the server
      const response = await fetch('/api/payments/posting-fee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromWallet: wallet.publicKey.toString()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create payment transaction');
      }

      if (!result.success || !result.transaction) {
        throw new Error(result.error || 'Failed to create payment transaction');
      }

      // Step 2: Deserialize and sign the transaction
      const transactionBuffer = Buffer.from(result.transaction, 'base64');
      const transaction = require('@solana/web3.js').Transaction.from(transactionBuffer);

      // Sign with Phantom wallet
      if (typeof window !== 'undefined' && 'solana' in window) {
        const phantom = (window as any).solana;
        if (phantom?.isPhantom) {
          const signedTransaction = await phantom.signTransaction(transaction);
          
          // Step 3: Send the signed transaction
          const connection = new (require('@solana/web3.js').Connection)(
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
            'confirmed'
          );

          const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
            skipPreflight: false,
            maxRetries: 3
          });

          setPaymentState(prev => ({
            ...prev,
            isProcessing: false,
            isVerifying: true,
            transactionSignature: signature
          }));

          // Step 4: Wait for confirmation
          await connection.confirmTransaction(signature, 'confirmed');

          // Step 5: Verify the payment
          const verifyResponse = await fetch(
            `/api/payments/posting-fee?signature=${signature}&fromWallet=${wallet.publicKey.toString()}`
          );
          const verifyResult = await verifyResponse.json();

          if (verifyResult.verified) {
            setPaymentState(prev => ({
              ...prev,
              isVerifying: false,
              success: true,
              error: null
            }));
            return signature;
          } else {
            throw new Error('Payment verification failed');
          }
        } else {
          throw new Error('Phantom wallet not available');
        }
      } else {
        throw new Error('Solana wallet not available');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        isVerifying: false,
        error: error instanceof Error ? error.message : 'Payment failed',
        success: false
      }));
      return null;
    }
  }, [wallet]);

  const resetPaymentState = useCallback(() => {
    setPaymentState({
      isProcessing: false,
      isVerifying: false,
      error: null,
      success: false,
      transactionSignature: null
    });
  }, []);

  return {
    paymentState,
    processPayment,
    resetPaymentState,
    postingFee: POSTING_FEE
  };
};

