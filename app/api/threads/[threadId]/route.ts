import { NextRequest, NextResponse } from 'next/server';
import { getThreadById } from '@/lib/memoryStorage';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    
    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Load the specific thread data
    const threadData = await getThreadById(threadId);
    
    if (!threadData) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Debug: Log thread details including replies
    console.log(`Thread ${threadId} found with ${threadData.replies?.length || 0} replies`);
    if (threadData.replies && threadData.replies.length > 0) {
      console.log('Reply IDs:', threadData.replies.map((r: any) => r.id));
      console.log('Reply details:', threadData.replies.map((r: any) => ({ 
        id: r.id, 
        hasImage: !!r.image, 
        hasContent: !!r.content,
        timestamp: r.timestamp 
      })));
    } else {
      console.log('No replies found for thread');
    }

    // Normalize dates for consistent API response
    const normalizedThread = {
      ...threadData,
      replies: threadData.replies || [], // Use replies from memory storage
      lastReply: threadData.lastReply?.toISOString?.() || threadData.lastReply,
      createdAt: threadData.createdAt?.toISOString?.() || threadData.createdAt,
      lastActivity: threadData.lastActivity?.toISOString?.() || threadData.lastActivity,
      op: {
        ...threadData.op,
        timestamp: threadData.op?.timestamp?.toISOString?.() || threadData.op?.timestamp
      }
    };

    return NextResponse.json({
      success: true,
      thread: normalizedThread
    });
    
  } catch (error) {
    console.error('Thread API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get thread' },
      { status: 500 }
    );
  }
}
