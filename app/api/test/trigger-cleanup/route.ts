import { NextRequest, NextResponse } from 'next/server';
import { createThread, getAllThreads, ThreadData } from '@/lib/memoryStorage';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
    console.log('🧪 TEST: Creating thread 101 to trigger cleanup...');
    
    // Get current thread count
    const currentIndex = await getAllThreads();
    const currentCount = currentIndex.threads.length;
    
    console.log(`Current thread count: ${currentCount}`);
    
    if (currentCount < 100) {
      return NextResponse.json({
        success: false,
        message: `Cannot trigger cleanup - only ${currentCount} threads exist (need 100)`,
        currentCount,
        needed: 100 - currentCount
      });
    }
    
    // Create thread 101 to trigger cleanup
    const threadId = `cleanup_test_thread_${Date.now()}`;
    const title = `Thread 101 - Cleanup Test Thread`;
    
    const cleanupTestThread: ThreadData = {
      id: threadId,
      slug: `cleanup-test-thread`,
      title,
      op: {
        content: `This is thread 101 created to test the cleanup logic. The oldest thread should be removed when this thread is created.`,
        authorWallet: 'test_wallet_address',
        timestamp: new Date()
      },
      replyCount: 0,
      imageCount: 0,
      videoCount: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      authorWallet: 'test_wallet_address'
    };
    
    console.log('Creating thread 101...');
    await createThread(cleanupTestThread);
    
    // Get final thread count and check what happened
    const finalIndex = await getAllThreads();
    const finalCount = finalIndex.threads.length;
    
    console.log(`🎯 CLEANUP TEST COMPLETE:`);
    console.log(`📊 Thread count before: ${currentCount}`);
    console.log(`📊 Thread count after: ${finalCount}`);
    console.log(`🧹 Cleanup triggered: ${currentCount > finalCount ? 'YES' : 'NO'}`);
    
    // Show the top 5 threads (newest)
    console.log(`📋 Top 5 threads after cleanup:`);
    finalIndex.threads.slice(0, 5).forEach((thread, index) => {
      console.log(`  ${index + 1}. ${thread.title} (${thread.id})`);
    });
    
    // Show the bottom 5 threads (oldest)
    if (finalIndex.threads.length > 5) {
      console.log(`📋 Bottom 5 threads (oldest):`);
      finalIndex.threads.slice(-5).forEach((thread, index) => {
        const position = finalIndex.threads.length - 4 + index;
        console.log(`  ${position}. ${thread.title} (${thread.id})`);
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Thread 101 created successfully`,
      cleanup: {
        triggered: currentCount > finalCount,
        threadsBefore: currentCount,
        threadsAfter: finalCount,
        threadsRemoved: currentCount - finalCount
      },
      newThread: {
        id: threadId,
        title,
        position: 1 // Should be at position 1 (top)
      },
      topThreads: finalIndex.threads.slice(0, 5).map((thread, index) => ({
        position: index + 1,
        id: thread.id,
        title: thread.title
      }))
    });
    
  } catch (error) {
    console.error('Cleanup test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger cleanup test',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current thread status
    const threadsIndex = await getAllThreads();
    
    return NextResponse.json({
      success: true,
      status: {
        totalThreads: threadsIndex.threads.length,
        maxThreads: 100,
        atLimit: threadsIndex.threads.length >= 100,
        canTriggerCleanup: threadsIndex.threads.length >= 100,
        oldestThread: threadsIndex.threads[threadsIndex.threads.length - 1] || null,
        newestThread: threadsIndex.threads[0] || null
      }
    });
    
  } catch (error) {
    console.error('Error getting cleanup status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cleanup status' },
      { status: 500 }
    );
  }
}
