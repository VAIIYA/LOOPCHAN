import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Simple threads endpoint called');
    
    return NextResponse.json({
      threads: [],
      page: 1,
      totalPages: 0,
      totalThreads: 0,
      message: 'Simple endpoint working'
    });
  } catch (error) {
    console.error('Simple threads error:', error);
    return NextResponse.json(
      { error: 'Failed to get threads' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log('Simple threads POST called');
    
    return NextResponse.json({
      success: true,
      message: 'Simple POST endpoint working'
    });
  } catch (error) {
    console.error('Simple threads POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    );
  }
}
