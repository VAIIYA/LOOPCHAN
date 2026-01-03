import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ threads: [], page: 1, totalPages: 0, totalThreads: 0 });
}

export async function POST() {
  return NextResponse.json({ success: true, message: 'Thread created' });
}
