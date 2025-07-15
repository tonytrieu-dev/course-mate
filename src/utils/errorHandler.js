/**
 * Centralized error handling utility
 */
import { logger } from './logger';

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = {
  // Authentication errors
  auth: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
    WEAK_PASSWORD: 'Password does not meet security requirements',
    EMAIL_NOT_VERIFIED: 'Please verify your email address',
    SESSION_EXPIRED: 'Your session has expired. Please log in again'
  },

  // Data errors
  data: {
    SAVE_FAILED: 'Failed to save data. Please try again',
    LOAD_FAILED: 'Failed to load data. Please refresh the page',
    SYNC_FAILED: 'Failed to sync data with server'
  },

  // Network errors
  network: {
    CONNECTION_ERROR: 'Network connection error. Please check your internet connection',
    TIMEOUT: 'Request timed out. Please try again',
    SERVER_ERROR: 'Server error. Please try again later'
  },

  // Handle different error types
  handle: (error, context = '') => {
    const errorInfo = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      statusCode: error.statusCode || 500,
      context,
      timestamp: new Date().toISOString()
    };

    // Log error with context
    logger.error(`Error in ${context}`, errorInfo);

    // Return user-friendly message
    return errorHandler.getUserMessage(error);
  },

  // Convert technical errors to user-friendly messages
  getUserMessage: (error) => {
    const message = error.message.toLowerCase();
    
    // Authentication errors
    if (message.includes('invalid login credentials')) {
      return errorHandler.auth.INVALID_CREDENTIALS;
    }
    if (message.includes('email already registered')) {
      return errorHandler.auth.EMAIL_ALREADY_EXISTS;
    }
    if (message.includes('password should be at least')) {
      return errorHandler.auth.WEAK_PASSWORD;
    }
    if (message.includes('email not confirmed')) {
      return errorHandler.auth.EMAIL_NOT_VERIFIED;
    }
    if (message.includes('jwt expired')) {
      return errorHandler.auth.SESSION_EXPIRED;
    }

    // Network errors
    if (message.includes('network error') || message.includes('fetch')) {
      return errorHandler.network.CONNECTION_ERROR;
    }
    if (message.includes('timeout')) {
      return errorHandler.network.TIMEOUT;
    }
    if (error.statusCode >= 500) {
      return errorHandler.network.SERVER_ERROR;
    }

    // Default to original message if no specific handling
    return error.message || 'An unexpected error occurred';
  },

  // Async error wrapper
  async: (asyncFn, context = '') => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        const userMessage = errorHandler.handle(error, context);
        throw new AppError(userMessage, error.code, error.statusCode);
      }
    };
  },

  // React error boundary helper
  boundary: (error, errorInfo) => {
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    return {
      hasError: true,
      error: {
        message: 'Something went wrong. Please refresh the page.',
        code: 'REACT_ERROR'
      }
    };
  }
};

export default errorHandler;