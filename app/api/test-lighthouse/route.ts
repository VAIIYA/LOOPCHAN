import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.LIGHTHOUSE_API_KEY;
    
    return NextResponse.json({
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
      message: apiKey ? 'Lighthouse API key is configured' : 'Lighthouse API key is missing',
      timestamp: new Date().toISOString(),
      deployment: 'v3.0',
      status: 'Lighthouse.storage integration ready',
      fixes: ['Fixed API key handling', 'Fixed data loading', 'Fixed TypeScript errors']
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check Lighthouse configuration',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
