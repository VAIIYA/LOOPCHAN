export interface Post {
  id: string;
  timestamp: Date;
  content?: string | null; // Made optional - users can post just an image/video
  image?: string | null;
  imageThumb?: string | null;
  video?: string | null;
  replies?: Post[];
  authorWallet?: string; // Solana wallet address
  blobId?: string; // Vercel Blob ID for the post content
  imageBlobId?: string; // Vercel Blob ID for the image
  videoBlobId?: string; // Vercel Blob ID for the video
  isAnonymous: boolean;
}

export interface Thread {
  id: string;
  slug?: string; // URL-friendly slug for the thread
  title: string;
  op: Post;
  replies: Post[];
  lastReply: Date;
  replyCount: number;
  imageCount: number;
  videoCount: number;
  board: string;
  page: number; // Which page this thread belongs to (1-10)
  createdAt: Date;
  lastActivity: Date; // For cleanup purposes
  authorWallet?: string; // OP's wallet address
  isOptimistic?: boolean; // Flag for optimistic updates
}

export interface Board {
  id: string;
  name: string;
  description: string;
  threads?: Thread[];
  isNSFW?: boolean;
  maxPages: number; // Default 10
  threadsPerPage: number; // Default 10
  maxThreads: number; // Default 100 (10 pages * 10 threads)
}

export interface Page {
  pageNumber: number;
  threads: Thread[];
}

export interface WalletConnection {
  publicKey: string;
  connected: boolean;
  connecting: boolean;
}

export interface BlobUploadResult {
  url: string;
  blobId: string;
  fileType: string;
  isVideo: boolean;
}

export interface CreateThreadRequest {
  title: string;
  content?: string; // Made optional - users can post just an image/video
  image?: string;
  video?: string;
  authorWallet?: string; // Solana wallet address
}

export interface CreatePostRequest {
  threadId: string;
  content?: string | null; // Made optional - users can post just an image/video
  image?: string | null;
  video?: string | null;
  authorWallet?: string; // Solana wallet address
}