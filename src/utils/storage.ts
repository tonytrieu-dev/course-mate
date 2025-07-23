/**
 * Optimized localStorage utility with error handling and caching
 */
import { logger } from './logger';

/**
 * Batch operation types
 */
interface BatchOperation {
  type: 'set' | 'get' | 'remove';
  key: string;
  value?: unknown;
}

/**
 * Storage usage information
 */
interface StorageUsageInfo {
  used: number;
  available: number;
  percentage: number;
}

/**
 * Storage listener callback type
 */
type StorageListener<T = unknown> = (value: T, key: string) => void;

/**
 * Storage manager class with caching and error handling
 */
class Storage {
  private cache: Map<string, unknown>;
  private listeners: Map<string, StorageListener<unknown>[]>;

  // Constants for storage keys
  static KEYS = {
    TASKS: 'calendar_tasks',
    CLASSES: 'calendar_classes',
    TASK_TYPES: 'calendar_task_types',
    SETTINGS: 'calendar_settings',
    CANVAS_URL: 'canvas_calendar_url',
    CANVAS_AUTO_SYNC: 'canvas_auto_sync',
    LAST_SYNC: 'last_sync_timestamp'
  } as const;

  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  // Check if localStorage is available
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      logger.warn('localStorage is not available');
      return false;
    }
  }

  // Get item with caching and error handling
  getItem<T = unknown>(key: string, defaultValue: T | null = null): T | null {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        return this.cache.get(key) as T;
      }

      if (!this.isAvailable()) {
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      const parsed = JSON.parse(item) as T;
      this.cache.set(key, parsed);
      return parsed;
    } catch (error) {
      logger.error(`Error getting item from storage: ${key}`, { error: (error as Error).message });
      return defaultValue;
    }
  }

  // Set item with caching and error handling
  setItem<T = unknown>(key: string, value: T): boolean {
    try {
      if (!this.isAvailable()) {
        logger.warn('localStorage not available, storing in memory cache only');
        this.cache.set(key, value);
        return false;
      }

      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      this.cache.set(key, value);
      
      // Notify listeners
      this.notifyListeners(key, value);
      return true;
    } catch (error) {
      logger.error(`Error setting item in storage: ${key}`, { error: (error as Error).message });
      return false;
    }
  }

  // Remove item
  removeItem(key: string): boolean {
    try {
      if (this.isAvailable()) {
        localStorage.removeItem(key);
      }
      this.cache.delete(key);
      this.notifyListeners(key, null);
      return true;
    } catch (error) {
      logger.error(`Error removing item from storage: ${key}`, { error: (error as Error).message });
      return false;
    }
  }

  // Clear all storage
  clear(): boolean {
    try {
      if (this.isAvailable()) {
        localStorage.clear();
      }
      this.cache.clear();
      return true;
    } catch (error) {
      logger.error('Error clearing storage', { error: (error as Error).message });
      return false;
    }
  }

  // Batch operations for better performance
  batch(operations: BatchOperation[]): (boolean | unknown)[] {
    const results: (boolean | unknown)[] = [];
    
    for (const { type, key, value } of operations) {
      switch (type) {
        case 'set':
          results.push(this.setItem(key, value));
          break;
        case 'get':
          results.push(this.getItem(key, value)); // value is defaultValue here
          break;
        case 'remove':
          results.push(this.removeItem(key));
          break;
        default:
          logger.warn(`Unknown batch operation type: ${type}`);
          results.push(false);
      }
    }
    
    return results;
  }

  // Add listener for storage changes
  addListener(key: string, callback: StorageListener): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);
  }

  // Remove listener
  removeListener(key: string, callback: StorageListener): void {
    if (this.listeners.has(key)) {
      const listeners = this.listeners.get(key)!;
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Notify listeners of changes
  private notifyListeners(key: string, value: unknown): void {
    if (this.listeners.has(key)) {
      this.listeners.get(key)!.forEach(callback => {
        try {
          callback(value, key);
        } catch (error) {
          logger.error('Error in storage listener', { error: (error as Error).message });
        }
      });
    }
  }

  // Get storage usage info
  getUsageInfo(): StorageUsageInfo {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage.getItem(key)!.length;
        }
      }

      const available = 5 * 1024 * 1024; // 5MB typical limit
      const percentage = Math.round((used / available) * 100);

      return { used, available, percentage };
    } catch (error) {
      logger.error('Error getting storage usage info', { error: (error as Error).message });
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}

// Create singleton instance
export const storage = new Storage();
export default storage;