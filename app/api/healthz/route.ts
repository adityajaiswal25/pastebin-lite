import { NextResponse } from 'next/server';
import { isKVAvailable } from '@/lib/kv';

export async function GET() {
  try {
    const kvAvailable = await isKVAvailable();
    return NextResponse.json({ ok: kvAvailable }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

