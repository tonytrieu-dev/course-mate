/**
 * Cache utilities for managing in-memory cache with TTL
 */

/**
 * Cache entry structure
 */
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

/**
 * Cache manager class for in-memory caching with TTL support
 */
export class CacheManager {
  private cache: Map<string, CacheEntry>;
  private defaultTTL: number;
  private maxSize: number;

  constructor(defaultTTL: number = 5 * 60 * 1000, maxSize: number = 100) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  getCacheKey(operation: string, userId: string, params: Record<string, any> = {}): string {
    return `${operation}_${userId}_${JSON.stringify(params)}`;
  }

  get<T = any>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.defaultTTL) {
      return cached.data as T;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  set<T = any>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    this.cleanup();
  }

  cleanup(): void {
    if (this.cache.size > this.maxSize) {
      const now = Date.now();
      const keysToDelete: string[] = [];
      this.cache.forEach((v, k) => {
        if (now - v.timestamp > this.defaultTTL) {
          keysToDelete.push(k);
        }
      });
      keysToDelete.forEach(k => this.cache.delete(k));
    }
  }

  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(k => this.cache.delete(k));
  }

  clear(): void {
    this.cache.clear();
  }
}

// Export a default instance
export const defaultCache = new CacheManager();