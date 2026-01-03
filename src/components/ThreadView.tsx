'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { Thread, Post } from '../types';
import { PostComponent } from './PostComponent';
import { PostForm } from './PostForm';
import { SubscriptionPayment } from './SubscriptionPayment';
import { ArrowLeft, MessageSquare, Wallet, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ApiService } from '../services/api';

interface ThreadViewProps {
  thread: Thread;
  onBack: () => void;
}


export const ThreadView: React.FC<ThreadViewProps> = ({ thread: initialThread, onBack }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [thread, setThread] = useState<Thread>(initialThread);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<{id: string, data: any, status: 'pending' | 'uploading' | 'completed' | 'failed'}>>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    canReply: boolean;
    type: 'free' | 'paid' | 'none';
    daysRemaining?: number;
    endDate?: string;
  } | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Function to refresh thread data with smart merging
  const refreshThreadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('Refreshing thread data...');
      
      // Fetch fresh thread data using the working ID-based endpoint
      const threadUrl = `/api/threads/${thread.id}/posts`;
      const response = await fetch(threadUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.thread) {
          const newThread = result.thread;
          
          // Smart merge: preserve optimistic updates that haven't been confirmed yet
          setThread(prevThread => {
            // Find posts that were added optimistically but not yet confirmed
            const pendingOptimisticPosts = (prevThread.replies || []).filter(post => 
              !newThread.replies.some((serverPost: any) => serverPost.id === post.id) &&
              post.id.startsWith('temp_') // Temporary optimistic IDs
            );
            
            // Merge server data with pending optimistic posts
            return {
              ...newThread,
              replies: [...newThread.replies, ...pendingOptimisticPosts],
              replyCount: newThread.replyCount + pendingOptimisticPosts.length
            };
          });
          
          console.log('Thread data refreshed successfully with optimistic merge');
        } else {
          console.error('Failed to refresh thread data: Invalid response structure');
        }
      } else {
        console.error('Failed to refresh thread data:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing thread data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [thread.id, thread.slug]);

  // Function to add new post optimistically with temporary ID
  const addNewPostOptimistically = useCallback((newPost: Post) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticPost = { ...newPost, id: tempId };
    
    setThread(prevThread => ({
      ...prevThread,
      replies: [...(prevThread.replies || []), optimisticPost],
      replyCount: (prevThread.replyCount || 0) + 1,
      lastReply: new Date(),
      lastActivity: new Date()
    }));
    
    return tempId;
  }, []);

  // Function to process upload queue
  const processUploadQueue = useCallback(async () => {
    const pendingUploads = uploadQueue.filter(item => item.status === 'pending');
    
    for (const uploadItem of pendingUploads) {
      try {
        // Mark as uploading
        setUploadQueue(prev => prev.map(item => 
          item.id === uploadItem.id ? { ...item, status: 'uploading' } : item
        ));
        
        console.log(`Processing upload: ${uploadItem.id}`);
        
        // Process the upload
        await processSingleUpload(uploadItem);
        
        // Mark as completed
        setUploadQueue(prev => prev.map(item => 
          item.id === uploadItem.id ? { ...item, status: 'completed' } : item
        ));
        
        console.log(`Upload completed: ${uploadItem.id}`);
        
      } catch (error) {
      console.error(`Upload failed: ${uploadItem.id}`, error);
      
      // Mark as failed
      setUploadQueue(prev => prev.map(item => 
        item.id === uploadItem.id ? { ...item, status: 'failed' } : item
      ));
      
      // Remove the optimistic reply on error
      setThread(prevThread => ({
        ...prevThread,
        replies: prevThread.replies.filter(post => post.id !== uploadItem.data.tempId),
        replyCount: Math.max(0, prevThread.replyCount - 1)
      }));
      
      alert(`Failed to create reply: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      }
    }
    
    // Clean up completed uploads after a delay
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(item => item.status !== 'completed'));
    }, 5000);
  }, [uploadQueue]);

  // Function to process a single upload
  const processSingleUpload = useCallback(async (uploadItem: any) => {
    const { data } = uploadItem;
    
    let imageUrl = null;
    let videoUrl = null;
    
    // Upload file if present
    if (data.image) {
      const uploadResult = await ApiService.uploadFile(data.image);
      imageUrl = uploadResult.url;
      console.log('Image uploaded:', imageUrl);
    }
    
    if (data.video) {
      const uploadResult = await ApiService.uploadFile(data.video);
      videoUrl = uploadResult.url;
      console.log('Video uploaded:', videoUrl);
    }
    
    // Create the reply data
    const replyData = {
      content: data.content,
      image: imageUrl,
      video: videoUrl,
      authorWallet: session?.user?.email || 'anonymous'
    };
    
    console.log('Creating reply with data:', replyData);
    
    // Send reply to server
    console.log('Sending reply creation request to server...');
    const response = await fetch(`/api/threads/${thread.id}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replyData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create reply' }));
      console.error('Reply creation error:', errorData);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Reply created successfully:', result);
    
    // Verify the result has the expected structure
    if (!result.success || !result.post) {
      console.error('Invalid reply creation result:', result);
      throw new Error('Invalid response from server');
    }
    
    // INSTANT UPDATE: Update the optimistic post with real server data and media URLs
    console.log(`Updating optimistic reply ${data.tempId} with server data ${result.post.id}`);
    setThread(prevThread => {
      const updatedReplies = prevThread.replies.map(post => 
        post.id === data.tempId ? {
          ...post,
          id: result.post.id,
          timestamp: new Date(result.post.timestamp),
          image: imageUrl || null,
          imageThumb: imageUrl || null,
          video: videoUrl || null
        } : post
      );
      
      console.log(`Thread now has ${updatedReplies.length} replies after server update`);
      console.log('Updated reply IDs:', updatedReplies.map(r => r.id));
      
      return {
        ...prevThread,
        replies: updatedReplies,
        replyCount: prevThread.replyCount,
        lastReply: new Date(),
        lastActivity: new Date()
      };
    });
    
    // Mark as completed immediately
    setUploadQueue(prev => prev.map(item => 
      item.id === uploadItem.id ? { ...item, status: 'completed' } : item
    ));
    
    console.log(`Upload completed: ${uploadItem.id}`);
    
    // Show success toast when all uploads complete
    const updatedQueue = uploadQueue.map(item => 
      item.id === uploadItem.id ? { ...item, status: 'completed' } : item
    );
    
    if (updatedQueue.every(item => item.status === 'completed')) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000); // Hide after 3 seconds
    }
    
  }, [wallet.publicKey, thread.id, uploadQueue]);

  // Effect to process upload queue when it changes
  useEffect(() => {
    if (uploadQueue.length > 0) {
      processUploadQueue();
    }
  }, [uploadQueue, processUploadQueue]);


  // Function to create and add a new post with instant display
  const createNewPost = useCallback(async (data: any) => {
    try {
      if (status === 'unauthenticated' || !session) {
        router.push('/auth/signin');
        return;
      }

      setIsSubmitting(true);

      // Create optimistic post with IMMEDIATE media display
      const newPost: Post = {
        id: '', // Will be set by addNewPostOptimistically
        timestamp: new Date(),
        content: data.content || null,
        image: data.image ? URL.createObjectURL(data.image) : null, // INSTANT preview
        imageThumb: data.image ? URL.createObjectURL(data.image) : null, // INSTANT preview
        video: data.video ? URL.createObjectURL(data.video) : null, // INSTANT preview
        authorWallet: session.user?.email || 'anonymous',
        isAnonymous: true
      };

      // Add to UI IMMEDIATELY with media preview
      const tempId = addNewPostOptimistically(newPost);
      
      // Add to upload queue
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setUploadQueue(prev => [...prev, {
        id: uploadId,
        data: { ...data, tempId },
        status: 'pending'
      }]);
      
      // Close the form immediately
      setShowReplyForm(false);
      
      // NO DELAY: Media is already visible, just update with server data when ready
      
    } catch (error) {
      console.error('Failed to create reply:', error);
      alert('Failed to create reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [session, status, router, addNewPostOptimistically]);
  
  // Validate thread data
  if (!thread) {
    console.error('ThreadView: No thread provided');
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
        <div className="text-center py-8">
          <p className="text-red-600">Error: No thread data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-orange-50 to-pink-50 min-h-screen">
      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✅</span>
            <span>Reply posted successfully!</span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        
        {/* Refresh button */}
        <button
          onClick={refreshThreadData}
          disabled={isRefreshing}
          className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50"
        >
          <MessageSquare size={20} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-orange-600 mb-4">{thread.title || 'Untitled Thread'}</h1>
        
        {/* Upload Queue Status */}
        {uploadQueue.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-700 font-medium">Processing Reply</span>
              </div>
              <span className="text-blue-600 text-sm">
                {uploadQueue.filter(item => item.status === 'completed').length}/{uploadQueue.length} completed
              </span>
            </div>
            
            {/* Upload Progress Bars */}
            <div className="mt-2 space-y-2">
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <div className="flex-1 bg-blue-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.status === 'completed' ? 'bg-green-500' : 
                        item.status === 'uploading' ? 'bg-blue-500' : 
                        item.status === 'failed' ? 'bg-red-500' : 'bg-blue-300'
                      }`}
                      style={{ 
                        width: item.status === 'completed' ? '100%' : 
                               item.status === 'uploading' ? '50%' : '0%' 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-blue-600 w-16 text-right">
                    {item.status === 'completed' ? '✓' : 
                     item.status === 'uploading' ? '⏳' : 
                     item.status === 'failed' ? '✗' : '⏸️'}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Success Message */}
            {uploadQueue.every(item => item.status === 'completed') && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-center">
                <span className="text-green-700 text-sm">✅ Reply posted successfully!</span>
              </div>
            )}
          </div>
        )}
        
        {thread.op ? (
          <PostComponent post={thread.op} isOP={true} />
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: Thread OP not found</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {Array.isArray(thread.replies) ? (
          thread.replies.map((reply) => {
            try {
              if (!reply || !reply.id) {
                console.warn('Invalid reply data:', reply);
                return null;
              }
              return <PostComponent key={reply.id} post={reply} />;
            } catch (error) {
              console.error('Error rendering reply:', error, reply);
              return (
                <div key={reply.id || 'unknown'} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">Error displaying reply: {reply.id || 'unknown'}</p>
                </div>
              );
            }
          })
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="mx-auto text-orange-400 mb-4" size={32} />
            <p className="text-orange-500 mb-6">No replies yet. Be the first to reply!</p>
          </div>
        )}
      </div>

      {showReplyForm && (
        <div className="mt-6">
          <PostForm
            isReply={true}
            onSubmit={createNewPost}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Always show Reply button at the bottom */}
      <div className="text-center py-8 border-t border-orange-200 mt-6">
        {wallet.connected ? (
          subscriptionStatus ? (
            subscriptionStatus.canReply ? (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                disabled={isSubmitting || uploadQueue.length > 0}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg mx-auto disabled:opacity-50"
              >
                <MessageSquare size={18} />
                <span>
                  {isSubmitting ? 'Posting...' : 
                   uploadQueue.length > 0 ? `Uploading (${uploadQueue.length})` : 'Reply'}
                </span>
              </button>
            ) : (
              <SubscriptionPayment 
                subscriptionStatus={subscriptionStatus}
                onPaymentSuccess={() => {
                  // Refresh subscription status after successful payment
                  checkSubscriptionStatus();
                }}
              />
            )
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Checking subscription...</p>
            </div>
          )
        ) : (
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
                <User size={20} />
                <span className="font-medium">Connect Wallet</span>
              </div>
              <p className="text-blue-700 text-sm">
                Connect your Solana wallet to check subscription status and reply to threads.
              </p>
            </div>
          </div>
        )}
        
        {/* Custom styled wallet button */}
        <div className="mt-4">
          <WalletButton />
        </div>
      </div>
    </div>
  );
};