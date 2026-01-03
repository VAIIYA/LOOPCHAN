'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ThreadList } from '@/components/ThreadList';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Thread } from '@/types';
import { ApiService } from '@/services/api';

export default function HomePage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ApiService.getThreads(1);
      if (response.success) {
        setThreads(response.threads || []);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Smart refresh: only refresh when there's user interaction
  // Removed aggressive auto-refresh - now only refreshes on user actions

  const handleThreadSelect = useCallback((threadUrl: string) => {
    // Use Next.js router for faster navigation
    // threadUrl can be either /thread/slug or /threads/id
    router.push(threadUrl);
  }, [router]);

  // Callback to refresh threads when a new thread is created
  const handleThreadCreated = useCallback(() => {
    // Immediately refresh threads to show the new thread
    loadThreads();
  }, [loadThreads]);

  return (
    <div className="min-h-screen">
      <Header title="LoopChan" showHomeLink={false} showAdvertiseLink={true} />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Homepage Intro */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-orange-600 mb-4">LoopChan</h1>
          <p className="text-xl text-gray-600 mb-6">Anonymous imageboard discussion</p>
          <hr className="border-gray-300 mb-8" />
          <div className="text-left max-w-4xl mx-auto">
            <p className="text-gray-700 leading-relaxed">
              LoopChan is a simple image-based bulletin board where anyone can post comments and share images. 
              All discussions happen in one place - no separate boards, just pure anonymous discussion. 
              Users need to connect a Solana Wallet before participating in the community. 
              Feel free to start a new thread or join the conversation!
            </p>
          </div>
        </div>

        {/* Thread List with integrated styling */}
        <ThreadList 
          threads={threads} 
          showBackButton={false}
          loading={loading}
          onThreadSelect={handleThreadSelect}
          onThreadCreated={handleThreadCreated}
        />
      </main>
      
      {/* Footer with Board Rules */}
      <Footer />
    </div>
  );
}
