import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { withSupabaseQuery } from '../utils/serviceHelpers';
import { errorHandler, ERROR_CODES } from '../utils/errorHandler';

export const signUp = async (email, password) => {
    try {
        const data = await withSupabaseQuery(
            () => supabase.auth.signUp({ email, password }),
            null,
            'signup'
        );
        
        if (!data) {
            throw errorHandler.auth.invalidCredentials({
                operation: 'signUp',
                email: email ? 'provided' : 'missing'
            });
        }
        return data;
    } catch (error) {
        // If it's already a ServiceError, just re-throw it
        if (error.name === 'ServiceError') {
            throw error;
        }
        
        const handled = errorHandler.handle(
            error,
            'signUp',
            { email: email ? 'provided' : 'missing' }
        );
        
        // Create appropriate auth error based on message
        const message = error.message?.toLowerCase() || '';
        if (message.includes('email already registered') || message.includes('already exists')) {
            throw errorHandler.auth.invalidCredentials({
                operation: 'signUp',
                reason: 'Email already exists',
                originalError: error.message
            });
        } else if (message.includes('password')) {
            throw errorHandler.auth.invalidCredentials({
                operation: 'signUp', 
                reason: 'Invalid password',
                originalError: error.message
            });
        }
        
        throw errorHandler.auth.invalidCredentials({
            operation: 'signUp',
            originalError: error.message
        });
    }
};

export const signIn = async (email, password) => {
    try {
      const data = await withSupabaseQuery(
          () => supabase.auth.signInWithPassword({ email, password }),
          null,
          'signin'
      );
      
      if (!data) {
        throw errorHandler.auth.invalidCredentials({
          operation: 'signIn',
          email: email ? 'provided' : 'missing'
        });
      }
      return data;
    } catch (error) {
      // If it's already a ServiceError, just re-throw it
      if (error.name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error,
        'signIn',
        { email: email ? 'provided' : 'missing' }
      );
      
      // Create appropriate auth error based on message
      const message = error.message?.toLowerCase() || '';
      if (message.includes('invalid login') || message.includes('invalid email')) {
        throw errorHandler.auth.invalidCredentials({
          operation: 'signIn',
          originalError: error.message
        });
      }
      
      throw errorHandler.auth.invalidCredentials({
        operation: 'signIn',
        originalError: error.message
      });
    }
};

export const signOut = async () => {
  try {
    // Perform Supabase signout first to invalidate server-side session
    const { error } = await supabase.auth.signOut();

    if (error) {
      const handled = errorHandler.handle(
        error,
        'signOut - Supabase operation'
      );
      throw errorHandler.auth.sessionExpired({
        operation: 'signOut',
        originalError: error.message
      });
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
    // If it's already a ServiceError, just re-throw it
    if (error.name === 'ServiceError') {
      throw error;
    }
    
    const handled = errorHandler.handle(
      error,
      'signOut - overall operation'
    );
    throw errorHandler.auth.sessionExpired({
      operation: 'signOut - overall',
      originalError: error.message
    });
  }
};

export const getCurrentUser = async () => {
    logger.debug('getCurrentUser called');
    try {
      const result = await withSupabaseQuery(
          () => supabase.auth.getUser(),
          null,
          'get current user'
      );
      
      const user = result?.user || null;
      logger.debug('User fetch completed', { hasUser: !!user });
      return user;
    } catch (error) {
      const handled = errorHandler.handle(
        error,
        'getCurrentUser',
        { operation: 'getCurrentUser' }
      );
      logger.warn(`Failed to get current user: ${handled.userMessage}`);
      return null;
    }
};

export const isAuthenticated = async () => {
    const user = await getCurrentUser();
    return !!user;
};
