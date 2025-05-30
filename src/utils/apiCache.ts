import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export class ApiCache {
  private static instance: ApiCache;
  private cache: Map<string, CacheEntry> = new Map();

  private constructor() {}

  static getInstance(): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache();
    }
    return ApiCache.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const cachedEntry = this.cache.get(key);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
      return cachedEntry.data as T;
    }

    // Try persistent storage
    try {
      const storedData = await AsyncStorage.getItem(`@api_cache_${key}`);
      if (storedData) {
        const entry: CacheEntry = JSON.parse(storedData);
        if (Date.now() - entry.timestamp < CACHE_DURATION) {
          // Update memory cache
          this.cache.set(key, entry);
          return entry.data as T;
        }
      }
    } catch (error) {
      console.warn('Failed to read from AsyncStorage:', error);
    }

    return null;
  }

  async set(key: string, data: any): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
    };

    // Update memory cache
    this.cache.set(key, entry);

    // Update persistent storage
    try {
      await AsyncStorage.setItem(`@api_cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to write to AsyncStorage:', error);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@api_cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear AsyncStorage cache:', error);
    }
  }
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retryCount >= MAX_RETRIES) {
      throw error;
    }

    // Check if it's a rate limit error
    const isRateLimit = error.response?.status === 429;
    const delay = isRateLimit
      ? INITIAL_RETRY_DELAY * Math.pow(2, retryCount) // Exponential backoff for rate limits
      : INITIAL_RETRY_DELAY * (retryCount + 1); // Linear backoff for other errors

    await sleep(delay);
    return withRetry(operation, retryCount + 1);
  }
} 