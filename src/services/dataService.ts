// Re-export all operations from modular services
export {
  getTasks,
  addTask,
  updateTask,
  deleteTask
} from './task/taskOperations';

export {
  getClasses,
  addClass,
  updateClass,
  deleteClass
} from './class/classOperations';

export {
  getTaskTypes,
  addTaskType,
  updateTaskType,
  deleteTaskType
} from './taskType/taskTypeOperations';

export {
  getSettings,
  updateSettings
} from './settings/settingsOperations';

// Legacy exports for backwards compatibility
import { generateUniqueId } from "../utils/idHelpers";
import { defaultCache } from "../utils/cacheHelpers";
import { createSupabaseHelper } from "../utils/supabaseHelpers";
import { logger } from "../utils/logger";
import type {
  QueryOptions,
  ServiceError,
  CacheOptions,
  BulkOperationResult,
  FileUploadData
} from '../types/service';

// Create Supabase helpers for each table
const tasksHelper = createSupabaseHelper('tasks');
const classesHelper = createSupabaseHelper('classes');
const taskTypesHelper = createSupabaseHelper('task_types');

// Cache helper functions
export const getCacheKey = (operation: string, userId: string, params: Record<string, unknown> = {}): string => {
  return defaultCache.getCacheKey(operation, userId, params);
};

export const getCachedData = <T>(key: string): T | null => {
  return defaultCache.get(key);
};

export const setCachedData = <T>(key: string, data: T): void => {
  defaultCache.set(key, data);
};

export const invalidateCache = (pattern: string): void => {
  defaultCache.invalidate(pattern);
  logger.debug('Cache invalidated', { pattern });
};

// Export the generateUniqueId for backwards compatibility
export { generateUniqueId } from "../utils/idHelpers";