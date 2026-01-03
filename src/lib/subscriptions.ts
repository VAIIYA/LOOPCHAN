import { uploadBufferToCloudinary } from './cloudinaryStorage';

// Subscription data structure
export interface Subscription {
  walletAddress: string;
  type: 'free' | 'paid';
  startDate: string;
  endDate?: string; // Only for paid subscriptions
  paymentAmount?: number; // Only for paid subscriptions
  isActive: boolean;
}

// Free users list - wallets that don't need to pay
const FREE_WALLETS = [
  '2Z9eW3nwa2GZUM1JzXdfBK1MN57RPA2PrhuTREEZ31VY'
];

// Storage keys
const FREE_WALLETS_KEY = 'free_wallets.json';
const PAID_SUBSCRIPTIONS_KEY = 'paid_subscriptions.json';

// Check if a wallet has free access
export async function isFreeWallet(walletAddress: string): Promise<boolean> {
  try {
    // Check hardcoded free wallets first
    if (FREE_WALLETS.includes(walletAddress)) {
      return true;
    }
    
    // Check dynamic free wallets list from storage
    const freeWallets = await getFreeWallets();
    return freeWallets.includes(walletAddress);
  } catch (error) {
    console.error('Error checking free wallet status:', error);
    return false;
  }
}

// Get list of free wallets from storage
export async function getFreeWallets(): Promise<string[]> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      console.error('Cloudinary not configured');
      return FREE_WALLETS;
    }

    // For now, we'll store free wallets in a simple JSON structure
    // In a production app, you'd want a proper database
    try {
      // Try to load from Cloudinary (this would need to be implemented)
      // For now, return the hardcoded list
      return FREE_WALLETS;
    } catch (error) {
      console.error('Error getting free wallets:', error);
      return FREE_WALLETS; // Fallback to hardcoded list
    }
  } catch (error) {
    console.error('Error getting free wallets:', error);
    return FREE_WALLETS; // Fallback to hardcoded list
  }
}

// Save list of free wallets to storage
export async function saveFreeWallets(wallets: string[]): Promise<void> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('Cloudinary not configured');
    }

    const data = { wallets, lastUpdated: new Date().toISOString() };
    const buffer = Buffer.from(JSON.stringify(data), 'utf8');
    
    await uploadBufferToCloudinary(buffer, FREE_WALLETS_KEY, 'application/json');
  } catch (error) {
    console.error('Error saving free wallets:', error);
    throw error;
  }
}

// Add a wallet to free list
export async function addFreeWallet(walletAddress: string): Promise<void> {
  try {
    const freeWallets = await getFreeWallets();
    if (!freeWallets.includes(walletAddress)) {
      freeWallets.push(walletAddress);
      await saveFreeWallets(freeWallets);
    }
  } catch (error) {
    console.error('Error adding free wallet:', error);
    throw error;
  }
}

// Remove a wallet from free list
export async function removeFreeWallet(walletAddress: string): Promise<void> {
  try {
    const freeWallets = await getFreeWallets();
    const updatedWallets = freeWallets.filter(wallet => wallet !== walletAddress);
    await saveFreeWallets(updatedWallets);
  } catch (error) {
    console.error('Error removing free wallet:', error);
    throw error;
  }
}

// Check if a wallet has an active paid subscription
export async function hasActiveSubscription(walletAddress: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(walletAddress);
    if (!subscription) return false;
    
    if (subscription.type === 'free') return true;
    
    if (subscription.type === 'paid' && subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      return endDate > now && subscription.isActive;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

// Get subscription details for a wallet
export async function getSubscription(walletAddress: string): Promise<Subscription | null> {
  try {
    // Check if it's a free wallet first
    if (await isFreeWallet(walletAddress)) {
      return {
        walletAddress,
        type: 'free',
        startDate: new Date().toISOString(),
        isActive: true
      };
    }
    
    // Check paid subscriptions
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      console.error('Cloudinary not configured');
      return null;
    }

    try {
      // For now, we'll use a simple approach
      // In production, you'd want a proper database
      return null;
    } catch (fileError) {
      // File doesn't exist yet, return null
      return null;
    }
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

// Create or renew a paid subscription
export async function createSubscription(walletAddress: string, paymentAmount: number = 0.99): Promise<Subscription> {
  try {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (31 * 24 * 60 * 60 * 1000)); // 31 days
    
    const subscription: Subscription = {
      walletAddress,
      type: 'paid',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      paymentAmount,
      isActive: true
    };
    
    // Get existing subscriptions
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('Cloudinary not configured');
    }

    let subscriptions: Subscription[] = [];
    try {
      // For now, we'll use a simple approach
      // In production, you'd want a proper database
      subscriptions = [];
    } catch (fileError) {
      // File doesn't exist yet, start with empty array
      subscriptions = [];
    }
    
    // Update or add subscription
    const existingIndex = subscriptions.findIndex(sub => sub.walletAddress === walletAddress);
    if (existingIndex >= 0) {
      subscriptions[existingIndex] = subscription;
    } else {
      subscriptions.push(subscription);
    }
    
    // Save updated subscriptions
    const data = { 
      subscriptions, 
      lastUpdated: new Date().toISOString() 
    };
    
    const buffer = Buffer.from(JSON.stringify(data), 'utf8');
    await uploadBufferToCloudinary(buffer, PAID_SUBSCRIPTIONS_KEY, 'application/json');
    
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Get all paid subscriptions
export async function getAllPaidSubscriptions(): Promise<Subscription[]> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      console.error('Cloudinary not configured');
      return [];
    }

    // For now, we'll use a simple approach
    // In production, you'd want a proper database
    return [];
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return [];
  }
}

// Check if wallet can reply (has free access or active subscription)
export async function canReply(walletAddress: string): Promise<boolean> {
  try {
    const isFree = await isFreeWallet(walletAddress);
    if (isFree) return true;
    
    const hasSubscription = await hasActiveSubscription(walletAddress);
    return hasSubscription;
  } catch (error) {
    console.error('Error checking reply permission:', error);
    return false;
  }
}

// Get subscription status summary
export async function getSubscriptionStatus(walletAddress: string): Promise<{
  canReply: boolean;
  type: 'free' | 'paid' | 'none';
  daysRemaining?: number;
  endDate?: string;
}> {
  try {
    const isFree = await isFreeWallet(walletAddress);
    if (isFree) {
      return {
        canReply: true,
        type: 'free'
      };
    }
    
    const subscription = await getSubscription(walletAddress);
    if (subscription && subscription.type === 'paid' && subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        canReply: daysRemaining > 0 && subscription.isActive,
        type: 'paid',
        daysRemaining: Math.max(0, daysRemaining),
        endDate: subscription.endDate
      };
    }
    
    return {
      canReply: false,
      type: 'none'
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      canReply: false,
      type: 'none'
    };
  }
}
