import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    deployment: 'v4.0',
    message: 'Health check endpoint working'
  });
}
