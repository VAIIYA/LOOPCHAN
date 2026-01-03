import { NextResponse } from 'next/server';
import { getAllThreads } from '@/lib/memoryStorage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🧪 TEST: Testing simple memory storage...');
    
    // Test 1: Load threads index
    console.log('Test 1: Loading threads index...');
    const index = await getAllThreads();
    console.log('✅ Threads index loaded:', index.threads.length, 'threads');
    
    return NextResponse.json({
      success: true,
      message: 'Memory storage test passed',
      threadCount: index.threads.length,
      totalThreads: index.totalThreads,
      lastUpdated: index.lastUpdated
    });
    
  } catch (error) {
    console.error('❌ Memory storage test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
