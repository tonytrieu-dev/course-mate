// Authentication utility functions

// Common authentication error handling pattern
export const handleAuthError = (error, operation, setAuthError, logger) => {
  const errorMessage = error.message || 'An error occurred';
  if (logger) {
    logger.error(`${operation} failed`, { error: errorMessage });
  }
  if (setAuthError) {
    setAuthError(errorMessage);
  }
  return errorMessage;
};

// Common sync operation wrapper
export const withSyncOperation = async (operation, setSyncing, setLastCalendarSyncTimestamp) => {
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

// Authentication state validation
export const validateAuthState = (user, isAuthenticated, loading) => {
  if (loading) return { isValid: false, reason: 'loading' };
  if (!isAuthenticated || !user) return { isValid: false, reason: 'unauthenticated' };
  if (!user.id) return { isValid: false, reason: 'invalid_user' };
  return { isValid: true };
};