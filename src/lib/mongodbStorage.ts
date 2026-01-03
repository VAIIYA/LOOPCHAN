import { getDatabase, getGridFSBucket } from './mongodb';
import { Thread, Post, File } from './models';
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
  
  // Get OP posts for each thread
  const threadsWithOP = await Promise.all(
    threads.map(async (thread) => {
      const opPost = await Post.findOne({ id: thread.opPostId }).lean();
      return {
        ...thread,
        op: opPost ? {
          content: opPost.content,
          image: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
          video: opPost.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
          authorWallet: 'anonymous', // Keep for compatibility
          timestamp: opPost.timestamp,
        } : null,
      };
    })
  );
  
  return {
    threads: threadsWithOP,
    totalThreads: threads.length,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getThreadById(threadId: string) {
  await connectDB();
  
  const thread = await Thread.findOne({ id: threadId }).lean();
  if (!thread) return null;
  
  const opPost = await Post.findOne({ id: thread.opPostId }).lean();
  const replies = await Post.find({ threadId: threadId })
    .sort({ timestamp: 1 })
    .lean();
  
  return {
    ...thread,
    op: opPost ? {
      content: opPost.content,
      image: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
      video: opPost.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
      authorWallet: 'anonymous',
      timestamp: opPost.timestamp,
    } : null,
    replies: replies.map(reply => ({
      id: reply.id,
      timestamp: reply.timestamp,
      content: reply.content,
      image: reply.imageFileId ? `/api/files/${reply.imageFileId}` : undefined,
      video: reply.videoFileId ? `/api/files/${reply.videoFileId}` : undefined,
      authorWallet: 'anonymous',
      isAnonymous: reply.isAnonymous,
      mediaFiles: [],
    })),
  };
}

export async function getThreadBySlug(slug: string) {
  await connectDB();
  
  const thread = await Thread.findOne({ slug }).lean();
  if (!thread) return null;
  
  const opPost = await Post.findOne({ id: thread.opPostId }).lean();
  const replies = await Post.find({ threadId: thread.id })
    .sort({ timestamp: 1 })
    .lean();
  
  return {
    thread: {
      ...thread,
      op: opPost ? {
        content: opPost.content,
        image: opPost.imageFileId ? `/api/files/${opPost.imageFileId}` : undefined,
        video: opPost.videoFileId ? `/api/files/${opPost.videoFileId}` : undefined,
        authorWallet: 'anonymous',
        timestamp: opPost.timestamp,
      } : null,
    },
    comments: replies.map(reply => ({
      id: reply.id,
      timestamp: reply.timestamp,
      content: reply.content,
      image: reply.imageFileId ? `/api/files/${reply.imageFileId}` : undefined,
      video: reply.videoFileId ? `/api/files/${reply.videoFileId}` : undefined,
      authorWallet: 'anonymous',
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
  const opPost = new Post({
    id: opPostId,
    threadId: threadData.id,
    content: threadData.op.content || null,
    imageFileId: threadData.op.image || null,
    videoFileId: threadData.op.video || null,
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
    imageCount: threadData.op.image ? 1 : 0,
    videoCount: threadData.op.video ? 1 : 0,
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
  
  // Create post
  const post = new Post({
    id: comment.id,
    threadId: threadId,
    content: comment.content || null,
    imageFileId: comment.image || null,
    videoFileId: comment.video || null,
    authorId: comment.authorId,
    isAnonymous: true,
    timestamp: comment.timestamp,
  });
  await post.save();
  
  // Update thread
  const thread = await Thread.findOne({ id: threadId });
  if (thread) {
    thread.replyCount = (thread.replyCount || 0) + 1;
    if (comment.image) thread.imageCount = (thread.imageCount || 0) + 1;
    if (comment.video) thread.videoCount = (thread.videoCount || 0) + 1;
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
  await connectDB();
  
  const gridFSBucket = await getGridFSBucket();
  const db = await getDatabase();
  
  // Upload to GridFS
  const uploadStream = gridFSBucket.openUploadStream(filename, {
    contentType,
  });
  
  const readable = Readable.from(buffer);
  readable.pipe(uploadStream);
  
  await new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
  });
  
  // Save file metadata
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

