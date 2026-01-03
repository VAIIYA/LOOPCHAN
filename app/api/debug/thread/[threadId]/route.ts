import { NextRequest, NextResponse } from 'next/server';
import { getThreadById } from '@/lib/memoryStorage';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const { threadId } = params;
    
    console.log(`DEBUG: Loading thread ${threadId} for debugging`);
    
    // Load the specific thread data
    const threadData = await getThreadById(threadId);
    
    console.log(`DEBUG: Loaded thread data for ${threadId}`);
    console.log(`DEBUG: Thread exists:`, !!threadData);
    console.log(`DEBUG: Thread has replies:`, threadData?.replies?.length || 0);
    
    if (!threadData) {
      return NextResponse.json({
        success: false,
        error: 'Thread not found',
        debug: { threadId, threadData: null }
      });
    }

    // Return detailed debug information
    return NextResponse.json({
      success: true,
      thread: {
        id: threadData.id,
        title: threadData.title,
        replyCount: threadData.replyCount,
        replies: threadData.replies || [],
        replyDetails: threadData.replies ? threadData.replies.map((r: any) => ({
          id: r.id,
          hasImage: !!r.image,
          hasContent: !!r.content,
          hasVideo: !!r.video,
          timestamp: r.timestamp,
          authorWallet: r.authorWallet
        })) : []
      },
      debug: {
        threadExists: true,
        hasReplies: !!(threadData.replies && threadData.replies.length > 0),
        replyCount: threadData.replies ? threadData.replies.length : 0
      }
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug API failed',
        debug: { error: error instanceof Error ? error.message : 'Unknown error' }
      },
      { status: 500 }
    );
  }
}
