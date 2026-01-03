'use client'

import React from 'react';
import WalletConnect from './WalletConnect';

interface HeaderProps {
  showHomeLink?: boolean;
  showAdvertiseLink?: boolean;
  title?: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  showHomeLink = true, 
  showAdvertiseLink = true, 
  title = 'LoopChan',
  onBack 
}) => {
  return (
    <header className="bg-white border-b border-orange-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
            )}
            
            <a 
              href="/" 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="LoopChan Logo" 
                  className="w-8 h-8"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-orange-600">LoopChan</h1>
                {title && title !== 'LoopChan' && (
                  <span className="text-sm text-gray-600">{title}</span>
                )}
              </div>
            </a>
            
            {showHomeLink && (
              <a
                href="/"
                className="text-orange-600 hover:text-orange-700 transition-colors"
              >
                Home
              </a>
            )}
            
            {showAdvertiseLink && (
              <a
                href="/advertise"
                className="text-orange-600 hover:text-orange-700 transition-colors"
              >
                Advertise
              </a>
            )}
          </div>
          
          <WalletConnect />
        </div>
      </div>
    </header>
  );
};