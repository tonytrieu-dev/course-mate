// Service utility functions for common patterns

import { logger } from './logger';

// Common Supabase query with error handling
export const withSupabaseQuery = async (queryFn, fallbackData = null, operation = 'query') => {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      logger.error(`Supabase ${operation} failed`, { error: error.message });
      return fallbackData;
    }
    
    return data;
  } catch (error) {
    logger.error(`${operation} error`, { error: error.message });
    return fallbackData;
  }
};

// Common local storage operations
export const getLocalData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    logger.error('Local storage get error', { key, error: error.message });
    return defaultValue;
  }
};

export const saveLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error('Local storage save error', { key, error: error.message });
    return false;
  }
};

// Common cache operations
export const createCache = (ttl = 5 * 60 * 1000) => {
  const cache = new Map();
  
  const getCacheKey = (operation, userId, params = {}) => {
    return `${operation}_${userId}_${JSON.stringify(params)}`;
  };
  
  const get = (key) => {
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
  
  const set = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
    if (cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of cache.entries()) {
        if (now - v.timestamp > ttl) {
          cache.delete(k);
        }
      }
    }
  };
  
  const invalidate = (pattern) => {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
    logger.debug('Cache invalidated', { pattern });
  };
  
  return { getCacheKey, get, set, invalidate };
};

// Common data transformation patterns
export const withUserData = (data, userId) => ({
  ...data,
  user_id: userId,
  created_at: data.created_at || new Date().toISOString(),
});

export const withTimestamp = (data) => ({
  ...data,
  updated_at: new Date().toISOString(),
});

// Common CRUD operation patterns
export const createCRUDService = (tableName, localStorageKey, cache) => {
  const get = async (userId, useSupabase = false) => {
    if (useSupabase && userId) {
      const cacheKey = cache.getCacheKey('get', userId);
      const cachedData = cache.get(cacheKey);
      if (cachedData) return cachedData;
      
      const data = await withSupabaseQuery(
        () => supabase.from(tableName).select('*').eq('user_id', userId),
        getLocalData(localStorageKey),
        `get ${tableName}`
      );
      
      cache.set(cacheKey, data);
      return data;
    }
    return getLocalData(localStorageKey);
  };
  
  return { get };
};