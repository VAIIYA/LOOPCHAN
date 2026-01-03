import { NextRequest, NextResponse } from 'next/server';
import { getThreadBySlug } from '@/lib/mongodbStorage';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log(`Fetching thread by slug: ${slug}`);

    // Load thread data from MongoDB
    let threadData = null;
    try {
      threadData = await getThreadBySlug(slug);
    } catch (error) {
      console.error('Failed to load thread data from MongoDB:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load thread data from storage' },
        { status: 500 }
      );
    }
    
    // Additional verification: ensure we have the most recent data
    if (threadData && threadData.thread) {
      console.log(`Slug lookup: Found thread "${threadData.thread.title}" with ${threadData.comments.length} comments`);
      console.log(`Slug lookup: Thread reply IDs:`, threadData.comments.map((r: any) => r.id));
    }
    
    console.log(`DEBUG: Loaded thread data:`, {
      hasData: !!threadData,
      hasThread: !!threadData?.thread,
      hasComments: !!threadData?.comments,
      commentCount: threadData?.comments?.length || 0,
      threadTitle: threadData?.thread?.title
    });
    
    if (!threadData || !threadData.thread) {
      console.log('No thread data found after retries');
      return NextResponse.json(
        { success: false, error: 'No thread found' },
        { status: 404 }
      );
    }

    const { thread, comments } = threadData;

    console.log(`Thread found: ${thread.title} (${thread.id})`);
    console.log(`Thread has ${comments.length} comments`);
    console.log(`Comment IDs:`, comments.map((r: any) => r.id));
    console.log(`Thread data structure:`, {
      id: thread.id,
      title: thread.title,
      slug: thread.slug,
      replyCount: thread.replyCount,
      actualComments: comments.length,
      lastReply: thread.lastReply,
      lastActivity: thread.lastActivity
    });

    return NextResponse.json({
      success: true,
      thread: {
        id: thread.id,
        slug: thread.slug,
        title: thread.title,
        op: thread.op,
        replies: comments, // Use comments from folder storage
        lastReply: thread.lastReply,
        replyCount: thread.replyCount || 0,
        imageCount: thread.imageCount || 0,
        videoCount: thread.videoCount || 0,
        createdAt: thread.createdAt,
        lastActivity: thread.lastActivity,
        authorWallet: thread.authorWallet
      }
    });

  } catch (error) {
    console.error('Error fetching thread by slug:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}