'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WalletConnection } from '@/types';

interface WalletContextType {
  wallet: WalletConnection;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    console.error('useWallet must be used within a WalletProvider');
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletConnection>({
    publicKey: '',
    connected: false,
    connecting: false
  });

  // Load wallet state from localStorage on mount
  useEffect(() => {
    const loadWalletState = () => {
      try {
        if (typeof window !== 'undefined') {
          const savedWallet = localStorage.getItem('loopchan-wallet');
          if (savedWallet) {
            try {
              const parsedWallet = JSON.parse(savedWallet);
              console.log('Loading saved wallet state:', parsedWallet);
              setWallet(parsedWallet);
            } catch (parseError) {
              console.error('Failed to parse saved wallet state:', parseError);
              localStorage.removeItem('loopchan-wallet');
            }
          }
        }
      } catch (error) {
        console.error('Error loading wallet state:', error);
        // Clear any corrupted state
        setWallet({
          publicKey: '',
          connected: false,
          connecting: false
        });
        localStorage.removeItem('loopchan-wallet');
      }
    };

    loadWalletState();
  }, []);

  // Save wallet state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (wallet.connected) {
          localStorage.setItem('loopchan-wallet', JSON.stringify(wallet));
          console.log('Wallet state saved to localStorage');
        } else {
          localStorage.removeItem('loopchan-wallet');
          console.log('Wallet state removed from localStorage');
        }
      }
    } catch (error) {
      console.error('Error saving wallet state to localStorage:', error);
    }
  }, [wallet]);

  useEffect(() => {
    // Check if Phantom wallet is available
    const checkWallet = () => {
      try {
        if (typeof window !== 'undefined' && 'solana' in window) {
          const phantom = (window as any).solana;
          if (phantom?.isPhantom) {
            if (phantom.isConnected && !wallet.connected) {
              const publicKey = phantom.publicKey.toString();
              console.log('Auto-detected connected wallet:', publicKey);
              setWallet({
                publicKey,
                connected: true,
                connecting: false
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet availability:', error);
      }
    };

    checkWallet();

    // Listen for wallet connection changes
    const handleConnect = () => {
      try {
        const phantom = (window as any).solana;
        if (phantom?.isConnected) {
          const publicKey = phantom.publicKey.toString();
          console.log('Wallet connected event:', publicKey);
          const newWalletState = {
            publicKey,
            connected: true,
            connecting: false
          };
          setWallet(newWalletState);
          localStorage.setItem('loopchan-wallet', JSON.stringify(newWalletState));
        }
      } catch (error) {
        console.error('Error handling wallet connect event:', error);
      }
    };

    const handleDisconnect = () => {
      try {
        console.log('Wallet disconnected event');
        const newWalletState = {
          publicKey: '',
          connected: false,
          connecting: false
        };
        setWallet(newWalletState);
        localStorage.removeItem('loopchan-wallet');
      } catch (error) {
        console.error('Error handling wallet disconnect event:', error);
      }
    };

    try {
      if (typeof window !== 'undefined' && 'solana' in window) {
        const phantom = (window as any).solana;
        phantom?.on('connect', handleConnect);
        phantom?.on('disconnect', handleDisconnect);

        return () => {
          phantom?.off('connect', handleConnect);
          phantom?.off('disconnect', handleDisconnect);
        };
      }
    } catch (error) {
      console.error('Error setting up wallet event listeners:', error);
    }
  }, [wallet.connected]);

  // Additional effect to check wallet state on every render/mount
  useEffect(() => {
    const checkAndRestoreWallet = () => {
      try {
        if (typeof window !== 'undefined' && 'solana' in window) {
          const phantom = (window as any).solana;
          if (phantom?.isPhantom && phantom.isConnected) {
            const publicKey = phantom.publicKey.toString();
            const savedWallet = localStorage.getItem('loopchan-wallet');
            
            if (savedWallet) {
              try {
                const parsedWallet = JSON.parse(savedWallet);
                if (parsedWallet.connected && parsedWallet.publicKey === publicKey) {
                  // Wallet is connected and matches saved state, restore it
                  if (!wallet.connected || wallet.publicKey !== publicKey) {
                    console.log('Restoring wallet state on page load:', publicKey);
                    setWallet({
                      publicKey,
                      connected: true,
                      connecting: false
                    });
                  }
                }
              } catch (error) {
                console.error('Error parsing saved wallet on page load:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking wallet on page load:', error);
      }
    };

    // Check immediately and also after a short delay to ensure Phantom is loaded
    checkAndRestoreWallet();
    const timeoutId = setTimeout(checkAndRestoreWallet, 100);
    
    return () => clearTimeout(timeoutId);
  }, []); // Run only on mount

  const connect = async () => {
    try {
      setWallet(prev => ({ ...prev, connecting: true }));

      if (typeof window !== 'undefined' && 'solana' in window) {
        const phantom = (window as any).solana;
        
        if (phantom?.isPhantom) {
          try {
            const response = await phantom.connect();
            const publicKey = response.publicKey.toString();
            
            const newWalletState = {
              publicKey,
              connected: true,
              connecting: false
            };
            
            setWallet(newWalletState);
            localStorage.setItem('loopchan-wallet', JSON.stringify(newWalletState));
            console.log('Wallet connected successfully:', publicKey);
          } catch (connectError) {
            console.error('Phantom connect failed:', connectError);
            throw connectError;
          }
        } else {
          console.warn('Phantom wallet not detected');
          window.open('https://phantom.app/', '_blank');
        }
      } else {
        console.warn('Solana wallet not available');
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWallet(prev => ({ ...prev, connecting: false }));
      throw error;
    }
  };

  const disconnect = () => {
    try {
      if (typeof window !== 'undefined' && 'solana' in window) {
        const phantom = (window as any).solana;
        phantom?.disconnect();
      }
      
      const newWalletState = {
        publicKey: '',
        connected: false,
        connecting: false
      };
      setWallet(newWalletState);
      localStorage.removeItem('loopchan-wallet');
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Still clear the local state even if the wallet disconnect fails
      const newWalletState = {
        publicKey: '',
        connected: false,
        connecting: false
      };
      setWallet(newWalletState);
      localStorage.removeItem('loopchan-wallet');
    }
  };

  const signMessage = async (message: string): Promise<string | null> => {
    try {
      if (!wallet.connected) {
        throw new Error('Wallet not connected');
      }

      if (typeof window !== 'undefined' && 'solana' in window) {
        const phantom = (window as any).solana;
        
        if (!phantom?.isPhantom) {
          throw new Error('Phantom wallet not available');
        }
        
        const encodedMessage = new TextEncoder().encode(message);
        const signedMessage = await phantom.signMessage(encodedMessage, 'utf8');
        
        if (!signedMessage?.signature) {
          throw new Error('No signature received from wallet');
        }
        
        // Convert to base64 for storage
        const signature = Buffer.from(signedMessage.signature).toString('base64');
        console.log('Message signed successfully');
        return signature;
      } else {
        throw new Error('Solana wallet not available');
      }
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    wallet,
    connect,
    disconnect,
    signMessage
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
