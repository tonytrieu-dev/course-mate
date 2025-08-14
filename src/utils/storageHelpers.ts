/**
 * Storage utilities for localStorage operations with TypeScript generic support
 */

import { logger } from './logger';

/**
 * Retrieves data from localStorage with type safety
 * @param key - The localStorage key to retrieve
 * @param defaultValue - The default value to return if key doesn't exist or parsing fails
 * @returns The parsed data of type T or the default value
 */
export const getLocalData = <T = unknown>(key: string, defaultValue: T = [] as T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    logger.error('Error parsing localStorage data', { key, error: error instanceof Error ? error.message : String(error) });
    return defaultValue;
  }
};

/**
 * Saves data to localStorage with JSON serialization
 * @param key - The localStorage key to save to
 * @param data - The data to save (will be JSON stringified)
 * @returns True if successful, false if an error occurred
 */
export const saveLocalData = (key: string, data: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error('Error saving to localStorage', { key, error: error instanceof Error ? error.message : String(error) });
    return false;
  }
};

/**
 * Removes a key from localStorage
 * @param key - The localStorage key to remove
 * @returns True if successful, false if an error occurred
 */
export const removeLocalData = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logger.error('Error removing localStorage key', { key, error: error instanceof Error ? error.message : String(error) });
    return false;
  }
};

/**
 * Clears all localStorage data
 * @returns True if successful, false if an error occurred
 */
export const clearLocalData = (): boolean => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    logger.error('Error clearing localStorage', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
};

/**
 * Clears all user-specific data and resets application state to blank slate
 * This function should be called on logout and before new user registration
 * to prevent data leakage between user sessions
 * @returns True if successful, false if an error occurred
 */
export const clearLocalUserData = async (): Promise<boolean> => {
  try {
    // Reset all in-memory service states to prevent data leakage
    try {
      const { default: taskService } = await import('../services/taskService');
      taskService.reset();
      logger.debug('TaskService reset successfully');
    } catch (error) {
      logger.warn('Could not reset taskService:', error);
    }

    try {
      const { default: classService } = await import('../services/classService');
      classService.reset();
      logger.debug('ClassService reset successfully');
    } catch (error) {
      logger.warn('Could not reset classService:', error);
    }

    try {
      const { default: taskTypeService } = await import('../services/taskTypeService');
      taskTypeService.reset();
      logger.debug('TaskTypeService reset successfully');
    } catch (error) {
      logger.warn('Could not reset taskTypeService:', error);
    }

    // Clear all user-specific localStorage keys
    const userDataKeys = [
      // Core application data (matches STORAGE_KEYS from database.ts)
      'calendar_tasks',
      'calendar_classes', 
      'calendar_task_types',
      'calendar_settings',
      
      // Canvas integration data
      'canvas_calendar_url',
      'canvas_auto_sync',
      
      // User preferences and session data
      'userDisplayName',
      'last_sync_timestamp',
      
      // Note: We preserve theme preferences as they're not user-data specific
    ];

    userDataKeys.forEach(key => {
      localStorage.removeItem(key);
      logger.debug(`Removed localStorage key: ${key}`);
    });

    logger.info('Local user data and application state have been cleared successfully');
    return true;
  } catch (error) {
    logger.error('Error during local data cleanup:', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
};