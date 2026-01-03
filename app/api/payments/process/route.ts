import { NextRequest, NextResponse } from 'next/server';
import { paymentService, PaymentRequest } from '@/lib/payments';
import { createSubscription } from '@/lib/subscriptions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromWallet, amount, description, type, subscriptionData } = body;

    // Validate required fields
    if (!fromWallet || !amount || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: fromWallet, amount, description, type' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0 || amount > 1000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between 0.01 and 1000 USDC' },
        { status: 400 }
      );
    }

    // Check if wallet has sufficient USDC balance
    const hasBalance = await paymentService.hasSufficientBalance(fromWallet, amount);
    if (!hasBalance) {
      return NextResponse.json(
        { error: 'Insufficient USDC balance. Please ensure you have enough USDC in your wallet.' },
        { status: 400 }
      );
    }

    // Create payment request
    const paymentRequest: PaymentRequest = {
      fromWallet,
      amount,
      description,
      type
    };

    // Process the payment
    const paymentResult = await paymentService.processPayment(paymentRequest);

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Payment processing failed' },
        { status: 400 }
      );
    }

    // If this is a subscription payment, create the subscription
    if (type === 'subscription' && subscriptionData) {
      try {
        const subscription = await createSubscription(fromWallet, amount);
        return NextResponse.json({
          success: true,
          payment: paymentResult,
          subscription: subscription,
          message: 'Payment processed successfully. Subscription created.'
        });
      } catch (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
          { error: 'Payment processed but subscription creation failed. Please contact support.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      payment: paymentResult,
      message: 'Payment processed successfully.'
    });

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
