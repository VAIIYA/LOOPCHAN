import { getGridFSBucket } from './mongodb';
import { Thread, Post, File } from './models';
import { getUserProfiles } from './profiles';
import mongoose from 'mongoose';
import { Readable } from 'stream';

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
}

// Thread operations
export async function getAllThreads() {
  await connectDB();
  
  const threads = await Thread.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  
  // Collect all author wallet addresses first
  const allAuthorWallets = new Set<string>();
  const threadsWithPosts = await Promise.all(
    threads.map(async (thread: any) => {
      const opPost: any = await Post.findOne({ id: thread.opPostId }).lean();
      if (opPost?.authorId) {
        allAuthorWallets.add(opPost.authorId);
      }
      return { thread, opPost };
    })
  );
  
  // Fetch all profiles at once
  let profilesMap = new Map<string, string>();
  if (allAuthorWallets.size > 0) {
    try {
      const profiles = await getUserProfiles(Array.from(allAuthorWallets));
      profiles.forEach(profile => {
        profilesMap.set(profile.walletAddress, profile.username || 'Anonymous');
      });
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }
  
  // Build threads with OP and display names
  const threadsWithOP = threadsWithPosts.map(({ thread, opPost }) => {
    const authorDisplayName = opPost?.authorId 
      ? (profilesMap.get(opPost.authorId) || 'Anonymous')
      : 'Anonymous';
    
    return {
      ...thread,
      op: opPost ? {
        id: opPost.id,
        content: opPost.content || null,
        image: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        imageThumb: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        video: opPost.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
        authorWallet: opPost.authorId || 'anonymous',
        authorDisplayName: authorDisplayName,
        timestamp: opPost.timestamp || thread.createdAt,
        isAnonymous: opPost.isAnonymous !== false,
      } : {
        id: `fallback_${thread.id}`,
        content: null,
        image: undefined,
        imageThumb: undefined,
        video: undefined,
        authorWallet: 'anonymous',
        authorDisplayName: 'Anonymous',
        timestamp: thread.createdAt || new Date(),
        isAnonymous: true,
      },
    };
  });
  
  return {
    threads: threadsWithOP,
    totalThreads: threads.length,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getThreadById(threadId: string) {
  await connectDB();
  
  const thread: any = await Thread.findOne({ id: threadId }).lean();
  if (!thread) return null;
  
  const opPost: any = await Post.findOne({ id: thread.opPostId }).lean();
  const replies: any[] = await Post.find({ threadId: threadId })
    .sort({ timestamp: 1 })
    .lean();
  
  // Get all author wallet addresses
  const authorWallets = new Set<string>();
  if (opPost?.authorId) authorWallets.add(opPost.authorId);
  replies.forEach(reply => {
    if (reply.authorId) authorWallets.add(reply.authorId);
  });
  
  // Fetch all profiles at once
  let profilesMap = new Map<string, string>();
  if (authorWallets.size > 0) {
    try {
      const profiles = await getUserProfiles(Array.from(authorWallets));
      profiles.forEach(profile => {
        profilesMap.set(profile.walletAddress, profile.username || 'Anonymous');
      });
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }
  
  // Get OP author display name
  const opAuthorDisplayName = opPost?.authorId 
    ? (profilesMap.get(opPost.authorId) || 'Anonymous')
    : 'Anonymous';
  
  return {
    ...thread,
    op: opPost ? {
      id: opPost.id,
      content: opPost.content || null,
      image: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
      imageThumb: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
      video: opPost.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
      authorWallet: opPost.authorId || 'anonymous',
      authorDisplayName: opAuthorDisplayName,
      timestamp: opPost.timestamp || thread.createdAt,
      isAnonymous: opPost.isAnonymous !== false,
    } : {
      id: `fallback_${thread.id}`,
      content: null,
      image: undefined,
      imageThumb: undefined,
      video: undefined,
      authorWallet: 'anonymous',
      authorDisplayName: 'Anonymous',
      timestamp: thread.createdAt || new Date(),
      isAnonymous: true,
    },
    replies: replies.map(reply => ({
      id: reply.id,
      timestamp: reply.timestamp,
      content: reply.content,
      image: reply.imageFileId ? `/api/files/${reply.imageFileId}` : undefined,
      video: reply.videoFileId ? `/api/files/${reply.videoFileId}` : undefined,
      authorWallet: reply.authorId || 'anonymous',
      authorDisplayName: reply.authorId ? (profilesMap.get(reply.authorId) || 'Anonymous') : 'Anonymous',
      isAnonymous: reply.isAnonymous,
      mediaFiles: [],
    })),
  };
}

export async function getThreadBySlug(slug: string) {
  await connectDB();
  
  const thread: any = await Thread.findOne({ slug }).lean();
  if (!thread) return null;
  
  const opPost: any = await Post.findOne({ id: thread.opPostId }).lean();
  const replies: any[] = await Post.find({ threadId: thread.id })
    .sort({ timestamp: 1 })
    .lean();
  
  // Get all author wallet addresses
  const authorWallets = new Set<string>();
  if (opPost?.authorId) authorWallets.add(opPost.authorId);
  replies.forEach(reply => {
    if (reply.authorId) authorWallets.add(reply.authorId);
  });
  
  // Fetch all profiles at once
  let profilesMap = new Map<string, string>();
  if (authorWallets.size > 0) {
    try {
      const profiles = await getUserProfiles(Array.from(authorWallets));
      profiles.forEach(profile => {
        profilesMap.set(profile.walletAddress, profile.username || 'Anonymous');
      });
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }
  
  // Get OP author display name
  const opAuthorDisplayName = opPost?.authorId 
    ? (profilesMap.get(opPost.authorId) || 'Anonymous')
    : 'Anonymous';
  
  return {
    thread: {
      ...thread,
      op: opPost ? {
        id: opPost.id,
        content: opPost.content || null,
        image: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        imageThumb: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        video: opPost.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
        authorWallet: opPost.authorId || 'anonymous',
        authorDisplayName: opAuthorDisplayName,
        timestamp: opPost.timestamp || thread.createdAt,
        isAnonymous: opPost.isAnonymous !== false,
      } : {
        id: `fallback_${thread.id}`,
        content: null,
        image: undefined,
        imageThumb: undefined,
        video: undefined,
        authorWallet: 'anonymous',
        authorDisplayName: 'Anonymous',
        timestamp: thread.createdAt || new Date(),
        isAnonymous: true,
      },
    },
    comments: replies.map(reply => ({
      id: reply.id,
      timestamp: reply.timestamp,
      content: reply.content,
      image: reply.imageFileId ? `/api/files/${reply.imageFileId}` : undefined,
      video: reply.videoFileId ? `/api/files/${reply.videoFileId}` : undefined,
      authorWallet: reply.authorId || 'anonymous',
      authorDisplayName: reply.authorId ? (profilesMap.get(reply.authorId) || 'Anonymous') : 'Anonymous',
      isAnonymous: reply.isAnonymous,
      mediaFiles: [],
    })),
  };
}

export async function createThread(threadData: {
  id: string;
  slug: string;
  title: string;
  op: {
    content?: string;
    image?: string;
    video?: string;
    authorId: string;
    timestamp: Date;
  };
  authorId: string;
}) {
  await connectDB();
  
  // Create OP post
  const opPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  // Handle image/video: if it's a MongoDB ObjectId string, use it; if it's a URL, ignore it (legacy)
  const imageFileId = threadData.op.image && !threadData.op.image.startsWith('http') 
    ? threadData.op.image 
    : null;
  const videoFileId = threadData.op.video && !threadData.op.video.startsWith('http')
    ? threadData.op.video
    : null;
  
  const opPost = new Post({
    id: opPostId,
    threadId: threadData.id,
    content: threadData.op.content || null,
    imageFileId: imageFileId,
    videoFileId: videoFileId,
    authorId: threadData.authorId,
    isAnonymous: true,
    timestamp: threadData.op.timestamp,
  });
  await opPost.save();
  
  // Create thread
  const thread = new Thread({
    id: threadData.id,
    slug: threadData.slug,
    title: threadData.title,
    opPostId: opPostId,
    authorId: threadData.authorId,
    replyCount: 0,
    imageCount: imageFileId ? 1 : 0,
    videoCount: videoFileId ? 1 : 0,
    lastActivity: new Date(),
    createdAt: new Date(),
  });
  await thread.save();
  
  // Cleanup old threads if needed
  const threadCount = await Thread.countDocuments({});
  if (threadCount > 100) {
    const oldThreads = await Thread.find({})
      .sort({ createdAt: 1 })
      .limit(threadCount - 100)
      .lean();
    
    for (const oldThread of oldThreads) {
      // Delete associated posts
      await Post.deleteMany({ threadId: oldThread.id });
      // Delete thread
      await Thread.deleteOne({ id: oldThread.id });
    }
  }
  
  return thread;
}

export async function addCommentToThread(threadId: string, comment: {
  id: string;
  content?: string;
  image?: string;
  video?: string;
  authorId: string;
  timestamp: Date;
}) {
  await connectDB();
  
  // Handle image/video: if it's a MongoDB ObjectId string, use it; if it's a URL, ignore it (legacy)
  const imageFileId = comment.image && !comment.image.startsWith('http') 
    ? comment.image 
    : null;
  const videoFileId = comment.video && !comment.video.startsWith('http')
    ? comment.video
    : null;
  
  // Create post
  const post = new Post({
    id: comment.id,
    threadId: threadId,
    content: comment.content || null,
    imageFileId: imageFileId,
    videoFileId: videoFileId,
    authorId: comment.authorId,
    isAnonymous: true,
    timestamp: comment.timestamp,
  });
  await post.save();
  
  // Update thread
  const thread = await Thread.findOne({ id: threadId });
  if (thread) {
    thread.replyCount = (thread.replyCount || 0) + 1;
    if (imageFileId) thread.imageCount = (thread.imageCount || 0) + 1;
    if (videoFileId) thread.videoCount = (thread.videoCount || 0) + 1;
    thread.lastActivity = new Date();
    await thread.save();
  }
  
  return post;
}

// File operations using GridFS
export async function uploadFileToGridFS(
  buffer: Buffer,
  filename: string,
  contentType: string,
  userId: string
): Promise<string> {
  try {
    await connectDB();
  } catch (dbError) {
    console.error('MongoDB connection error:', dbError);
    throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
  }
  
  let gridFSBucket;
  try {
    gridFSBucket = await getGridFSBucket();
  } catch (bucketError) {
    console.error('GridFS bucket error:', bucketError);
    throw new Error(`Failed to get GridFS bucket: ${bucketError instanceof Error ? bucketError.message : 'Unknown error'}`);
  }
  
  // Upload to GridFS
  const uploadStream = gridFSBucket.openUploadStream(filename, {
    contentType,
  });
  
  const readable = Readable.from(buffer);
  readable.pipe(uploadStream);
  
  await new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', (error) => {
      console.error('GridFS upload stream error:', error);
      reject(new Error(`GridFS upload failed: ${error.message}`));
    });
  });
  
  // Save file metadata
  try {
    const fileDoc = new File({
      filename,
      contentType,
      size: buffer.length,
      uploadedAt: new Date(),
      uploadedBy: userId,
      gridFSFileId: uploadStream.id,
    });
    await fileDoc.save();
    
    // Return the File document ID (not GridFS ID) for easier reference
    return fileDoc._id.toString();
  } catch (saveError) {
    console.error('File metadata save error:', saveError);
    // File was uploaded to GridFS but metadata save failed
    // Try to delete the GridFS file to avoid orphaned files
    try {
      await gridFSBucket.delete(uploadStream.id);
    } catch (deleteError) {
      console.error('Failed to clean up GridFS file after metadata save failure:', deleteError);
    }
    throw new Error(`Failed to save file metadata: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`);
  }
}

export async function getFileFromGridFS(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string;
  filename: string;
} | null> {
  await connectDB();
  
  // fileId can be either the File document _id or gridFSFileId
  let fileDoc = await File.findOne({ _id: fileId, isDeleted: false });
  if (!fileDoc) {
    // Try finding by gridFSFileId for backward compatibility
    fileDoc = await File.findOne({ gridFSFileId: fileId, isDeleted: false });
  }
  if (!fileDoc) return null;
  
  const gridFSBucket = await getGridFSBucket();
  const downloadStream = gridFSBucket.openDownloadStream(fileDoc.gridFSFileId);
  
  return {
    stream: downloadStream,
    contentType: fileDoc.contentType,
    filename: fileDoc.filename,
  };
}

export async function deleteFileFromGridFS(fileId: string): Promise<boolean> {
  await connectDB();
  
  // fileId can be either the File document _id or gridFSFileId
  let fileDoc = await File.findOne({ _id: fileId });
  if (!fileDoc) {
    fileDoc = await File.findOne({ gridFSFileId: fileId });
  }
  if (!fileDoc) return false;
  
  const gridFSBucket = await getGridFSBucket();
  await gridFSBucket.delete(fileDoc.gridFSFileId);
  
  fileDoc.isDeleted = true;
  await fileDoc.save();
  
  return true;
}

// Cleanup old files (30 days)
export async function cleanupOldFiles(): Promise<number> {
  await connectDB();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const oldFiles = await File.find({
    uploadedAt: { $lt: thirtyDaysAgo },
    isDeleted: false,
  });
  
  const gridFSBucket = await getGridFSBucket();
  let deletedCount = 0;
  
  for (const fileDoc of oldFiles) {
    try {
      await gridFSBucket.delete(fileDoc.gridFSFileId);
      fileDoc.isDeleted = true;
      await fileDoc.save();
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete file ${fileDoc.gridFSFileId}:`, error);
    }
  }
  
  return deletedCount;
}

