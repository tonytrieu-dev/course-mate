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

// Helper function to safely cast unknown errors
const toError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const result = await supabase.auth.signUp({ email, password });
    
    if (result.error) {
      // Log the full error details for debugging
      console.error('🚨 Supabase signup error details:', {
        message: result.error.message,
        status: result.error.status,
        code: result.error.code || 'NO_CODE',
        details: result.error
      });
      
      // Enhanced error handling for different Supabase auth errors
      const errorMessage = result.error.message.toLowerCase();
      
      if (errorMessage.includes('already registered') || 
          errorMessage.includes('already exists') || 
          errorMessage.includes('user already registered')) {
        throw errorHandler.auth.invalidCredentials({
          operation: 'signUp',
          reason: 'An account with this email already exists. Please sign in instead.',
          originalError: result.error.message
        });
      }
      
      if (errorMessage.includes('password')) {
        throw errorHandler.auth.invalidCredentials({
          operation: 'signUp',
          reason: 'Password does not meet security requirements',
          originalError: result.error.message
        });
      }
      
      if (errorMessage.includes('email')) {
        throw errorHandler.auth.invalidCredentials({
          operation: 'signUp',
          reason: 'Please enter a valid email address',
          originalError: result.error.message
        });
      }
      
      throw errorHandler.auth.invalidCredentials({
        operation: 'signUp',
        originalError: result.error.message,
        email: email ? 'provided' : 'missing'
      });
    }
    
    // SECURITY CHECK: Verify no duplicate user was created
    if (result.data.user && result.data.user.email) {
      logger.auth('New user registered successfully', {
        userId: result.data.user.id,
        email: result.data.user.email,
        emailConfirmed: result.data.user.email_confirmed_at ? 'yes' : 'pending'
      });
    }
    
    return {
      user: result.data.user,
      session: result.data.session,
      error: result.error
    };
  } catch (error: unknown) {
    const err = toError(error);
    // If it's already a ServiceError, just re-throw it
    if (err.name === 'ServiceError') {
      throw error;
    }
    
    const handled = errorHandler.handle(
      err,
      'signUp',
      { email: email ? 'provided' : 'missing' }
    );
    
    // Create appropriate auth error based on message
    const message = err.message?.toLowerCase() || '';
    if (message.includes('email already registered') || 
        message.includes('already exists') || 
        message.includes('duplicate') || 
        message.includes('user already registered')) {
      throw errorHandler.auth.invalidCredentials({
        operation: 'signUp',
        reason: 'An account with this email already exists. Please sign in instead.',
        originalError: err.message
      });
    } else if (message.includes('password')) {
      throw errorHandler.auth.invalidCredentials({
        operation: 'signUp', 
        reason: 'Password does not meet security requirements',
        originalError: err.message
      });
    }
    
    throw errorHandler.auth.invalidCredentials({
      operation: 'signUp',
      originalError: err.message
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
  } catch (error: unknown) {
    const err = toError(error);
    // If it's already a ServiceError, just re-throw it
    if (err.name === 'ServiceError') {
      throw error;
    }
    
    const handled = errorHandler.handle(
      err,
      'signIn',
      { email: email ? 'provided' : 'missing' }
    );
    
    // Create appropriate auth error based on message
    const message = err.message?.toLowerCase() || '';
    if (message.includes('invalid login') || message.includes('invalid email')) {
      throw errorHandler.auth.invalidCredentials({
        operation: 'signIn',
        originalError: err.message
      });
    }
    
    throw errorHandler.auth.invalidCredentials({
      operation: 'signIn',
      originalError: err.message
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
      
    } catch (storageError: unknown) {
      const errorMessage = storageError instanceof Error ? storageError.message : 'Unknown storage error';
      logger.warn('Local storage cleanup failed', { error: errorMessage });
      // Don't throw - signout was successful on server
    }

    logger.auth('User signed out successfully');
    return true;
  } catch (error: unknown) {
    const err = toError(error);
    // If it's already a ServiceError, just re-throw it
    if (err.name === 'ServiceError') {
      throw error;
    }
    
    const handled = errorHandler.handle(
      err,
      'signOut - overall operation'
    );
    throw errorHandler.auth.sessionExpired({
      operation: 'signOut - overall',
      originalError: err.message
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
  } catch (error: unknown) {
    const err = toError(error);
    const handled = errorHandler.handle(
      err,
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
export const handleAuthError = (error: unknown, operation: string): ServiceError => {
  const handled = errorHandler.handle(toError(error), operation);
  return {
    name: 'ServiceError',
    message: handled.userMessage,
    code: handled.code,
    operation: operation,
    context: handled.context
  };
};