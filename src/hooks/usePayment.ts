'use client'

import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';

export interface PaymentOptions {
  amount: number;
  description: string;
  type: 'subscription' | 'advertising';
  subscriptionData?: any;
}

export interface PaymentState {
  isProcessing: boolean;
  isVerifying: boolean;
  error: string | null;
  success: boolean;
  transactionId: string | null;
}

export const usePayment = () => {
  const { wallet } = useWallet();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    isVerifying: false,
    error: null,
    success: false,
    transactionId: null
  });

  const processPayment = useCallback(async (options: PaymentOptions) => {
    if (!wallet.connected || !wallet.publicKey) {
      setPaymentState(prev => ({
        ...prev,
        error: 'Please connect your wallet first'
      }));
      return false;
    }

    setPaymentState({
      isProcessing: true,
      isVerifying: false,
      error: null,
      success: false,
      transactionId: null
    });

    try {
      // Step 1: Initiate payment
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromWallet: wallet.publicKey.toString(),
          amount: options.amount,
          description: options.description,
          type: options.type,
          subscriptionData: options.subscriptionData
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment processing failed');
      }

      if (!result.success) {
        throw new Error(result.error || 'Payment processing failed');
      }

      // Step 2: If we have a transaction, we need to sign and send it
      if (result.payment.transactionId) {
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false,
          isVerifying: true,
          transactionId: result.payment.transactionId
        }));

        // In a real implementation, you would:
        // 1. Get the transaction from the payment service
        // 2. Sign it with the user's wallet
        // 3. Send it to the blockchain
        // 4. Wait for confirmation
        // 5. Verify the payment

        // For now, we'll simulate the process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate successful payment
        setPaymentState(prev => ({
          ...prev,
          isVerifying: false,
          success: true,
          error: null
        }));

        return true;
      }

      // If no transaction needed (already processed)
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        success: true,
        error: null
      }));

      return true;

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        isVerifying: false,
        error: error instanceof Error ? error.message : 'Payment failed',
        success: false
      }));
      return false;
    }
  }, [wallet]);

  const verifyPayment = useCallback(async (signature: string) => {
    setPaymentState(prev => ({
      ...prev,
      isVerifying: true,
      error: null
    }));

    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment verification failed');
      }

      setPaymentState(prev => ({
        ...prev,
        isVerifying: false,
        success: result.verified,
        error: result.verified ? null : 'Payment verification failed'
      }));

      return result.verified;

    } catch (error) {
      console.error('Verification error:', error);
      setPaymentState(prev => ({
        ...prev,
        isVerifying: false,
        error: error instanceof Error ? error.message : 'Verification failed',
        success: false
      }));
      return false;
    }
  }, []);

  const resetPaymentState = useCallback(() => {
    setPaymentState({
      isProcessing: false,
      isVerifying: false,
      error: null,
      success: false,
      transactionId: null
    });
  }, []);

  return {
    paymentState,
    processPayment,
    verifyPayment,
    resetPaymentState
  };
};
