import { NextRequest, NextResponse } from 'next/server';
import { getAllThreads } from '@/lib/memoryStorage';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  try {
    console.log('Slug migration not needed - new folder-based storage system automatically generates slugs');

    // Load current threads data to show status
    const threadsIndex = await getAllThreads();
    
    if (!threadsIndex || !threadsIndex.threads) {
      return NextResponse.json(
        { success: false, error: 'No threads data found' },
        { status: 404 }
      );
    }

    // Check if all threads have slugs
    const threadsWithoutSlugs = threadsIndex.threads.filter(thread => !thread.slug);
    const threadsWithSlugs = threadsIndex.threads.filter(thread => thread.slug);

    return NextResponse.json({
      success: true,
      message: `Slug migration not needed - new system automatically generates slugs`,
      stats: {
        totalThreads: threadsIndex.threads.length,
        threadsWithSlugs: threadsWithSlugs.length,
        threadsWithoutSlugs: threadsWithoutSlugs.length,
        migrationNeeded: threadsWithoutSlugs.length > 0
      }
    });

  } catch (error) {
    console.error('Error checking slug migration status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check slug migration status' },
      { status: 500 }
    );
  }
}
