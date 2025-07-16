import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

export const signUp = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        logger.error('Authentication signup failed', { error: error.message });
        throw error;
    }
};

export const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Authentication signin failed', { error: error.message });
      throw error;
    }
};

export const signOut = async () => {
  try {
    // Perform Supabase signout first to invalidate server-side session
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Authentication signout failed', { error: error.message });
      throw error;
    }

    // Clear local storage items only after successful server signout
    try {
      // Clear all potential auth-related items
      const authKeys = [
        'supabase.auth.token',
        'sb-supabase-auth-token',
        'sb-auth-token'
      ];
      
      authKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Verify token removal
      const remainingTokens = authKeys.filter(key => localStorage.getItem(key));
      if (remainingTokens.length > 0) {
        logger.warn('Some auth tokens may not have been cleared', { remainingTokens });
      }
      
    } catch (storageError) {
      logger.warn('Local storage cleanup failed', { error: storageError.message });
      // Don't throw - signout was successful on server
    }

    logger.auth('User signed out successfully');
    return true;
  } catch (error) {
    logger.error('Authentication signout error', { error: error.message });
    throw error;
  }
};

export const getCurrentUser = async () => {
    logger.debug('getCurrentUser called');
    try {
      logger.debug('Calling supabase.auth.getUser()');
      const { data: { user }, error } = await supabase.auth.getUser(); // Also capture error here for logging
      
      if (error) {
        // This error object might be different from a thrown error caught by the catch block
        logger.error('Auth user fetch returned error', { error: error.message });
        // We still want to fall through to the return user (which might be null if error is present)
        // or let the catch block handle it if it throws.
      }
      
      logger.debug('User fetch completed', { hasUser: !!user });
      return user;
    } catch (error) {
      logger.error('Auth user fetch failed', { error: error.message });
      return null;
    }
};

export const isAuthenticated = async () => {
    const user = await getCurrentUser();
    return !!user;
};
