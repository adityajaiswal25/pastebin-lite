import { NextRequest, NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';
import { generateId } from '@/lib/utils';
import { CreatePasteRequest, CreatePasteResponse, Paste } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreatePasteRequest = await request.json();

    // Validate content
    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate ttl_seconds
    if (body.ttl_seconds !== undefined) {
      if (typeof body.ttl_seconds !== 'number' || !Number.isInteger(body.ttl_seconds) || body.ttl_seconds < 1) {
        return NextResponse.json(
          { error: 'ttl_seconds must be an integer >= 1' },
          { status: 400 }
        );
      }
    }

    // Validate max_views
    if (body.max_views !== undefined) {
      if (typeof body.max_views !== 'number' || !Number.isInteger(body.max_views) || body.max_views < 1) {
        return NextResponse.json(
          { error: 'max_views must be an integer >= 1' },
          { status: 400 }
        );
      }
    }

    // Create paste
    const id = generateId();
    const paste: Paste = {
      id,
      content: body.content,
      createdAt: Date.now(),
      ttlSeconds: body.ttl_seconds,
      maxViews: body.max_views,
      views: 0,
    };

    const kv = await getKV();
    await kv.set(`paste:${id}`, JSON.stringify(paste));

    // Get base URL from request
    const baseUrl = request.nextUrl.origin;
    const url = `${baseUrl}/p/${id}`;

    const response: CreatePasteResponse = {
      id,
      url,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

