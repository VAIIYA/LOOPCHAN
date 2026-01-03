'use client'

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';

const WalletConnect: React.FC = () => {
  const { wallet, connect, disconnect } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (wallet.connected) {
    return (
      <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-green-800">
          {formatAddress(wallet.publicKey)}
        </span>
        <button
          onClick={disconnect}
          className="text-xs text-green-600 hover:text-green-800 underline transition-colors"
          title="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-sm font-medium text-orange-800">
            Wallet Required
          </span>
        </div>
        <button
          onClick={connect}
          disabled={wallet.connecting}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium px-3 py-1 rounded transition-colors"
        >
          {wallet.connecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

export default WalletConnect;
