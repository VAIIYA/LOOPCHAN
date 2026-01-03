import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldFiles } from '@/lib/mongodbStorage';

// This endpoint should be protected and called via cron job
// For Vercel, you can use Vercel Cron Jobs or call this endpoint periodically
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check here
    // For now, we'll allow it but you should protect this in production
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CLEANUP_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedCount = await cleanupOldFiles();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} files older than 30 days`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup files' },
      { status: 500 }
    );
  }
}

// Also allow GET for manual triggers (remove in production or add auth)
export async function GET(request: NextRequest) {
  try {
    const deletedCount = await cleanupOldFiles();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} files older than 30 days`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup files' },
      { status: 500 }
    );
  }
}

