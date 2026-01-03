import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { CreatePostRequest } from '@/types';
import { getThreadById, addCommentToThread } from '@/lib/mongodbStorage';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    console.log('POST /api/threads/[threadId]/posts called with params:', params);
    const { threadId } = params;
    const body: CreatePostRequest = await _request.json();
    
    console.log('Request body:', body);
    
    const { content, image, video, authorWallet } = body;
    
    // Check wallet authentication
    if (!authorWallet) {
      return NextResponse.json(
        { error: 'Wallet connection required. Please connect your Solana wallet.' },
        { status: 401 }
      );
    }

    // Content, image, and video are optional, but at least one must be provided
    if (!content && !image && !video) {
      return NextResponse.json(
        { error: 'Please provide either a comment, image, or video' },
        { status: 400 }
      );
    }

    // Load the thread data from MongoDB
    const threadData = await getThreadById(threadId);
    
    if (!threadData) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Create new comment
    const commentId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const newComment = {
      id: commentId,
      content: content || undefined,
      image: image || undefined,
      video: video || undefined,
      authorId: authorWallet,
      timestamp: new Date(),
    };

    console.log('Creating new comment:', newComment);

    // Add comment to thread using MongoDB storage
    console.log(`Adding comment to thread ${threadId} using MongoDB storage`);
    try {
      await addCommentToThread(threadId, newComment);
      console.log(`Comment added successfully to thread ${threadId}`);
    } catch (addError) {
      console.error(`CRITICAL: Failed to add comment to thread:`, addError);
      return NextResponse.json(
        { error: 'Failed to add comment to thread' },
        { status: 500 }
      );
    }
    
    // Revalidate the homepage to ensure fresh data
    revalidatePath('/');
    
    console.log(`Added comment to thread ${threadId} - ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      post: {
        id: commentId,
        content: newComment.content,
        image: newComment.image,
        video: newComment.video,
        timestamp: newComment.timestamp,
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    console.log('GET /api/threads/[threadId]/posts called with params:', params);
    const { threadId } = params;

    // Load the thread data from MongoDB
    const threadData = await getThreadById(threadId);
    
    if (!threadData) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      thread: {
        ...threadData,
        replies: threadData.replies || []
      }
    });

  } catch (error) {
    console.error('Get thread error:', error);
    return NextResponse.json(
      { error: 'Failed to get thread' },
      { status: 500 }
    );
  }
}