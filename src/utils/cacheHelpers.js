/**
 * Cache utilities for managing in-memory cache with TTL
 */

export class CacheManager {
  constructor(defaultTTL = 5 * 60 * 1000, maxSize = 100) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  getCacheKey(operation, userId, params = {}) {
    return `${operation}_${userId}_${JSON.stringify(params)}`;
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.defaultTTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
    this.cleanup();
  }

  cleanup() {
    if (this.cache.size > this.maxSize) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > this.defaultTTL) {
          this.cache.delete(k);
        }
      }
    }
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

// Export a default instance
export const defaultCache = new CacheManager();