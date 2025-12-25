// Data caching utility for API responses

interface CacheEntry {
  data: unknown;
  timestamp: number;
  expiry: number;
}

class DataCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 60 * 1000; // 1 minute default

  // Generate cache key from URL
  private getCacheKey(url: string): string {
    return `api_cache_${url}`;
  }

  // Get cached data if still valid
  get(url: string): unknown | null {
    const key = this.getCacheKey(url);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Set cache with TTL
  set(url: string, data: unknown, ttl?: number): void {
    const key = this.getCacheKey(url);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  // Clear specific cache entry
  clear(url: string): void {
    const key = this.getCacheKey(url);
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
  }

  // Check if cache exists and is valid
  has(url: string): boolean {
    const key = this.getCacheKey(url);
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.timestamp + entry.expiry;
  }
}

export const dataCache = new DataCache();

