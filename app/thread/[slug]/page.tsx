'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ThreadView } from '@/components/ThreadView';
import { Thread } from '@/types';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const slug = params.slug as string;

  const loadThread = async (attempt: number = 1) => {
    try {
      console.log(`Attempting to load thread by slug: ${slug} (attempt ${attempt})`);
      
      const response = await fetch(`/api/threads/slug/${slug}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Thread not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.thread) {
        console.log(`Thread loaded successfully: ${data.thread.title}`);
        console.log(`Thread has ${data.thread.replies?.length || 0} replies`);
        console.log(`Reply IDs:`, data.thread.replies?.map((r: any) => r.id) || []);
        
        setThread(data.thread);
        setError(null);
        setRetryCount(0);
      } else {
        throw new Error(data.error || 'Failed to load thread');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Thread load attempt ${attempt} failed:`, errorMessage);
      
      if (attempt < 10) {
        const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 10000);
        console.log(`Thread not found, retrying in ${delay}ms... (attempt ${attempt}/10)`);
        
        setTimeout(() => {
          setRetryCount(attempt);
          loadThread(attempt + 1);
        }, delay);
      } else {
        console.error('All retry attempts failed');
        setError(errorMessage);
        setRetryCount(attempt);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadThread();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading thread...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Retry attempt {retryCount}/10
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Thread Not Found</h1>
          <p className="text-gray-600 mb-6">The requested thread could not be found.</p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 transition-colors"
            >
              Back to Homepage
            </button>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                setRetryCount(0);
                loadThread();
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No thread data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ThreadView thread={thread} onBack={() => router.push('/')} />
    </div>
  );
}
