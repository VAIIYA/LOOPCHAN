import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { CreatePostRequest } from '@/types';
import { getThreadById, addCommentToThread } from '@/lib/mongodbStorage';
import { isExemptFromFees } from '@/lib/admin';

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
    
    const { content, image, video, authorWallet, paymentSignature } = body;
    
    // Check wallet authentication
    if (!authorWallet) {
      return NextResponse.json(
        { error: 'Wallet connection required. Please connect your Solana wallet.' },
        { status: 401 }
      );
    }

    // Check if user is exempt from fees (admin or mod)
    const exemptFromFees = await isExemptFromFees(authorWallet);
    
    // If not exempt, verify payment
    if (!exemptFromFees) {
      if (!paymentSignature) {
        return NextResponse.json(
          { 
            error: 'Payment required',
            requiresPayment: true,
            amount: 0.01,
            message: 'You must pay 0.01 USDC to post a comment. Admins and mods are exempt.'
          },
          { status: 402 } // 402 Payment Required
        );
      }

      // Verify payment signature
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const verifyResponse = await fetch(
          `${baseUrl}/api/payments/posting-fee?signature=${paymentSignature}&fromWallet=${authorWallet}`
        );
        const verifyResult = await verifyResponse.json();
        
        if (!verifyResult.verified) {
          return NextResponse.json(
            { error: 'Payment verification failed. Please try again.' },
            { status: 402 }
          );
        }
      } catch (verifyError) {
        console.error('Payment verification error:', verifyError);
        return NextResponse.json(
          { error: 'Payment verification failed. Please try again.' },
          { status: 402 }
        );
      }
    }

    // Content, image, and video are optional, but at least one must be provided
    if (!content && !image && !video) {
      return NextResponse.json(
        { error: 'Please provide either a comment, image, or video' },
        { status: 400 }
      );
    }

    // Extract file IDs from URLs if they are URLs
    // URLs come in format: /api/files/{fileId}
    const extractFileId = (urlOrId: string | undefined | null): string | undefined => {
      if (!urlOrId) return undefined;
      if (typeof urlOrId === 'string' && urlOrId.startsWith('/api/files/')) {
        return urlOrId.replace('/api/files/', '');
      }
      // If it's already an ID, return as is
      return urlOrId;
    };

    const imageFileId = extractFileId(image);
    const videoFileId = extractFileId(video);

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
      image: imageFileId || undefined,
      video: videoFileId || undefined,
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