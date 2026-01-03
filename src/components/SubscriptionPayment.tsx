'use client'

import React, { useState } from 'react';
import { DollarSign, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { useWallet } from '@/contexts/WalletContext';

interface SubscriptionPaymentProps {
  subscriptionStatus: {
    type: 'free' | 'paid' | 'none';
    daysRemaining?: number;
  };
  onPaymentSuccess?: () => void;
}

export const SubscriptionPayment: React.FC<SubscriptionPaymentProps> = ({
  subscriptionStatus,
  onPaymentSuccess
}) => {
  const { wallet } = useWallet();
  const { paymentState, processPayment, resetPaymentState } = usePayment();
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePayment = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    const success = await processPayment({
      amount: 0.99,
      description: 'LoopChan Subscription - 31 days of reply access',
      type: 'subscription',
      subscriptionData: {
        duration: 31,
        startDate: new Date().toISOString()
      }
    });

    if (success) {
      setShowPaymentForm(false);
      onPaymentSuccess?.();
      // Reset payment state after a delay
      setTimeout(() => {
        resetPaymentState();
      }, 3000);
    }
  };

  if (paymentState.success) {
    return (
      <div className="text-center space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-green-800 mb-2">
            <CheckCircle size={20} />
            <span className="font-medium">Payment Successful!</span>
          </div>
          <p className="text-green-700 text-sm">
            Your subscription has been activated. You can now reply to threads.
          </p>
        </div>
      </div>
    );
  }

  if (showPaymentForm) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
            <DollarSign size={20} />
            <span className="font-medium">Complete Payment</span>
          </div>
          <p className="text-blue-700 text-sm mb-3">
            Pay 0.99 USDC to activate your 31-day subscription
          </p>
          
          {paymentState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle size={16} />
                <span className="text-sm">{paymentState.error}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handlePayment}
              disabled={paymentState.isProcessing || paymentState.isVerifying}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {(paymentState.isProcessing || paymentState.isVerifying) ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    {paymentState.isProcessing ? 'Processing...' : 'Verifying...'}
                  </span>
                </>
              ) : (
                <>
                  <DollarSign size={16} />
                  <span>Pay 0.99 USDC</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowPaymentForm(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-3">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2 text-yellow-800 mb-2">
          <DollarSign size={20} />
          <span className="font-medium">Subscription Required</span>
        </div>
        <p className="text-yellow-700 text-sm mb-3">
          {subscriptionStatus.type === 'none' 
            ? 'You need a subscription to reply to threads.'
            : 'Your subscription has expired. Please renew to continue replying.'
          }
        </p>
        <div className="bg-yellow-100 rounded-lg p-3 mb-3">
          <div className="text-lg font-bold text-yellow-800">0.99 USDC</div>
          <div className="text-sm text-yellow-700">31 days of reply access</div>
        </div>
        
        <button
          onClick={() => setShowPaymentForm(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Get Subscription
        </button>
      </div>
    </div>
  );
};
