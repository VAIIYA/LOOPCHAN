'use client'

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';
import { User, MapPin, Twitter, Youtube, FileText, Save, Loader } from 'lucide-react';

interface ProfileData {
  username: string;
  location: string;
  x: string;
  youtube: string;
  bio: string;
}

export default function ProfilePage() {
  const { wallet } = useWallet();
  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    location: '',
    x: '',
    youtube: '',
    bio: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [wallet.connected, wallet.publicKey]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/profile?walletAddress=${wallet.publicKey}`);
      
      if (response.ok) {
        const data = await response.json();
        setProfile({
          username: data.profile?.username || '',
          location: data.profile?.location || '',
          x: data.profile?.socialLinks?.x || '',
          youtube: data.profile?.socialLinks?.youtube || '',
          bio: data.profile?.bio || '',
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.connected || !wallet.publicKey) {
      setError('Please connect your wallet');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: wallet.publicKey,
          username: profile.username.trim() || null,
          location: profile.location.trim() || null,
          socialLinks: {
            x: profile.x.trim() || null,
            youtube: profile.youtube.trim() || null,
          },
          bio: profile.bio.trim() || null,
        }),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (!wallet.connected || !wallet.publicKey) {
    return (
      <div className="min-h-screen">
        <Header title="Profile" showHomeLink={true} showAdvertiseLink={true} />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg p-8 shadow-md text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Solana wallet to view and edit your profile.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Profile" showHomeLink={true} showAdvertiseLink={true} />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <Loader className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
            <p className="text-orange-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Profile" showHomeLink={true} showAdvertiseLink={true} />
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600">
            Customize your profile to personalize your posts
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-800">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-green-800">
              <span>✓</span>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Wallet Info */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Wallet Address</h3>
              <p className="font-mono text-lg text-gray-900">{formatAddress(wallet.publicKey || '')}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-lg p-6 shadow-md space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Username
            </label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="Choose a username (optional)"
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to remain anonymous. Max 50 characters.
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Location
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              placeholder="City, Country (optional)"
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max 100 characters.
            </p>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Social Media Links
            </label>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  <Twitter className="w-3 h-3 inline mr-1" />
                  X.com / Twitter
                </label>
                <input
                  type="text"
                  value={profile.x}
                  onChange={(e) => setProfile({ ...profile, x: e.target.value })}
                  placeholder="https://x.com/yourusername or x.com/yourusername"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  <Youtube className="w-3 h-3 inline mr-1" />
                  YouTube
                </label>
                <input
                  type="text"
                  value={profile.youtube}
                  onChange={(e) => setProfile({ ...profile, youtube: e.target.value })}
                  placeholder="https://youtube.com/@yourchannel or youtube.com/@yourchannel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself (optional)"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {profile.bio.length}/500 characters
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">About Your Profile</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your username will appear instead of "Anonymous" on your posts</li>
            <li>• Social media links will be displayed on your profile</li>
            <li>• All fields are optional - you can remain anonymous if you prefer</li>
            <li>• Your wallet address is always visible for transparency</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

