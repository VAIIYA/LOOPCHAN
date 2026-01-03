import { NextRequest, NextResponse } from 'next/server';
import { 
  getFreeWallets, 
  addFreeWallet, 
  removeFreeWallet, 
  getAllPaidSubscriptions,
  getSubscriptionStatus,
  createSubscription
} from '@/lib/subscriptions';

// Admin wallet addresses that can access this API
const ADMIN_WALLETS = [
  '2Z9eW3nwa2GZUM1JzXdfBK1MN57RPA2PrhuTREEZ31VY',
  'HK7aLFrSXgUhaTPCJpEBDS6kgfwG9kJUBUqThFhX5PMG'
];

// Helper function to verify admin access
function verifyAdminAccess(request: NextRequest): { isAdmin: boolean; adminWallet?: string } {
  // Check for admin wallet in headers (sent from frontend)
  const adminWallet = request.headers.get('x-admin-wallet');
  
  if (!adminWallet || !ADMIN_WALLETS.includes(adminWallet)) {
    return { isAdmin: false };
  }
  
  return { isAdmin: true, adminWallet };
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin } = verifyAdminAccess(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const walletAddress = searchParams.get('wallet');
    
    if (action === 'status' && walletAddress) {
      // Get subscription status for specific wallet
      const status = await getSubscriptionStatus(walletAddress);
      return NextResponse.json({
        success: true,
        walletAddress,
        status
      });
    }
    
    if (action === 'free') {
      // Get list of free wallets
      const freeWallets = await getFreeWallets();
      return NextResponse.json({
        success: true,
        freeWallets,
        count: freeWallets.length
      });
    }
    
    if (action === 'paid') {
      // Get all paid subscriptions
      const paidSubscriptions = await getAllPaidSubscriptions();
      return NextResponse.json({
        success: true,
        paidSubscriptions,
        count: paidSubscriptions.length
      });
    }
    
    // Default: return both lists
    const freeWallets = await getFreeWallets();
    const paidSubscriptions = await getAllPaidSubscriptions();
    
    return NextResponse.json({
      success: true,
      freeWallets: {
        wallets: freeWallets,
        count: freeWallets.length
      },
      paidSubscriptions: {
        subscriptions: paidSubscriptions,
        count: paidSubscriptions.length
      }
    });
    
  } catch (error) {
    console.error('Admin subscriptions API error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription info' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { isAdmin } = verifyAdminAccess(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { action, walletAddress, paymentAmount } = await request.json();
    
    if (!action || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: action and walletAddress' },
        { status: 400 }
      );
    }
    
    if (action === 'add-free') {
      // Add wallet to free list
      await addFreeWallet(walletAddress);
      return NextResponse.json({
        success: true,
        message: `Wallet ${walletAddress} added to free list`,
        walletAddress
      });
    }
    
    if (action === 'remove-free') {
      // Remove wallet from free list
      await removeFreeWallet(walletAddress);
      return NextResponse.json({
        success: true,
        message: `Wallet ${walletAddress} removed from free list`,
        walletAddress
      });
    }
    
    if (action === 'create-subscription') {
      // Create or renew paid subscription
      const amount = paymentAmount || 0.99;
      const subscription = await createSubscription(walletAddress, amount);
      return NextResponse.json({
        success: true,
        message: `Subscription created for wallet ${walletAddress}`,
        subscription
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Admin subscriptions POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription action' },
      { status: 500 }
    );
  }
}
