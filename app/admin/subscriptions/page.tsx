'use client'

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DollarSign, Users, Shield, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface FreeWallet {
  wallets: string[];
  count: number;
}

interface PaidSubscription {
  subscriptions: Array<{
    walletAddress: string;
    type: 'paid';
    startDate: string;
    endDate: string;
    paymentAmount: number;
    isActive: boolean;
  }>;
  count: number;
}

// Admin email addresses that can access this page
const ADMIN_EMAILS = [
  'admin@loopchan.vercel.app',
  // Add your admin email addresses here
];

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession();
  const [freeWallets, setFreeWallets] = useState<FreeWallet>({ wallets: [], count: 0 });
  const [paidSubscriptions, setPaidSubscriptions] = useState<PaidSubscription>({ subscriptions: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [action, setAction] = useState<'add-free' | 'remove-free'>('add-free');

  // Check if current user is an admin
  const isAdmin = status === 'authenticated' && session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    if (isAdmin) {
      loadSubscriptionData();
    }
  }, [isAdmin]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/subscriptions', {
        headers: {
          'x-admin-email': session?.user?.email || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFreeWallets(data.freeWallets);
        setPaidSubscriptions(data.paidSubscriptions);
      } else if (response.status === 403) {
        console.error('Admin access denied');
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletAction = async () => {
    if (!newWalletAddress.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': session?.user?.email || ''
        },
        body: JSON.stringify({
          action,
          walletAddress: newWalletAddress.trim()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setNewWalletAddress('');
        loadSubscriptionData(); // Reload data
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to perform wallet action:', error);
      alert('Failed to perform action. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header title="Admin Subscriptions" showHomeLink={true} showAdvertiseLink={false} />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="bg-white rounded-lg p-8 shadow-md max-w-md mx-auto">
              <div className="flex justify-center mb-4">
                <Shield className="w-16 h-16 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                This admin panel is restricted to authorized wallet addresses only.
              </p>
              {status !== 'authenticated' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Please sign in to verify admin access.
                  </p>
                  <button
                    onClick={() => window.location.href = '/auth/signin'}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Your account is not authorized for admin access</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Signed in as: {session?.user?.email}
                  </p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Admin Subscriptions" showHomeLink={true} showAdvertiseLink={false} />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-orange-600">Loading subscription data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Admin Subscriptions" showHomeLink={true} showAdvertiseLink={false} />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage free wallets and monitor paid subscriptions for the LoopChan platform.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{freeWallets.count}</div>
                <div className="text-gray-600">Free Wallets</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{paidSubscriptions.count}</div>
                <div className="text-gray-600">Paid Subscriptions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Management */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Manage Free Wallets</h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                placeholder="Enter Solana wallet address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setAction('add-free')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  action === 'add-free' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Add Free
              </button>
              <button
                onClick={() => setAction('remove-free')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  action === 'remove-free' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Remove Free
              </button>
            </div>
            
            <button
              onClick={handleWalletAction}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              {action === 'add-free' ? 'Add to Free List' : 'Remove from Free List'}
            </button>
          </div>

          {/* Free Wallets List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Current Free Wallets:</h3>
            {freeWallets.wallets.length === 0 ? (
              <p className="text-gray-500 italic">No free wallets configured</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {freeWallets.wallets.map((wallet, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="font-mono text-sm text-gray-700 truncate">
                      {wallet.slice(0, 8)}...{wallet.slice(-8)}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Free
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Paid Subscriptions */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Paid Subscriptions</h2>
          
          {paidSubscriptions.subscriptions.length === 0 ? (
            <p className="text-gray-500 italic">No paid subscriptions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Wallet</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">End Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Days Left</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paidSubscriptions.subscriptions.map((sub, index) => {
                    const daysRemaining = getDaysRemaining(sub.endDate);
                    const isExpired = daysRemaining === 0;
                    
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-700">
                            {sub.walletAddress.slice(0, 8)}...{sub.walletAddress.slice(-8)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(sub.startDate)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(sub.endDate)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm font-medium ${
                            isExpired ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {isExpired ? 'Expired' : `${daysRemaining} days`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          ${sub.paymentAmount} USDC
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isExpired 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
