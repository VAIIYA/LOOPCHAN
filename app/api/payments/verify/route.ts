import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signature } = body;

    if (!signature) {
      return NextResponse.json(
        { error: 'Transaction signature is required' },
        { status: 400 }
      );
    }

    // Verify the payment transaction
    const isValid = await paymentService.verifyPayment(signature);

    if (isValid) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Payment verified successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('Payment verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
