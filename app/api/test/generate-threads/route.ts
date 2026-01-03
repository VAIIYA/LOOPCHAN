import { NextRequest, NextResponse } from 'next/server';
import { createThread, getAllThreads, ThreadData } from '@/lib/memoryStorage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 100, clearExisting = false } = body;
    
    console.log(`🧪 TEST: Generating ${count} test threads...`);
    
    // Check current thread count
    const currentIndex = await getAllThreads();
    const currentCount = currentIndex.threads.length;
    
    console.log(`Current thread count: ${currentCount}`);
    
    if (clearExisting && currentCount > 0) {
      console.log('⚠️  WARNING: clearExisting=true but we cannot clear threads in Lighthouse Storage');
      console.log('Threads will be added on top, pushing existing ones down');
    }
    
    const threadsToCreate = Math.min(count, 100); // Don't exceed 100
    const createdThreads = [];
    
    for (let i = 1; i <= threadsToCreate; i++) {
      const threadId = `test_thread_${Date.now()}_${i}`;
      const title = `Test Thread ${i} - Generated for Cleanup Testing`;
      
      const testThreadData: ThreadData = {
        id: threadId,
        slug: `test-thread-${i}`,
        title,
        op: {
          content: `This is test thread ${i} created for testing the cleanup logic. When thread 101 is created, this thread should be removed from the board.`,
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
      
      try {
        await createThread(testThreadData);
        createdThreads.push({
          id: threadId,
          title,
          position: i
        });
        
        console.log(`✅ Created test thread ${i}/${threadsToCreate}: "${title}"`);
        
        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ Failed to create test thread ${i}:`, error);
      }
    }
    
    // Get final thread count
    const finalIndex = await getAllThreads();
    const finalCount = finalIndex.threads.length;
    
    console.log(`🎯 TEST COMPLETE: Created ${createdThreads.length} test threads`);
    console.log(`📊 Final thread count: ${finalCount}`);
    console.log(`📋 Thread positions:`);
    
    finalIndex.threads.slice(0, 10).forEach((thread, index) => {
      console.log(`  ${index + 1}. ${thread.title} (${thread.id})`);
    });
    
    if (finalCount > 10) {
      console.log(`  ... and ${finalCount - 10} more threads`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${createdThreads.length} test threads`,
      stats: {
        requested: threadsToCreate,
        created: createdThreads.length,
        initialCount: currentCount,
        finalCount: finalCount,
        threadsCreated: createdThreads
      }
    });
    
  } catch (error) {
    console.error('Test thread generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate test threads',
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
      currentStatus: {
        totalThreads: threadsIndex.threads.length,
        maxThreads: 100,
        threadsAtLimit: threadsIndex.threads.length >= 100,
        threads: threadsIndex.threads.slice(0, 10).map((thread, index) => ({
          position: index + 1,
          id: thread.id,
          title: thread.title,
          slug: thread.slug
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting thread status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get thread status' },
      { status: 500 }
    );
  }
}
