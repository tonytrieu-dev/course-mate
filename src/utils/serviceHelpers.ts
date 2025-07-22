// Service utility functions for common patterns

import type { Database } from '../services/supabaseClient';
import { supabase } from '../services/supabaseClient';
import { logger } from './logger';

// Type for Supabase query functions
type SupabaseQueryFn<T = any> = () => Promise<{ data: T | null; error: any }>;

// Cache item interface
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Cache interface
interface Cache {
  getCacheKey: (operation: string, userId: string, params?: Record<string, any>) => string;
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T) => void;
  invalidate: (pattern: string) => void;
}

// CRUD service interface
interface CRUDService<T> {
  get: (userId: string, useSupabase?: boolean) => Promise<T[]>;
}

// Common Supabase query with error handling
export const withSupabaseQuery = async <T>(
  queryFn: SupabaseQueryFn<T>, 
  fallbackData: T | null = null, 
  operation = 'query'
): Promise<T | null> => {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      logger.error(`Supabase ${operation} failed`, { error: error.message });
      return fallbackData;
    }
    
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`${operation} error`, { error: errorMessage });
    return fallbackData;
  }
};

// Common local storage operations
export const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Local storage get error', { key, error: errorMessage });
    return defaultValue;
  }
};

export const saveLocalData = (key: string, data: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Local storage save error', { key, error: errorMessage });
    return false;
  }
};

// Common cache operations
export const createCache = (ttl: number = 5 * 60 * 1000): Cache => {
  const cache = new Map<string, CacheItem<any>>();
  
  const getCacheKey = (operation: string, userId: string, params: Record<string, any> = {}): string => {
    return `${operation}_${userId}_${JSON.stringify(params)}`;
  };
  
  const get = <T>(key: string): T | null => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      logger.debug('Cache hit', { key });
      return cached.data;
    }
    if (cached) {
      cache.delete(key);
    }
    return null;
  };
  
  const set = <T>(key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() });
    if (cache.size > 100) {
      const now = Date.now();
      const entries = Array.from(cache.entries());
      for (const [k, v] of entries) {
        if (now - v.timestamp > ttl) {
          cache.delete(k);
        }
      }
    }
  };
  
  const invalidate = (pattern: string): void => {
    const keys = Array.from(cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
    logger.debug('Cache invalidated', { pattern });
  };
  
  return { getCacheKey, get, set, invalidate };
};

// Common data transformation patterns
export const withUserData = <T extends Record<string, any>>(data: T, userId: string): T & {
  user_id: string;
  created_at: string;
} => ({
  ...data,
  user_id: userId,
  created_at: data.created_at || new Date().toISOString(),
});

export const withTimestamp = <T extends Record<string, any>>(data: T): T & {
  updated_at: string;
} => ({
  ...data,
  updated_at: new Date().toISOString(),
});

// Common CRUD operation patterns
export const createCRUDService = <T>(
  tableName: string, 
  localStorageKey: string, 
  cache: Cache
): CRUDService<T> => {
  const get = async (userId: string, useSupabase = false): Promise<T[]> => {
    if (useSupabase && userId) {
      const cacheKey = cache.getCacheKey('get', userId);
      const cachedData = cache.get<T[]>(cacheKey);
      if (cachedData) return cachedData;
      
      const data = await withSupabaseQuery(
        async () => supabase.from(tableName).select('*').eq('user_id', userId),
        getLocalData<T[]>(localStorageKey, []),
        `get ${tableName}`
      );
      
      cache.set(cacheKey, data);
      return data || [];
    }
    return getLocalData<T[]>(localStorageKey, []);
  };
  
  return { get };
};