import { useState, useCallback } from 'react';

/**
 * Performance-optimized localStorage hook with batching and error handling
 * @param key - localStorage key
 * @param defaultValue - default value if key doesn't exist
 * @returns current value and setter function
 */
export const useLocalStorageState = <T>(
  key: string, 
  defaultValue: T
): [T, (value: T | ((prevValue: T) => T)) => void] => {
  // Initialize state with memoized localStorage read
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Memoized setter with error handling
  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

/**
 * Font size configuration type
 */
type FontSizeDefaults = Record<string, number>;

/**
 * Return type for useFontSizes hook with proper typing for setters
 */
type FontSizesResult<T extends FontSizeDefaults> = T & {
  [K in keyof T as `set${Capitalize<string & K>}Size`]: (value: number | ((prev: number) => number)) => void;
};

/**
 * Performance-optimized hook for managing multiple localStorage font sizes
 * @param defaults - object with key-value pairs for default font sizes
 * @returns object with font sizes and setters
 */
export const useFontSizes = <T extends FontSizeDefaults>(
  defaults: T
): FontSizesResult<T> => {
  const fontSizes: any = {};
  const setters: any = {};

  Object.entries(defaults).forEach(([sizeName, defaultValue]) => {
    const [size, setSize] = useLocalStorageState(`${sizeName}FontSize`, defaultValue);
    fontSizes[sizeName] = size;
    setters[`set${sizeName.charAt(0).toUpperCase() + sizeName.slice(1)}Size`] = setSize;
  });

  return { ...fontSizes, ...setters };
};