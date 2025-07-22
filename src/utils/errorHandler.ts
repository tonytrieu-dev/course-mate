/**
 * Enhanced centralized error handling utility with improved context logging and user-friendly messages
 */
import { logger } from './logger';

/**
 * Error context interface
 */
interface ErrorContext {
  operation?: string;
  originalMessage?: string;
  code?: string;
  statusCode?: number;
  timestamp?: string;
  [key: string]: any;
}

/**
 * Enhanced error class with additional metadata
 */
export class ServiceError extends Error {
  name: string;
  code: string;
  statusCode: number;
  context: ErrorContext;
  isOperational: boolean;
  timestamp: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500, context: ErrorContext = {}) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
  }
}

// Error categories and codes
export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_NOT_AUTHENTICATED: 'AUTH_NOT_AUTHENTICATED',
  AUTH_PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',

  // Data operations
  DATA_SAVE_FAILED: 'DATA_SAVE_FAILED',
  DATA_LOAD_FAILED: 'DATA_LOAD_FAILED',
  DATA_SYNC_FAILED: 'DATA_SYNC_FAILED',
  DATA_VALIDATION_FAILED: 'DATA_VALIDATION_FAILED',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_DUPLICATE: 'DATA_DUPLICATE',

  // Network
  NETWORK_CONNECTION_ERROR: 'NETWORK_CONNECTION_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',
  NETWORK_CORS_ERROR: 'NETWORK_CORS_ERROR',

  // File operations
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_DELETE_FAILED: 'FILE_DELETE_FAILED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE: 'FILE_INVALID_TYPE',

  // Canvas integration
  CANVAS_ACCESS_DENIED: 'CANVAS_ACCESS_DENIED',
  CANVAS_INVALID_URL: 'CANVAS_INVALID_URL',
  CANVAS_PARSE_ERROR: 'CANVAS_PARSE_ERROR',

  // Storage
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED: 'STORAGE_ACCESS_DENIED'
} as const;

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password. Please check your credentials and try again.',
  [ERROR_CODES.AUTH_EMAIL_EXISTS]: 'An account with this email already exists. Please use a different email or sign in.',
  [ERROR_CODES.AUTH_WEAK_PASSWORD]: 'Password must be at least 8 characters long and include a mix of letters and numbers.',
  [ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED]: 'Please verify your email address. Check your inbox for a verification link.',
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [ERROR_CODES.AUTH_NOT_AUTHENTICATED]: 'Please sign in to access this feature.',
  [ERROR_CODES.AUTH_PERMISSION_DENIED]: 'You do not have permission to perform this action.',

  [ERROR_CODES.DATA_SAVE_FAILED]: 'Failed to save your data. Please check your connection and try again.',
  [ERROR_CODES.DATA_LOAD_FAILED]: 'Failed to load data. Please refresh the page or check your connection.',
  [ERROR_CODES.DATA_SYNC_FAILED]: 'Failed to sync data with the server. Your local changes are saved.',
  [ERROR_CODES.DATA_VALIDATION_FAILED]: 'Please check your input and try again.',
  [ERROR_CODES.DATA_NOT_FOUND]: 'The requested data could not be found.',
  [ERROR_CODES.DATA_DUPLICATE]: 'This item already exists.',

  [ERROR_CODES.NETWORK_CONNECTION_ERROR]: 'Network connection error. Please check your internet connection and try again.',
  [ERROR_CODES.NETWORK_TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_CODES.NETWORK_SERVER_ERROR]: 'Server error. Please try again in a few minutes.',
  [ERROR_CODES.NETWORK_CORS_ERROR]: 'Access denied due to security restrictions. Please verify your permissions.',

  [ERROR_CODES.FILE_UPLOAD_FAILED]: 'Failed to upload file. Please check the file and try again.',
  [ERROR_CODES.FILE_DELETE_FAILED]: 'Failed to delete file. Please try again.',
  [ERROR_CODES.FILE_NOT_FOUND]: 'File not found.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file.',
  [ERROR_CODES.FILE_INVALID_TYPE]: 'Invalid file type. Please choose a supported file format.',

  [ERROR_CODES.CANVAS_ACCESS_DENIED]: 'Unable to access Canvas calendar. Please check your URL and permissions.',
  [ERROR_CODES.CANVAS_INVALID_URL]: 'Invalid Canvas calendar URL. Please check the URL and try again.',
  [ERROR_CODES.CANVAS_PARSE_ERROR]: 'Error parsing Canvas calendar data. Please try again or contact support.',

  [ERROR_CODES.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded. Please free up space and try again.',
  [ERROR_CODES.STORAGE_ACCESS_DENIED]: 'Storage access denied. Please check your browser permissions.'
};

