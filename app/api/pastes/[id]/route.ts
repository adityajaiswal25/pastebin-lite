import { NextRequest, NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';
import { Paste, GetPasteResponse } from '@/lib/types';
import {
  getCurrentTime,
  isPasteAvailable,
  getRemainingViews,
  getExpiresAt,
} from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kv = await getKV();

    // Get paste from KV
    const pasteData = await kv.get(`paste:${id}`);
    if (!pasteData) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      );
    }

    let paste: Paste;
    try {
      paste = typeof pasteData === 'string' ? JSON.parse(pasteData) : pasteData;
    } catch (parseError) {
      console.error('Error parsing paste data:', parseError);
      return NextResponse.json(
        { error: 'Invalid paste data' },
        { status: 500 }
      );
    }

    // Check TEST_MODE
    const testMode = process.env.TEST_MODE === '1';
    const testNowMs = request.headers.get('x-test-now-ms');
    const currentTime = getCurrentTime(testMode, testNowMs || undefined);

    // Check if paste is available (before incrementing)
    if (!isPasteAvailable(paste, currentTime)) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      );
    }

    // Increment view count
    paste.views += 1;
    await kv.set(`paste:${id}`, JSON.stringify(paste));

    const response: GetPasteResponse = {
      content: paste.content,
      remaining_views: getRemainingViews(paste),
      expires_at: getExpiresAt(paste),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

