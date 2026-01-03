import { NextRequest, NextResponse } from 'next/server';
import { getAllThreads } from '@/lib/memoryStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'backup') {
      // For now, skip backup since it's not implemented in production
      return NextResponse.json({
        success: true,
        message: 'Backup not implemented in production',
        backupFile: null
      });
    }
    
    // Get unified threads data
    const threadsIndex = await getAllThreads();
    
    // Calculate statistics
    const stats = {
      totalBoards: 1, // Single unified board
      totalThreads: threadsIndex.threads?.length || 0,
      boards: [{
        id: 'main',
        threadCount: threadsIndex.threads?.length || 0,
        lastUpdated: threadsIndex.lastUpdated,
        createdAt: threadsIndex.lastUpdated // Use lastUpdated as createdAt for now
      }]
    };
    
    return NextResponse.json({
      success: true,
      stats,
      data: { main: threadsIndex }
    });
    
  } catch (error) {
    console.error('Admin storage API error:', error);
    return NextResponse.json(
      { error: 'Failed to get storage info' },
      { status: 500 }
    );
  }
}
