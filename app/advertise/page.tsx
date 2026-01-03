'use client'

import React, { useState } from 'react';
import { DollarSign, Clock, Target, Smartphone, Monitor, CheckCircle, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Header } from '../../src/components/Header';

interface AdPackage {
  id: string;
  duration: number;
  price: number;
  pricePerDay: number;
  popular?: boolean;
}

interface AdPlacement {
  id: string;
  name: string;
  dimensions: string;
  description: string;
  icon: React.ReactNode;
}

const adPackages: AdPackage[] = [
  {
    id: '7days',
    duration: 7,
    price: 1500,
    pricePerDay: 214.29
  },
  {
    id: '14days',
    duration: 14,
    price: 2750,
    pricePerDay: 196.43,
    popular: true
  },
  {
    id: '30days',
    duration: 30,
    price: 5000,
    pricePerDay: 166.67
  }
];

const adPlacements: AdPlacement[] = [
  {
    id: 'desktop-header',
    name: 'Desktop Header',
    dimensions: '728x90 Leaderboard',
    description: 'Prominent placement at the top of desktop pages',
    icon: <Monitor className="w-6 h-6" />
  },
  {
    id: 'desktop-footer',
    name: 'Desktop Footer',
    dimensions: '728x90 Leaderboard',
    description: 'Bottom placement on desktop pages',
    icon: <Monitor className="w-6 h-6" />
  },
  {
    id: 'mobile-header',
    name: 'Mobile Header',
    dimensions: '300x250 Medium Rectangle',
    description: 'Top placement on mobile devices',
    icon: <Smartphone className="w-6 h-6" />
  },
  {
    id: 'mobile-footer',
    name: 'Mobile Footer',
    dimensions: '300x250 Medium Rectangle',
    description: 'Bottom placement on mobile devices',
    icon: <Smartphone className="w-6 h-6" />
  }
];

