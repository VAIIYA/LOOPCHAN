'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ThreadView } from '@/components/ThreadView';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Thread } from '@/types';
import { ApiService } from '@/services/api';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (threadId) {
      loadThread();
    }
  }, [threadId]);

  const loadThread = async (currentRetryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      setRetryCount(currentRetryCount);
      
      console.log(`Attempting to load thread ${threadId} (attempt ${currentRetryCount + 1})`);
      
      const response = await ApiService.getThread(threadId);
      if (response.success && response.thread) {
        console.log(`Thread ${threadId} loaded successfully`);
        console.log(`Thread has ${response.thread.replies?.length || 0} replies`);
        if (response.thread.replies && response.thread.replies.length > 0) {
          console.log('Reply IDs:', response.thread.replies.map((r: any) => r.id));
          console.log('Reply details:', response.thread.replies.map((r: any) => ({ 
            id: r.id, 
            hasImage: !!r.image, 
            hasContent: !!r.content,
            timestamp: r.timestamp 
          })));
        } else {
          console.log('No replies found in loaded thread data');
        }
        setThread(response.thread);
      } else {
        // If thread not found and we haven't retried enough, wait and try again
        if (response.error === 'Thread not found' && currentRetryCount < 10) {
          const delay = Math.min(1000 * Math.pow(1.5, currentRetryCount), 5000); // Exponential backoff, max 5 seconds
          console.log(`Thread not found, retrying in ${delay}ms... (attempt ${currentRetryCount + 1}/10)`);
          setTimeout(() => {
            loadThread(currentRetryCount + 1);
          }, delay);
          return;
        }
        console.error(`Thread ${threadId} not found after ${currentRetryCount + 1} attempts`);
        setError(response.error || 'Thread not found');
      }
    } catch (error) {
      console.error('Error loading thread:', error);
      setError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="LoopChan" showHomeLink={true} showAdvertiseLink={true} />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-orange-600">Loading thread...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment for new threads</p>
            {retryCount > 0 && (
              <p className="text-blue-500 text-sm mt-1">Retrying... (attempt {retryCount + 1}/10)</p>
            )}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen">
        <Header title="LoopChan" showHomeLink={true} showAdvertiseLink={true} />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="bg-white rounded-lg p-8 shadow-md max-w-md mx-auto">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Thread Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The requested thread could not be found.'}</p>
              <div className="space-y-3">
                <button
                  onClick={handleBack}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Back to Homepage
                </button>
                <button
                  onClick={() => loadThread()}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="LoopChan" showHomeLink={true} showAdvertiseLink={true} />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        <ThreadView 
          thread={thread}
          onBack={handleBack}
        />
      </main>
      
      <Footer />
    </div>
  );
}
