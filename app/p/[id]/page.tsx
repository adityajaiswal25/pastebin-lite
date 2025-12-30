import { headers } from 'next/headers';
import { getKV } from '@/lib/kv';
import { Paste } from '@/lib/types';
import {
  getCurrentTime,
  isPasteAvailable,
} from '@/lib/utils';
import { notFound } from 'next/navigation';

async function getPaste(id: string): Promise<Paste | null> {
  try {
    const kv = await getKV();
    const pasteData = await kv.get(`paste:${id}`);
    
    if (!pasteData) {
      return null;
    }

    let paste: Paste;
    try {
      paste = typeof pasteData === 'string' ? JSON.parse(pasteData) : pasteData;
    } catch (parseError) {
      console.error('Error parsing paste data:', parseError);
      return null;
    }

    // Check TEST_MODE
    const testMode = process.env.TEST_MODE === '1';
    const headersList = await headers();
    const testNowMs = headersList.get('x-test-now-ms');
    const currentTime = getCurrentTime(testMode, testNowMs || undefined);

    // Check if paste is available (before incrementing)
    if (!isPasteAvailable(paste, currentTime)) {
      return null;
    }

    // Increment view count
    paste.views += 1;
    await kv.set(`paste:${id}`, JSON.stringify(paste));

    return paste;
  } catch (error) {
    console.error('Error getting paste:', error);
    return null;
  }
}

export default async function PastePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paste = await getPaste(id);

  if (!paste) {
    notFound();
  }

  // Escape HTML to prevent XSS
  const escapeHtml = (text: string) => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Paste</h1>
          <div className="bg-gray-100 rounded p-4 font-mono text-sm text-gray-900 whitespace-pre-wrap break-words">
            {escapeHtml(paste.content)}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <a href="/" className="text-blue-600 hover:underline">
              Create a new paste
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

