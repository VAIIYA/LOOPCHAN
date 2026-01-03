'use client'

import React, { useState } from 'react';
import { Send, X, Upload, Image, Video } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface PostFormData {
  content?: string | null; // Made optional - users can post just an image/video
  image?: File | null;
  video?: File | null;
  title?: string | null; // Only required for new threads
}

interface PostFormProps {
  isReply?: boolean;
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel?: () => void;
}

export const PostForm: React.FC<PostFormProps> = ({ 
  isReply = false, 
  onSubmit, 
  onCancel 
}) => {
  const { wallet } = useWallet();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet || !wallet.connected) {
      alert('Please connect your Solana wallet first');
      return;
    }
    
    // For replies: either content or media must be present
    // For new threads: title is required, and either content or media must be present
    if (isReply) {
      if (!content?.trim() && !mediaFile) {
        alert('Please provide either a comment, image, or video');
        return;
      }
    } else {
      if (!title.trim()) {
        alert('Please provide a thread title');
        return;
      }
      if (!content?.trim() && !mediaFile) {
        alert('Please provide either a comment, image, or video');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      try {
        await onSubmit({
          content: content.trim() || null, // Use null instead of undefined
          title: isReply ? null : title.trim() || null, // Only include title for new threads
          image: mediaFile?.type.startsWith('image/') ? mediaFile : null,
          video: mediaFile?.type.startsWith('video/') ? mediaFile : null
        });
      } catch (submitError) {
        console.error('Error in onSubmit callback:', submitError);
        throw submitError;
      }

      // Reset form
      setContent('');
      setTitle('');
      setMediaFile(null);
    } catch (error) {
      console.error('Failed to submit post:', error);
      alert('Failed to submit post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        // Check file type
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/webm', 'video/mp4', 'video/quicktime'];
        const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
        
        if (!allowedTypes.includes(file.type)) {
          alert('File type not allowed. Please select a JPG, PNG, GIF, WebP image or WebM/MP4/MOV video.');
          return;
        }
        
        // Check file size
        const isVideo = allowedVideoTypes.includes(file.type);
        const maxSize = isVideo ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for videos, 5MB for images
        
        if (file.size > maxSize) {
          const maxSizeMB = maxSize / (1024 * 1024);
          alert(`File too large. Maximum size for ${isVideo ? 'videos' : 'images'}: ${maxSizeMB}MB`);
          return;
        }
        
        setMediaFile(file);
      }
    } catch (error) {
      console.error('Error handling file change:', error);
      alert('Error processing file. Please try again.');
    }
  };

  const getFileIcon = () => {
    if (!mediaFile) return <Upload size={18} />;
    return mediaFile.type.startsWith('video/') ? <Video size={18} /> : <Image size={18} />;
  };

  const getFileTypeText = () => {
    if (!mediaFile) return 'Media (optional)';
    const isVideo = mediaFile.type.startsWith('video/');
    return `${isVideo ? 'Video' : 'Image'} (${mediaFile.name})`;
  };

  if (!wallet || !wallet.connected) {
    return (
      <div className="bg-white border border-orange-200 rounded-lg p-6 shadow-md">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Connect Wallet Required
          </h3>
          <p className="text-gray-600 mb-4">
            You need to connect your Solana wallet to create threads and post replies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-orange-200 rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {isReply ? 'Post Reply' : 'Start New Thread'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isReply && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread title..."
              className="w-full bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here... (optional)"
            rows={6}
            className="w-full bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getFileTypeText()}
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.webm,.mp4,.mov,video/webm,video/mp4,video/quicktime,image/jpeg,image/png,image/gif,image/webp"
                capture="environment"
                onChange={handleFileChange}
                className="w-full bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
              <div className="absolute right-3 top-2.5 text-orange-400">
                {getFileIcon()}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Images: JPG, PNG, GIF, WebP (max 5MB) | Videos: WebM, MP4, MOV (max 10MB)
          </div>
          {mediaFile && (
            <div className="mt-2 text-sm text-green-600">
              Selected: {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)}MB)
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={(!content?.trim() && !mediaFile) || (!isReply && !title.trim()) || isSubmitting}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg min-h-[44px] touch-manipulation"
            style={{ fontSize: '16px' }} // Better mobile touch target
          >
            <Send size={18} />
            <span>{isSubmitting ? 'Posting...' : (isReply ? 'Post Reply' : 'Create Thread')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};