export default function AdvertisePage() {
  const { wallet, connect } = useWallet();
  const [selectedPackage, setSelectedPackage] = useState<string>('14days');
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(['desktop-header']);
  const [selectedBoards, setSelectedBoards] = useState<string[]>(['all']);
  const [startDate, setStartDate] = useState<string>('');
  const [adImage, setAdImage] = useState<File | null>(null);
  const [adUrl, setAdUrl] = useState<string>('');
  const [adTitle, setAdTitle] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlacementToggle = (placementId: string) => {
    setSelectedPlacements(prev => 
      prev.includes(placementId)
        ? prev.filter(id => id !== placementId)
        : [...prev, placementId]
    );
  };

  const handleBoardToggle = (boardId: string) => {
    if (boardId === 'all') {
      setSelectedBoards(['all']);
    } else {
      setSelectedBoards(prev => {
        const newBoards = prev.filter(id => id !== 'all');
        if (newBoards.includes(boardId)) {
          return newBoards.filter(id => id !== boardId);
        } else {
          return [...newBoards, boardId];
        }
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, GIF, WebP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image file size must be under 5MB');
        return;
      }
      setAdImage(file);
    }
  };

  const calculateTotalPrice = () => {
    const package_ = adPackages.find(p => p.id === selectedPackage);
    if (!package_) return 0;
    
    // Simple pricing: just the package price, no hidden multipliers
    return package_.price;
  };

  const handlePurchase = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert('Please connect your Solana wallet to purchase advertising');
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
      return;
    }

    if (!adImage && !adUrl) {
      alert('Please provide either an ad image or URL');
      return;
    }

    if (!adTitle.trim()) {
      alert('Please provide an ad title');
      return;
    }

    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    setIsProcessing(true);
    
    try {
      const selectedPackageData = adPackages.find(p => p.id === selectedPackage);
      if (!selectedPackageData) {
        throw new Error('Invalid package selected');
      }

      // TODO: Implement payment processing for advertising
      // For now, just show a message that payment is not yet implemented
      alert('Advertising payment is not yet implemented. Please contact advertise@loopchan.org for manual setup.');
      
      // Reset form
      setSelectedPackage('14days');
      setSelectedPlacements(['desktop-header']);
      setSelectedBoards(['all']);
      setStartDate('');
      setAdImage(null);
      setAdUrl('');
      setAdTitle('');
      
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPackageData = adPackages.find(p => p.id === selectedPackage);
  const totalPrice = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-100">
      <Header 
        title="Advertise"
        showHomeLink={true}
        showAdvertiseLink={false}
      />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advertise on LoopChan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Reach over 100,000+ monthly visitors interested in anime, gaming, technology, and more. 
            Our community is engaged, tech-savvy, and ready to discover your products.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 text-center shadow-md">
            <div className="text-3xl font-bold text-orange-600 mb-2">100K+</div>
            <div className="text-gray-600">Monthly Visitors</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-md">
            <div className="text-3xl font-bold text-orange-600 mb-2">70+</div>
            <div className="text-gray-600">Active Boards</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center shadow-md">
            <div className="text-3xl font-bold text-orange-600 mb-2">18-34</div>
            <div className="text-gray-600">Target Age Range</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ad Packages */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-orange-500" />
                Ad Packages
              </h2>
              
              <div className="space-y-4">
                {adPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    } ${pkg.popular ? 'ring-2 ring-orange-300' : ''}`}
                    onClick={() => setSelectedPackage(pkg.id)}
                  >
                    {pkg.popular && (
                      <div className="text-xs font-semibold text-orange-600 mb-2">
                        MOST POPULAR
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900">
                        {pkg.duration} Days
                      </span>
                      <span className="text-2xl font-bold text-orange-600">
                        ${pkg.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${pkg.pricePerDay.toFixed(2)} per day
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ad Guidelines */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Images: JPG, PNG, GIF, WebP (max 5MB)
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Work-safe content only
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  No misleading or deceptive content
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Landing pages must match ad content
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Ad Configuration */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-orange-500" />
                Ad Configuration
              </h2>

              {/* Ad Placements */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ad Placements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adPlacements.map((placement) => (
                    <div
                      key={placement.id}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                        selectedPlacements.includes(placement.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => handlePlacementToggle(placement.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {placement.icon}
                        <div>
                          <div className="font-medium text-gray-900">{placement.name}</div>
                          <div className="text-sm text-gray-600">{placement.dimensions}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Board Targeting */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Board Targeting</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleBoardToggle('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedBoards.includes('all')
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All Boards
                  </button>
                  {['a', 'b', 'c', 'g', 'v', 'mu', 'p', 'fit'].map((boardId) => (
                    <button
                      key={boardId}
                      onClick={() => handleBoardToggle(boardId)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedBoards.includes(boardId)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      /{boardId}/
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Campaign Start Date</h3>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Ad Content */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ad Content</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Title *
                  </label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Enter your ad title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Image *
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF, WebP up to 5MB
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landing Page URL *
                  </label>
                  <input
                    type="url"
                    value={adUrl}
                    onChange={(e) => setAdUrl(e.target.value)}
                    placeholder="https://your-website.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-orange-500" />
                Purchase Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span className="font-medium">
                    {selectedPackageData?.duration} Days - ${selectedPackageData?.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Placements:</span>
                  <span className="font-medium">{selectedPlacements.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span>Board Coverage:</span>
                  <span className="font-medium">
                    {selectedBoards.includes('all') ? 'All Boards' : `${selectedBoards.length} specific boards`}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price:</span>
                    <span className="text-orange-600">${totalPrice.toLocaleString()} USDC</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    All placements and board coverage included at no extra cost
                  </p>
                </div>
              </div>

              {!wallet.connected || !wallet.publicKey ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-orange-800 mb-3">
                    Please connect your Solana wallet to purchase advertising
                  </p>
                  <button
                    onClick={connect}
                    disabled={wallet.connecting}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-orange-300"
                  >
                    {wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={isProcessing || !adImage || !adUrl || !adTitle || !startDate}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Purchase for ${totalPrice.toLocaleString()} USDC`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-orange-200 bg-white py-6 mt-12 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">
            LoopChan - Anonymous discussion platform powered by Solana
          </p>
          <p className="text-gray-500 text-xs mt-2">
            For advertising inquiries, contact advertise@loopchan.org
          </p>
        </div>
      </footer>
    </div>
  );
}