/**
 * Error handler result interface
 */
interface ErrorHandlerResult {
  userMessage: string;
  code: string;
  context: ErrorContext;
}

/**
 * Extended error interface
 */
interface ExtendedError extends Error {
  code?: string;
  statusCode?: number;
  context?: ErrorContext;
}

/**
 * React error info interface
 */
interface ReactErrorInfo {
  componentStack: string;
}

export const errorHandler = {
  // Create a service error with proper context
  createError: (message: string, code: string = ERROR_CODES.DATA_LOAD_FAILED, context: ErrorContext = {}): ServiceError => {
    return new ServiceError(message, code, 500, context);
  },

  // Enhanced error handling with detailed context
  handle: (error: ExtendedError, operation: string = '', additionalContext: ErrorContext = {}): ErrorHandlerResult => {
    const errorContext: ErrorContext = {
      operation,
      originalMessage: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      ...additionalContext,
      ...(error.context || {})
    };

    // Log error with full context for debugging
    logger.error(`Operation failed: ${operation}`, {
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context: errorContext
    });

    // Return user-friendly message and context
    return {
      userMessage: errorHandler.getUserMessage(error),
      code: error.code || 'UNKNOWN_ERROR',
      context: errorContext
    };
  },

  // Convert technical errors to user-friendly messages
  getUserMessage: (error: ExtendedError): string => {
    // Check if error has a specific code mapping
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }

    const message = (error.message || '').toLowerCase();
    
    // Authentication errors
    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS];
    }
    if (message.includes('email already registered') || message.includes('email already exists')) {
      return ERROR_MESSAGES[ERROR_CODES.AUTH_EMAIL_EXISTS];
    }
    if (message.includes('password should be at least') || message.includes('weak password')) {
      return ERROR_MESSAGES[ERROR_CODES.AUTH_WEAK_PASSWORD];
    }
    if (message.includes('email not confirmed') || message.includes('email not verified')) {
      return ERROR_MESSAGES[ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED];
    }
    if (message.includes('jwt expired') || message.includes('session expired')) {
      return ERROR_MESSAGES[ERROR_CODES.AUTH_SESSION_EXPIRED];
    }
    if (message.includes('not authenticated') || message.includes('user not found')) {
      return ERROR_MESSAGES[ERROR_CODES.AUTH_NOT_AUTHENTICATED];
    }

    // Network errors
    if (message.includes('network error') || message.includes('fetch failed') || message.includes('networkerror')) {
      return ERROR_MESSAGES[ERROR_CODES.NETWORK_CONNECTION_ERROR];
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES[ERROR_CODES.NETWORK_TIMEOUT];
    }
    if (message.includes('cors') || message.includes('cross-origin')) {
      return ERROR_MESSAGES[ERROR_CODES.NETWORK_CORS_ERROR];
    }
    if (error.statusCode && error.statusCode >= 500) {
      return ERROR_MESSAGES[ERROR_CODES.NETWORK_SERVER_ERROR];
    }

    // Canvas-specific errors
    if (message.includes('canvas') && (message.includes('access') || message.includes('denied'))) {
      return ERROR_MESSAGES[ERROR_CODES.CANVAS_ACCESS_DENIED];
    }
    if (message.includes('canvas') && message.includes('url')) {
      return ERROR_MESSAGES[ERROR_CODES.CANVAS_INVALID_URL];
    }

    // File errors
    if (message.includes('file') && message.includes('upload')) {
      return ERROR_MESSAGES[ERROR_CODES.FILE_UPLOAD_FAILED];
    }
    if (message.includes('quota') || message.includes('storage full')) {
      return ERROR_MESSAGES[ERROR_CODES.STORAGE_QUOTA_EXCEEDED];
    }

    // Default fallback with some cleanup
    let cleanMessage = error.message || 'An unexpected error occurred';
    
    // Remove technical stack traces and verbose details from user message
    if (cleanMessage.includes('\n')) {
      cleanMessage = cleanMessage.split('\n')[0];
    }
    if (cleanMessage.length > 150) {
      cleanMessage = cleanMessage.substring(0, 147) + '...';
    }
    
    return cleanMessage;
  },

  // Async wrapper with enhanced error handling
  async: <T = any>(
    asyncFn: (...args: any[]) => Promise<T>,
    operation: string = '',
    fallbackValue: T | null = null,
    shouldThrow: boolean = true
  ) => {
    return async (...args: any[]): Promise<T | null> => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        const handled = errorHandler.handle(error as ExtendedError, operation, { args });
        
        if (shouldThrow) {
          throw new ServiceError(
            handled.userMessage,
            handled.code,
            (error as ExtendedError).statusCode || 500,
            handled.context
          );
        }
        
        return fallbackValue;
      }
    };
  },

  // Service-specific error handlers
  auth: {
    invalidCredentials: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        401,
        context
      ),
    
    notAuthenticated: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_NOT_AUTHENTICATED],
        ERROR_CODES.AUTH_NOT_AUTHENTICATED,
        401,
        context
      ),
      
    sessionExpired: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.AUTH_SESSION_EXPIRED],
        ERROR_CODES.AUTH_SESSION_EXPIRED,
        401,
        context
      )
  },

  data: {
    saveFailed: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.DATA_SAVE_FAILED],
        ERROR_CODES.DATA_SAVE_FAILED,
        500,
        context
      ),
      
    loadFailed: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.DATA_LOAD_FAILED],
        ERROR_CODES.DATA_LOAD_FAILED,
        500,
        context
      ),
      
    notFound: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.DATA_NOT_FOUND],
        ERROR_CODES.DATA_NOT_FOUND,
        404,
        context
      )
  },

  network: {
    connectionError: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.NETWORK_CONNECTION_ERROR],
        ERROR_CODES.NETWORK_CONNECTION_ERROR,
        0,
        context
      ),
      
    timeout: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.NETWORK_TIMEOUT],
        ERROR_CODES.NETWORK_TIMEOUT,
        408,
        context
      )
  },

  canvas: {
    accessDenied: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.CANVAS_ACCESS_DENIED],
        ERROR_CODES.CANVAS_ACCESS_DENIED,
        403,
        context
      ),
      
    invalidUrl: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.CANVAS_INVALID_URL],
        ERROR_CODES.CANVAS_INVALID_URL,
        400,
        context
      ),
      
    parseError: (context: ErrorContext = {}) => 
      new ServiceError(
        ERROR_MESSAGES[ERROR_CODES.CANVAS_PARSE_ERROR],
        ERROR_CODES.CANVAS_PARSE_ERROR,
        500,
        context
      )
  },

  // React error boundary helper
  boundary: (error: Error, errorInfo: ReactErrorInfo) => {
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
  },

  // Utility to check if error should trigger retry
  isRetryable: (error: ExtendedError): boolean => {
    const retryableCodes: string[] = [
      ERROR_CODES.NETWORK_CONNECTION_ERROR,
      ERROR_CODES.NETWORK_TIMEOUT,
      ERROR_CODES.NETWORK_SERVER_ERROR
    ];
    return retryableCodes.includes(error.code || '');
  },

  // Utility to check if error should show fallback UI
  shouldShowFallback: (error: ExtendedError): boolean => {
    const fallbackCodes: string[] = [
      ERROR_CODES.DATA_LOAD_FAILED,
      ERROR_CODES.NETWORK_CONNECTION_ERROR,
      ERROR_CODES.AUTH_SESSION_EXPIRED
    ];
    return fallbackCodes.includes(error.code || '');
  }
};

export default errorHandler;