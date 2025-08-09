/**
 * Centralized logging utility with configurable levels and Sentry integration
 */

import { captureError, captureMessage, addSentryBreadcrumb } from '../config/sentry';

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
} as const;

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

export interface AuthData {
  [key: string]: unknown;
  password?: string;
  token?: string;
  key?: string;
  user?: {
    id?: string;
    [key: string]: unknown;
  };
}

export interface SanitizedAuthData {
  [key: string]: unknown;
  user?: {
    id: string;
  };
}

class Logger {
  private level: LogLevel;

  constructor() {
    // Use environment directly (config.js has module compatibility issues)
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    // Reduce log level during development - only show INFO and above for cleaner startup
    this.level = isDevelopment ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
      
      // Send to Sentry in production
      if (process.env.NODE_ENV === 'production') {
        // If first arg is an Error object, capture it as exception
        if (args[0] instanceof Error) {
          captureError(args[0], { metadata: { message, args: args.slice(1) } });
        } else {
          captureMessage(message, 'error', { args });
        }
      }
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
      
      // Send warnings to Sentry in production
      if (process.env.NODE_ENV === 'production') {
        captureMessage(message, 'warning', { args });
      }
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
      
      // Add as breadcrumb for context
      addSentryBreadcrumb(message, 'user', { args });
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
      
      // Add debug info as breadcrumb in development
      if (process.env.NODE_ENV === 'development') {
        addSentryBreadcrumb(message, 'user', { args });
      }
    }
  }

  // Auth-specific logging with sensitive data filtering
  auth(message: string, data: AuthData = {}): void {
    const safeData = this.sanitizeAuthData(data);
    this.info(`[AUTH] ${message}`, safeData);
  }

  // Security-specific logging with enhanced monitoring
  security(message: string, data: Record<string, unknown> = {}): void {
    const securityData = {
      ...data,
      timestamp: new Date().toISOString(),
      severity: data.severity || 'medium',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
    };
    
    // Always log security events regardless of log level
    console.warn(`[SECURITY] ${message}`, securityData);
    
    // Always send security events to Sentry with high priority
    try {
      const severity = String(data.severity || 'medium');
      const sentryLevel = severity === 'critical' ? 'fatal' : 
                         severity === 'high' ? 'error' : 'warning';
      
      captureMessage(`[SECURITY] ${message}`, sentryLevel, securityData);
      
      // Add security breadcrumb for context
      addSentryBreadcrumb(message, 'error', securityData);
    } catch (error) {
      console.error('Failed to send security event to Sentry:', error);
    }
  }

  private sanitizeAuthData(data: AuthData): SanitizedAuthData {
    const sanitized: Record<string, unknown> = { ...data };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.key;
    if (sanitized.user && typeof sanitized.user === 'object' && sanitized.user !== null) {
      const user = sanitized.user as { id?: string };
      sanitized.user = { id: user.id || 'unknown' };
    }
    return sanitized;
  }
}

export const logger = new Logger();