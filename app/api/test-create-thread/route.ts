import { NextResponse } from 'next/server';
import { createThread, ThreadData } from '@/lib/memoryStorage';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🧪 TEST: Testing createThread function directly...');
    
    // Create a very simple thread
    const testThread: ThreadData = {
      id: `test_${Date.now()}`,
      slug: `test-thread-${Date.now()}`,
      title: 'Simple Test Thread',
      op: {
        content: 'This is a simple test',
        authorWallet: 'test-wallet',
        timestamp: new Date()
      },
      replyCount: 0,
      imageCount: 0,
      videoCount: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      authorWallet: 'test-wallet'
    };
    
    console.log('About to call createThread with:', testThread.id);
    await createThread(testThread);
    console.log('✅ createThread completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'createThread test passed',
      threadId: testThread.id
    });
    
  } catch (error) {
    console.error('❌ createThread test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
