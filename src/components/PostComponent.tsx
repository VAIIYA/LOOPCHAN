'use client'

import React, { useState } from 'react';
import { Post } from '../types';
import { Calendar, Hash, Play, Pause, Volume2, VolumeX, X, Maximize2 } from 'lucide-react';

interface PostComponentProps {
  post: Post;
  isOP?: boolean;
}

export const PostComponent: React.FC<PostComponentProps> = ({ post, isOP = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const formatDate = (date: Date | string | null | undefined) => {
    try {
      // Handle null/undefined cases
      if (date == null) {
        return 'No date';
      }
      
      // Convert string to Date if needed
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date value:', date);
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid date';
    }
  };

  const handleVideoPlayPause = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoMute = () => {
    if (videoRef) {
      videoRef.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoClick = () => {
    if (post.video) {
      window.open(post.video, '_blank');
    }
  };

  const toggleImageExpansion = () => {
    setIsImageExpanded(!isImageExpanded);
  };

  try {
    return (
      <div className={`${isOP ? 'bg-orange-50 border-orange-300' : 'bg-white border-orange-200'} border rounded-lg p-4 mb-4 shadow-sm`}>
        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center space-x-2 text-sm text-orange-500">
            <Hash size={14} />
            <span className="font-mono">{post.id}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Calendar size={14} />
            <span>{formatDate(post.timestamp)}</span>
          </div>
          
          {/* Username display */}
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span className="font-medium">
              {post.isAnonymous ? 'Anonymous' : (post.authorWallet ? `${post.authorWallet.slice(0, 8)}...` : 'Unknown')}
            </span>
          </div>
          
          {isOP && (
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-2 py-1 rounded">
              OP
            </span>
          )}
        </div>

                {/* Media content - full width */}
        {(post.image || post.video) && (
          <div className="w-full mb-4">
            {post.image && (
              <div className="relative flex justify-center">
                {/* Thread image - dynamic scaling with aspect ratio preservation */}
                <img
                  src={post.imageThumb || post.image}
                  alt="Post image"
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ 
                    maxHeight: '600px',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                  onClick={toggleImageExpansion}
                />
                
                {/* Expand button overlay */}
                <button
                  onClick={toggleImageExpansion}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70 transition-all"
                  title="Click to expand"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            )}
            
            {post.video && !post.image && (
              <div className="relative flex justify-center bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={setVideoRef}
                  src={post.video}
                  className="max-w-full h-auto rounded-lg"
                  style={{ 
                    maxHeight: '600px',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                  onEnded={handleVideoEnded}
                  muted={isMuted}
                  loop
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handleVideoPlayPause}
                    className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>
                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={handleVideoMute}
                    className="bg-black bg-opacity-50 text-white p-1 rounded hover:bg-opacity-70 transition-all"
                  >
                    {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                </div>
                <button
                  onClick={handleVideoClick}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded hover:bg-opacity-70 transition-all"
                >
                  Open
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Text content - full width */}
        {post.content && (
          <div className="w-full">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>
        )}

        {/* Expanded image modal */}
        {isImageExpanded && post.image && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <img
                src={post.image}
                alt="Expanded post image"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Close button */}
              <button
                onClick={toggleImageExpansion}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              >
                <X size={20} />
              </button>
              
              {/* Download link */}
              <a
                href={post.image}
                download
                className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded hover:bg-opacity-70 transition-all text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering PostComponent:', error, post);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-600">Error displaying post: {post.id}</p>
      </div>
    );
  }
};