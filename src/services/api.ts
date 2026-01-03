import { CreateThreadRequest, CreatePostRequest, BlobUploadResult } from '@/types';

export class ApiService {
  static async uploadFile(file: File): Promise<BlobUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Failed to upload file');
      }

      const result = await response.json();
      console.log('File upload successful:', result);
      return result;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  static async createThread(request: CreateThreadRequest): Promise<any> {
    console.log('Creating thread:', request);
    
    try {
      const response = await fetch(`/api/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      console.log('Thread creation response status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create thread' }));
        console.error('Thread creation error:', error);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(error.error || 'Failed to create thread');
      }

      const result = await response.json();
      console.log('Thread creation result:', result);
      
      // Verify the result has the expected structure
      if (!result.success || !result.thread) {
        console.error('Invalid thread creation result:', result);
        throw new Error('Invalid response from server');
      }
      
      return result;
    } catch (error) {
      console.error('Thread creation request failed:', error);
      throw error;
    }
  }

  static async getThreads(page: number = 1): Promise<any> {
    console.log('Fetching threads, page:', page);
    
    try {
      const response = await fetch(`/api/threads?page=${page}`);

      if (!response.ok) {
        console.error('Failed to get threads, status:', response.status);
        // Return empty result instead of throwing for better UX
        return { threads: [], page, totalPages: 0, totalThreads: 0 };
      }

      const result = await response.json();
      console.log('Threads result:', result);
      return result;
    } catch (error) {
      console.error('Get threads request failed:', error);
      // Return empty result instead of throwing for better UX
      return { threads: [], page, totalPages: 0, totalThreads: 0 };
    }
  }

  static async createPost(request: CreatePostRequest): Promise<any> {
    console.log('Creating post:', request);
    
    const response = await fetch(`/api/threads/${request.threadId}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create post' }));
      throw new Error(error.error || 'Failed to create post');
    }

    return response.json();
  }

  static async getThread(threadId: string): Promise<any> {
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        // Add cache control for better performance
        cache: 'no-store', // Always get fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Thread not found' };
        }
        const error = await response.json().catch(() => ({ error: 'Failed to get thread' }));
        return { success: false, error: error.error || 'Failed to get thread' };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // Don't log network errors as they're expected during retries
      return { success: false, error: 'Failed to load thread' };
    }
  }
}
