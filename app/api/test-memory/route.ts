import { NextResponse } from 'next/server';
import { getAllThreads, createThread, ThreadData } from '@/lib/memoryStorage';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🧪 TEST: Testing memory storage...');
    
    // Test 1: Load threads index
    console.log('Test 1: Loading threads index...');
    const index = await getAllThreads();
    console.log('✅ Threads index loaded:', index.threads.length, 'threads');
    
    // Test 2: Create a simple thread
    console.log('Test 2: Creating simple thread...');
    const testThread: ThreadData = {
      id: `test_${Date.now()}`,
      slug: `test-thread-${Date.now()}`,
      title: 'Test Thread',
      op: {
        content: 'This is a test thread',
        authorWallet: '2Z9eW3nwa2GZUM1JzXdfBK1MN57RPA2PrhuTREEZ31VY',
        timestamp: new Date()
      },
      replyCount: 0,
      imageCount: 0,
      videoCount: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      authorWallet: '2Z9eW3nwa2GZUM1JzXdfBK1MN57RPA2PrhuTREEZ31VY'
    };
    
    console.log('About to call createThread...');
    await createThread(testThread);
    console.log('✅ Thread created successfully');
    
    // Test 3: Load threads index again
    console.log('Test 3: Loading threads index after creation...');
    const updatedIndex = await getAllThreads();
    console.log('✅ Updated threads index:', updatedIndex.threads.length, 'threads');
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      initialThreads: index.threads.length,
      finalThreads: updatedIndex.threads.length,
      testThreadId: testThread.id
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
