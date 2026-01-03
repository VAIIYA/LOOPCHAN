// Simple in-memory storage for testing
// This will be replaced with Lighthouse storage once the basic functionality is working

// Types
export interface ThreadData {
  id: string;
  slug: string;
  title: string;
  op: {
    content?: string;
    image?: string;
    video?: string;
    authorWallet: string;
    timestamp: Date;
  };
  replyCount: number;
  imageCount: number;
  videoCount: number;
  createdAt: Date;
  lastActivity: Date;
  lastReply?: Date;
  authorWallet: string;
  replies?: CommentData[];
}

export interface CommentData {
  id: string;
  timestamp: Date;
  content?: string;
  image?: string;
  video?: string;
  authorWallet: string;
  isAnonymous: boolean;
  mediaFiles: string[];
}

export interface ThreadIndex {
  threads: Array<{
    id: string;
    slug: string;
    title: string;
    createdAt: string;
    lastActivity: string;
    lastReply?: string;
    replyCount: number;
    imageCount: number;
    videoCount: number;
    op: {
      content?: string;
      image?: string;
      video?: string;
      authorWallet: string;
      timestamp: string;
    };
    authorWallet: string;
  }>;
  totalThreads: number;
  lastUpdated: string;
}

// In-memory storage
let threadsIndex: ThreadIndex = {
  threads: [],
  totalThreads: 0,
  lastUpdated: new Date().toISOString()
};

// In-memory storage for comments (keyed by threadId)
const commentsStore: { [threadId: string]: CommentData[] } = {};

const MAX_THREADS = 100;

// Get all threads
export async function getAllThreads(): Promise<ThreadIndex> {
  try {
    console.log('Loading all threads from memory...');
    console.log(`✅ Loaded ${threadsIndex.threads.length} threads from memory`);
    return threadsIndex;
  } catch (error) {
    console.error('Error loading threads:', error);
    return {
      threads: [],
      totalThreads: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Create a new thread
export async function createThread(threadData: ThreadData): Promise<void> {
  try {
    console.log('Creating thread with data:', {
      id: threadData.id,
      title: threadData.title,
      slug: threadData.slug
    });
    
    // Add new thread to TOP of index (position 0) - this pushes all other threads down
    threadsIndex.threads.unshift({
      id: threadData.id,
      slug: threadData.slug,
      title: threadData.title,
      createdAt: threadData.createdAt.toISOString(),
      lastActivity: threadData.lastActivity.toISOString(),
      replyCount: threadData.replyCount,
      imageCount: threadData.imageCount,
      videoCount: threadData.videoCount,
      op: {
        content: threadData.op.content,
        image: threadData.op.image,
        video: threadData.op.video,
        authorWallet: threadData.op.authorWallet,
        timestamp: threadData.op.timestamp.toISOString()
      },
      authorWallet: threadData.authorWallet
    });
    
    console.log(`📌 NEW THREAD: "${threadData.title}" added to TOP of board (position 0)`);
    console.log(`Board now has ${threadsIndex.threads.length} threads`);
    
    // Check if we need to clean up old threads (thread 101+ gets deleted)
    if (threadsIndex.threads.length > MAX_THREADS) {
      console.log(`🧹 CLEANUP: Removing ${threadsIndex.threads.length - MAX_THREADS} old threads (threads 101+)...`);
      threadsIndex.threads = threadsIndex.threads.slice(0, MAX_THREADS);
      console.log(`✅ CLEANUP: Removed old threads. Board now has ${threadsIndex.threads.length} threads (max ${MAX_THREADS})`);
    }
    
    threadsIndex.totalThreads = threadsIndex.threads.length;
    threadsIndex.lastUpdated = new Date().toISOString();
    
    console.log('✅ Thread created successfully in memory');
    
  } catch (error) {
    console.error('Error creating thread:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Get thread by ID
export async function getThreadById(threadId: string): Promise<ThreadData | null> {
  try {
    console.log(`Loading thread by ID: ${threadId}`);
    
    const threadInfo = threadsIndex.threads.find(t => t.id === threadId);
    
    if (!threadInfo) {
      console.log(`Thread ${threadId} not found`);
      return null;
    }
    
    // For now, return basic thread info
    // In a full implementation, you'd load the full thread data
    const threadData: ThreadData = {
      id: threadInfo.id,
      slug: threadInfo.slug,
      title: threadInfo.title,
      op: {
        content: 'Thread content would be loaded here',
        authorWallet: 'unknown',
        timestamp: new Date(threadInfo.createdAt)
      },
      replyCount: threadInfo.replyCount,
      imageCount: threadInfo.imageCount,
      videoCount: threadInfo.videoCount,
      createdAt: new Date(threadInfo.createdAt),
      lastActivity: new Date(threadInfo.lastActivity),
      authorWallet: 'unknown'
    };
    
    console.log(`✅ Found thread: ${threadData.title}`);
    return threadData;
  } catch (error) {
    console.error(`Error loading thread ${threadId}:`, error);
    return null;
  }
}

// Get thread by slug
export async function getThreadBySlug(slug: string): Promise<{ thread: ThreadData; comments: CommentData[] } | null> {
  try {
    console.log(`Loading thread by slug: ${slug}`);
    
    const threadInfo = threadsIndex.threads.find(t => t.slug === slug);
    
    if (!threadInfo) {
      console.log(`Thread with slug ${slug} not found`);
      return null;
    }
    
    // For now, return basic thread info
    // In a full implementation, you'd load the full thread data and comments
    const threadData: ThreadData = {
      id: threadInfo.id,
      slug: threadInfo.slug,
      title: threadInfo.title,
      op: {
        content: 'Thread content would be loaded here',
        authorWallet: 'unknown',
        timestamp: new Date(threadInfo.createdAt)
      },
      replyCount: threadInfo.replyCount,
      imageCount: threadInfo.imageCount,
      videoCount: threadInfo.videoCount,
      createdAt: new Date(threadInfo.createdAt),
      lastActivity: new Date(threadInfo.lastActivity),
      authorWallet: 'unknown'
    };
    
    console.log(`✅ Found thread: ${threadData.title}`);
    return {
      thread: threadData,
      comments: [] // Comments would be loaded here in a full implementation
    };
  } catch (error) {
    console.error(`Error loading thread ${slug}:`, error);
    return null;
  }
}

// Add comment to thread
export async function addCommentToThread(threadId: string, comment: CommentData): Promise<void> {
  try {
    console.log(`Adding comment to thread ${threadId}`);
    
    // Add comment to the comments store
    if (!commentsStore[threadId]) {
      commentsStore[threadId] = [];
    }
    commentsStore[threadId].push(comment);
    
    // Update thread's last activity and reply count
    const threadIndex = threadsIndex.threads.findIndex(t => t.id === threadId);
    
    if (threadIndex !== -1) {
      threadsIndex.threads[threadIndex].replyCount = commentsStore[threadId].length;
      threadsIndex.threads[threadIndex].lastActivity = new Date().toISOString();
      threadsIndex.threads[threadIndex].lastReply = comment.timestamp.toISOString();
      
      console.log(`✅ Comment added to thread ${threadId}`);
    } else {
      throw new Error(`Thread ${threadId} not found`);
    }
  } catch (error) {
    console.error(`Error adding comment to thread ${threadId}:`, error);
    throw error;
  }
}
