// Authentication utility functions

import type { User } from '@supabase/supabase-js';

/**
 * Logger interface for authentication operations
 */
interface Logger {
  error: (message: string, context?: any) => void;
}

/**
 * Authentication state validation result
 */
interface AuthStateValidation {
  isValid: boolean;
  reason?: 'loading' | 'unauthenticated' | 'invalid_user';
}

/**
 * Common authentication error handling pattern
 */
export const handleAuthError = (
  error: Error | { message?: string },
  operation: string,
  setAuthError?: (error: string) => void,
  logger?: Logger
): string => {
  const errorMessage = error.message || 'An error occurred';
  if (logger) {
    logger.error(`${operation} failed`, { error: errorMessage });
  }
  if (setAuthError) {
    setAuthError(errorMessage);
  }
  return errorMessage;
};

/**
 * Common sync operation wrapper
 */
export const withSyncOperation = async <T>(
  operation: () => Promise<T>,
  setSyncing: (syncing: boolean) => void,
  setLastCalendarSyncTimestamp?: (timestamp: number) => void
): Promise<T> => {
  setSyncing(true);
  try {
    const result = await operation();
    if (result && setLastCalendarSyncTimestamp) {
      setLastCalendarSyncTimestamp(Date.now());
    }
    return result;
  } finally {
    setSyncing(false);
  }
};

/**
 * Authentication state validation
 */
export const validateAuthState = (
  user: User | null,
  isAuthenticated: boolean,
  loading: boolean
): AuthStateValidation => {
  if (loading) return { isValid: false, reason: 'loading' };
  if (!isAuthenticated || !user) return { isValid: false, reason: 'unauthenticated' };
  if (!user.id) return { isValid: false, reason: 'invalid_user' };
  return { isValid: true };
};