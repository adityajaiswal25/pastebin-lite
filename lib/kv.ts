import { kv } from '@vercel/kv';
import { Redis } from '@upstash/redis';

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

// Create a unified interface for KV operations
interface KVClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<string>;
  del: (key: string) => Promise<number>;
  exists: (key: string) => Promise<number>;
}

// Lazy initialize Upstash Redis client
let upstashClient: Redis | null = null;

function getUpstashClient(): Redis | null {
  if (upstashClient) return upstashClient;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (url && token) {
    try {
      upstashClient = new Redis({
        url,
        token,
      });
      return upstashClient;
    } catch (error) {
      console.error('Error creating Upstash Redis client:', error);
      return null;
    }
  }
  
  return null;
}

export async function getKV(): Promise<KVClient> {
  try {
    // Check for Vercel KV environment variables
    const hasVercelKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
    
    // Check for Upstash Redis environment variables (when using Marketplace)
    const hasUpstashRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // If Vercel KV is configured, use it
    if (hasVercelKV) {
      return {
        get: async (key: string) => {
          const result = await kv.get(key);
          return result ? String(result) : null;
        },
        set: async (key: string, value: string) => {
          await kv.set(key, value);
          return 'OK';
        },
        del: async (key: string) => {
          await kv.del(key);
          return 1;
        },
        exists: async (key: string) => {
          const result = await kv.exists(key);
          return result ? 1 : 0;
        },
      };
    }
    
    // If Upstash Redis is configured, use it
    if (hasUpstashRedis) {
      const client = getUpstashClient();
      if (client) {
        return {
          get: async (key: string) => {
            const result = await client.get(key);
            return result ? String(result) : null;
          },
          set: async (key: string, value: string) => {
            await client.set(key, value);
            return 'OK';
          },
          del: async (key: string) => {
            await client.del(key);
            return 1;
          },
          exists: async (key: string) => {
            const result = await client.exists(key);
            return result ? 1 : 0;
          },
        };
      }
    }
    
    // Fallback to in-memory store for local development
    console.warn('Using in-memory fallback store. KV not configured.');
    return {
      get: async (key: string) => {
        const value = fallbackStore.get(key);
        return value ? String(value) : null;
      },
      set: async (key: string, value: string) => {
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
    console.error('Error initializing KV:', error);
    // If KV is not available, use fallback
    return {
      get: async (key: string) => {
        const value = fallbackStore.get(key);
        return value ? String(value) : null;
      },
      set: async (key: string, value: string) => {
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

