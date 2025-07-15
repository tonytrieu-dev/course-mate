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
    // First clear any local storage items that might be related to auth
    localStorage.removeItem('supabase.auth.token');
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Authentication signout failed', { error: error.message });
      throw error;
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
