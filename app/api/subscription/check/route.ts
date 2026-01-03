import { NextRequest, NextResponse } from 'next/server';
import { canReply, getSubscriptionStatus } from '@/lib/subscriptions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }
    
    // Check if wallet can reply
    const canReplyStatus = await canReply(walletAddress);
    const subscriptionStatus = await getSubscriptionStatus(walletAddress);
    
    return NextResponse.json({
      success: true,
      walletAddress,
      canReply: canReplyStatus,
      subscription: subscriptionStatus
    });
    
  } catch (error) {
    console.error('Subscription check API error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}
