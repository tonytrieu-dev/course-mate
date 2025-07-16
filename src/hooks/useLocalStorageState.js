import { useState, useCallback } from 'react';

/**
 * Performance-optimized localStorage hook with batching and error handling
 * @param {string} key - localStorage key
 * @param {any} defaultValue - default value if key doesn't exist
 * @returns {[value, setValue]} - current value and setter function
 */
export const useLocalStorageState = (key, defaultValue) => {
  // Initialize state with memoized localStorage read
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Memoized setter with error handling
  const setValue = useCallback((value) => {
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
 * Performance-optimized hook for managing multiple localStorage font sizes
 * @param {Object} defaults - object with key-value pairs for default font sizes
 * @returns {Object} - object with font sizes and setters
 */
export const useFontSizes = (defaults) => {
  const fontSizes = {};
  const setters = {};

  Object.entries(defaults).forEach(([sizeName, defaultValue]) => {
    const [size, setSize] = useLocalStorageState(`${sizeName}FontSize`, defaultValue);
    fontSizes[sizeName] = size;
    setters[`set${sizeName.charAt(0).toUpperCase() + sizeName.slice(1)}Size`] = setSize;
  });

  return { ...fontSizes, ...setters };
};