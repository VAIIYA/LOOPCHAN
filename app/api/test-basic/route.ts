import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🧪 TEST: Testing basic functionality...');
    
    // Test 1: Basic console logging
    console.log('Test 1: Basic console logging works');
    
    // Test 2: Basic object creation
    console.log('Test 2: Creating basic object...');
    const testObject = {
      id: `test_${Date.now()}`,
      title: 'Test Object',
      timestamp: new Date().toISOString()
    };
    console.log('✅ Basic object created:', testObject);
    
    // Test 3: Basic array operations
    console.log('Test 3: Testing array operations...');
    const testArray = [];
    testArray.push(testObject);
    console.log('✅ Array operations work:', testArray.length, 'items');
    
    return NextResponse.json({
      success: true,
      message: 'Basic functionality test passed',
      testObject: testObject,
      arrayLength: testArray.length
    });
    
  } catch (error) {
    console.error('❌ Basic test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
