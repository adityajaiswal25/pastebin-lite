import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';

// Debug endpoint to check stored pastes (remove in production)
export async function GET() {
  try {
    const kv = await getKV();
    
    // This is a simple debug endpoint - in production KV, you'd need to use SCAN
    // For now, just return KV availability
    const testKey = 'paste:test';
    await kv.set(testKey, 'test');
    const value = await kv.get(testKey);
    await kv.del(testKey);
    
    return NextResponse.json({
      kvAvailable: true,
      testValue: value,
      message: 'KV is working. Note: This endpoint cannot list all pastes in production KV.',
    });
  } catch (error) {
    return NextResponse.json({
      kvAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

