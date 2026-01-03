import { NextRequest, NextResponse } from 'next/server';
import { getAllThreads } from '@/lib/memoryStorage';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    console.log('Debug: Loading threads data...');
    const threadsIndex = await getAllThreads();
    
    if (!threadsIndex || !threadsIndex.threads) {
      return NextResponse.json({
        success: false,
        error: 'No threads data found',
        debug: {
          hasData: !!threadsIndex,
          hasThreads: !!threadsIndex?.threads,
          threadCount: threadsIndex?.threads?.length || 0
        }
      });
    }

    // Return detailed thread information for debugging
    const debugInfo = {
      success: true,
      totalThreads: threadsIndex.threads.length,
      lastUpdated: threadsIndex.lastUpdated,
      threads: threadsIndex.threads.map((thread: any) => ({
        id: thread.id,
        title: thread.title,
        slug: thread.slug,
        slugLength: thread.slug?.length,
        slugType: typeof thread.slug,
        replyCount: thread.replyCount,
        createdAt: thread.createdAt,
        lastActivity: thread.lastActivity
      }))
    };

    console.log('Debug: Returning thread data:', debugInfo);
    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug: Error loading threads data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load threads data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
