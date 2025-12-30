import { kv } from '@vercel/kv';

// For local development, we'll use a fallback in-memory store
// In production on Vercel, KV will be configured via environment variables
// Using a global variable to ensure persistence across requests in the same process
declare global {
  // eslint-disable-next-line no-var
  var __fallbackStore: Map<string, any> | undefined;
}

const fallbackStore = global.__fallbackStore || new Map<string, any>();
if (!global.__fallbackStore) {
  global.__fallbackStore = fallbackStore;
}

export async function getKV() {
  try {
    // Try to use Vercel KV if configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      return kv;
    }
    // Fallback to in-memory store for local development
    return {
      get: async (key: string) => fallbackStore.get(key),
      set: async (key: string, value: any) => {
        fallbackStore.set(key, value);
        return 'OK';
      },
      del: async (key: string) => {
        fallbackStore.delete(key);
        return 1;
      },
      exists: async (key: string) => (fallbackStore.has(key) ? 1 : 0),
    };
  } catch (error) {
    // If KV is not available, use fallback
    return {
      get: async (key: string) => fallbackStore.get(key),
      set: async (key: string, value: any) => {
        fallbackStore.set(key, value);
        return 'OK';
      },
      del: async (key: string) => {
        fallbackStore.delete(key);
        return 1;
      },
      exists: async (key: string) => (fallbackStore.has(key) ? 1 : 0),
    };
  }
}

export async function isKVAvailable(): Promise<boolean> {
  try {
    const kvClient = await getKV();
    await kvClient.exists('health-check');
    return true;
  } catch {
    return false;
  }
}

