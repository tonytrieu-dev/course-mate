/**
 * Centralized utilities export
 */

// Storage utilities
export { 
  getLocalData, 
  saveLocalData, 
  removeLocalData, 
  clearLocalData 
} from './storageHelpers';

// Cache utilities
export { 
  CacheManager, 
  defaultCache 
} from './cacheHelpers';

// ID generation utilities
export {
  generateUniqueId,
  generateIdFromName,
  generateClassId,
  generateTypeId
} from './idHelpers';

// Supabase utilities
export {
  SupabaseHelper,
  createSupabaseHelper,
  checkUserDataExists,
  batchUpsert
} from './supabaseHelpers';

// Existing utilities re-exported for convenience
export * from './logger';
export * from './errorHandler';
export * from './authHelpers';
export * from './serviceHelpers';
export * from './validation';
export * from './dateHelpers';
export * from './styleHelpers';
export * from './taskStyles';
export * from './storage';