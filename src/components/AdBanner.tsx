'use client'

import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  position: 'header' | 'footer';
  boardId?: string;
  className?: string;
}

interface AdData {
  id: string;
  title: string;
  imageUrl: string;
  landingUrl: string;
  startDate: string;
  endDate: string;
  placements: string[];
  boards: string[];
  wallet: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  position, 
  boardId = 'all',
  className = '' 
}) => {
  const [currentAd, setCurrentAd] = useState<AdData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching active ads from the blockchain/database
    const fetchActiveAds = async () => {
      setIsLoading(true);
      
      try {
        // TODO: Replace with actual blockchain query for active ads
        // This would query a smart contract or database for ads that:
        // 1. Are currently active (between start and end dates)
        // 2. Match the current position (header/footer)
        // 3. Target the current board or all boards
        
        // Mock data for demonstration
        const mockAds: AdData[] = [
          {
            id: 'ad1',
            title: 'LoopChan Premium - Get Early Access',
            imageUrl: 'https://picsum.photos/seed/ad1/728/90',
            landingUrl: 'https://premium.loopchan.org',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            placements: ['desktop-header', 'desktop-footer'],
            boards: ['all'],
            wallet: '0xAdvertiserWallet1'
          },
          {
            id: 'ad2',
            title: 'Join the Solana Gaming Revolution',
            imageUrl: 'https://picsum.photos/seed/ad2/728/90',
            landingUrl: 'https://solana-games.com',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            placements: ['desktop-header', 'desktop-footer'],
            boards: ['v', 'vr', 'vrpg', 'vst'],
            wallet: '0xAdvertiserWallet2'
          }
        ];

        // Filter ads based on current position and board
        const eligibleAds = mockAds.filter(ad => {
          const isCorrectPosition = ad.placements.includes(
            position === 'header' ? 'desktop-header' : 'desktop-footer'
          );
          const isCorrectBoard = ad.boards.includes('all') || ad.boards.includes(boardId);
          const isActive = new Date() >= new Date(ad.startDate) && new Date() <= new Date(ad.endDate);
          
          return isCorrectPosition && isCorrectBoard && isActive;
        });

        if (eligibleAds.length > 0) {
          // Randomly select one eligible ad
          const randomAd = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
          setCurrentAd(randomAd);
        }
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveAds();
    
    // Refresh ads every 5 minutes
    const interval = setInterval(fetchActiveAds, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [position, boardId]);

  const handleAdClick = () => {
    if (currentAd) {
      // Track ad click (TODO: implement analytics)
      console.log(`Ad clicked: ${currentAd.id}`);
      
      // Open landing page in new tab
      window.open(currentAd.landingUrl, '_blank');
    }
  };

  const handleCloseAd = () => {
    setIsVisible(false);
  };

  if (!isVisible || !currentAd) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className}`}>
        <div className="h-[90px] w-full"></div>
      </div>
    );
  }

  return (
    <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {/* Ad Label */}
      <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded z-10">
        Ad
      </div>
      
      {/* Close Button */}
      <button
        onClick={handleCloseAd}
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all z-10"
        title="Close ad"
      >
        <X size={12} />
      </button>
      
      {/* Ad Content */}
      <div 
        className="cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleAdClick}
      >
        <img
          src={currentAd.imageUrl}
          alt={currentAd.title}
          className="w-full h-[90px] object-cover"
        />
        
        {/* Ad Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="text-white text-xs">
            <div className="font-medium truncate">{currentAd.title}</div>
            <div className="flex items-center space-x-1 text-xs opacity-80">
              <span>Sponsored</span>
              <ExternalLink size={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Ad Banner Component
export const MobileAdBanner: React.FC<AdBannerProps> = ({ 
  position, 
  boardId = 'all',
  className = '' 
}) => {
  const [currentAd, setCurrentAd] = useState<AdData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Similar logic but for mobile ads
    const fetchMobileAds = async () => {
      setIsLoading(true);
      
      try {
        // Mock mobile ads
        const mockMobileAds: AdData[] = [
          {
            id: 'mobile-ad1',
            title: 'LoopChan Mobile App',
            imageUrl: 'https://picsum.photos/seed/mobile-ad1/300/250',
            landingUrl: 'https://mobile.loopchan.org',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            placements: ['mobile-header', 'mobile-footer'],
            boards: ['all'],
            wallet: '0xAdvertiserWallet3'
          }
        ];

        const eligibleAds = mockMobileAds.filter(ad => {
          const isCorrectPosition = ad.placements.includes(
            position === 'header' ? 'mobile-header' : 'mobile-footer'
          );
          const isCorrectBoard = ad.boards.includes('all') || ad.boards.includes(boardId);
          const isActive = new Date() >= new Date(ad.startDate) && new Date() <= new Date(ad.endDate);
          
          return isCorrectPosition && isCorrectBoard && isActive;
        });

        if (eligibleAds.length > 0) {
          const randomAd = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
          setCurrentAd(randomAd);
        }
      } catch (error) {
        console.error('Failed to fetch mobile ads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMobileAds();
    const interval = setInterval(fetchMobileAds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [position, boardId]);

  const handleAdClick = () => {
    if (currentAd) {
      console.log(`Mobile ad clicked: ${currentAd.id}`);
      window.open(currentAd.landingUrl, '_blank');
    }
  };

  const handleCloseAd = () => {
    setIsVisible(false);
  };

  if (!isVisible || !currentAd) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className}`}>
        <div className="h-[250px] w-full"></div>
      </div>
    );
  }

  return (
    <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {/* Ad Label */}
      <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded z-10">
        Ad
      </div>
      
      {/* Close Button */}
      <button
        onClick={handleCloseAd}
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all z-10"
        title="Close ad"
      >
        <X size={12} />
      </button>
      
      {/* Ad Content */}
      <div 
        className="cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleAdClick}
      >
        <img
          src={currentAd.imageUrl}
          alt={currentAd.title}
          className="w-full h-[250px] object-cover"
        />
        
        {/* Ad Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="text-white">
            <div className="font-medium text-sm mb-1">{currentAd.title}</div>
            <div className="flex items-center space-x-1 text-xs opacity-80">
              <span>Sponsored</span>
              <ExternalLink size={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

