import type { User, AuthResponse as SupabaseAuthResponse } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { withSupabaseQuery } from '../utils/serviceHelpers';
import { errorHandler, ERROR_CODES } from '../utils/errorHandler';
import type { 
  AuthResponse, 
  SignUpCredentials, 
  SignInCredentials, 
  ServiceError 
} from '../types/service';

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const result = await supabase.auth.signUp({ email, password });
    
    if (result.error) {
      throw errorHandler.auth.invalidCredentials({
        operation: 'signUp',
        originalError: result.error.message,
        email: email ? 'provided' : 'missing'
      });
    }
    
    return {
      user: result.data.user,
      session: result.data.session,
      error: result.error
    };
  } catch (error: any) {
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

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    if (result.error) {
      throw errorHandler.auth.invalidCredentials({
        operation: 'signIn',
        originalError: result.error.message,
        email: email ? 'provided' : 'missing'
      });
    }
    
    return {
      user: result.data.user,
      session: result.data.session,
      error: result.error
    };
  } catch (error: any) {
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

export const signOut = async (): Promise<boolean> => {
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
      
    } catch (storageError: any) {
      logger.warn('Local storage cleanup failed', { error: storageError.message });
      // Don't throw - signout was successful on server
    }

    logger.auth('User signed out successfully');
    return true;
  } catch (error: any) {
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

export const getCurrentUser = async (): Promise<User | null> => {
  logger.debug('getCurrentUser called');
  try {
    const result = await supabase.auth.getUser();
    
    if (result.error) {
      logger.warn('Failed to get current user:', result.error.message);
      return null;
    }
    
    const user = result.data.user || null;
    logger.debug('User fetch completed', { hasUser: !!user });
    return user;
  } catch (error: any) {
    const handled = errorHandler.handle(
      error,
      'getCurrentUser',
      { operation: 'getCurrentUser' }
    );
    logger.warn(`Failed to get current user: ${handled.userMessage}`);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};

// Type-safe credential validation
export const validateCredentials = (credentials: SignUpCredentials | SignInCredentials): boolean => {
  return !!(credentials.email && credentials.password);
};

// Enhanced error handling with typed errors
export const handleAuthError = (error: any, operation: string): ServiceError => {
  const handled = errorHandler.handle(error, operation);
  return {
    name: 'ServiceError',
    message: handled.userMessage,
    code: handled.code,
    operation: operation,
    context: handled.context
  };
};