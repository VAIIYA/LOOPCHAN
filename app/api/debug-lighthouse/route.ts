import { NextResponse } from 'next/server';
import { getAllThreads } from '@/lib/memoryStorage';

export async function GET() {
  try {
    // Test basic Lighthouse SDK import
    const lighthouse = await import('@lighthouse-web3/sdk');
    
    console.log('🔍 Debug: Checking environment variables...');
    console.log('LIGHTHOUSE_API_KEY exists:', !!process.env.LIGHTHOUSE_API_KEY);
    console.log('LIGHTHOUSE_API_KEY length:', process.env.LIGHTHOUSE_API_KEY?.length || 0);
    console.log('All env vars starting with LIGHTHOUSE:', Object.keys(process.env).filter(key => key.startsWith('LIGHTHOUSE')));
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
    
    // Test Lighthouse Storage with memory-based structure
    let lighthouseTest: any = { success: false, error: 'Not tested' };
    const apiKey = process.env.LIGHTHOUSE_API_KEY;
    
    if (apiKey) {
      try {
        // Test loading threads index from memory storage
        const threadsIndex = await getAllThreads();
        
        lighthouseTest = {
          success: true,
          message: 'Lighthouse Storage with memory structure is working',
          threadCount: threadsIndex?.threads?.length || 0,
          hasData: !!threadsIndex,
          totalThreads: threadsIndex?.totalThreads || 0,
          lastUpdated: threadsIndex?.lastUpdated,
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
          apiKeyLength: apiKey.length
        };
      } catch (lighthouseError) {
        lighthouseTest = {
          success: false,
          error: lighthouseError instanceof Error ? lighthouseError.message : 'Unknown lighthouse error',
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
          apiKeyLength: apiKey.length
        };
      }
    } else {
      lighthouseTest = { success: false, error: 'LIGHTHOUSE_API_KEY not found' };
    }
    
    return NextResponse.json({
      success: true,
      lighthouseImported: true,
      lighthouseVersion: lighthouse.default ? 'available' : 'unavailable',
      apiKey: process.env.LIGHTHOUSE_API_KEY ? 'configured' : 'missing',
      apiKeyLength: process.env.LIGHTHOUSE_API_KEY?.length || 0,
      lighthouseTest: lighthouseTest,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        lighthouseVars: Object.keys(process.env).filter(key => key.startsWith('LIGHTHOUSE')),
        allEnvKeys: Object.keys(process.env).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      lighthouseImported: false,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}