/**
 * Sentry Configuration for ScheduleBud
 * 
 * Provides error tracking, performance monitoring, and user feedback
 * for production monitoring and debugging.
 */

import * as Sentry from '@sentry/react';
import { logger } from '../utils/logger';

// Configuration
const SENTRY_CONFIG = {
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.REACT_APP_VERSION || '1.0.0',
  
  // Performance monitoring settings
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay (for debugging user issues)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Error filtering
  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint): Sentry.ErrorEvent | null {
    // Filter out non-actionable errors
    const error = hint.originalException;
    
    if (error) {
      const errorMessage = error.toString();
      
      // Skip common browser extension errors
      if (errorMessage.includes('Extension context invalidated') ||
          errorMessage.includes('chrome-extension://') ||
          errorMessage.includes('moz-extension://')) {
        return null;
      }
      
      // Skip network errors in development
      if (process.env.NODE_ENV === 'development' && 
          errorMessage.includes('Failed to fetch')) {
        return null;
      }
    }
    
    // Filter out low-level events in production
    if (process.env.NODE_ENV === 'production' && event.level === 'info') {
      return null;
    }
    
    return event;
  }
};

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry(): void {
  if (!SENTRY_CONFIG.dsn) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Sentry DSN not configured in production');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_CONFIG.dsn,
      environment: SENTRY_CONFIG.environment,
      release: SENTRY_CONFIG.release,
      beforeSend: SENTRY_CONFIG.beforeSend,
      
      integrations: [
        Sentry.browserTracingIntegration({
          // Performance monitoring for navigation - newer API
        }),
        Sentry.replayIntegration({
          // Session replay for debugging
          maskAllText: true, // Protect student privacy
          blockAllMedia: true,
        }),
      ],
      
      // Performance monitoring
      tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
      
      // Session replay for debugging
      replaysSessionSampleRate: SENTRY_CONFIG.replaysSessionSampleRate,
      replaysOnErrorSampleRate: SENTRY_CONFIG.replaysOnErrorSampleRate,
      
      // Additional configuration
      sendDefaultPii: false, // Respect student privacy
      attachStacktrace: true,
      
      // Tags for organization
      initialScope: {
        tags: {
          component: 'react-app',
          buildMode: process.env.REACT_APP_BUILD_MODE || 'personal'
        }
      }
    });

    logger.info('Sentry initialized successfully', {
      environment: SENTRY_CONFIG.environment,
      release: SENTRY_CONFIG.release
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry', { error });
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: string; email?: string }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email // Optional, respects privacy
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add context tags for errors
 */
export function setSentryTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Add breadcrumb for user actions
 */
export function addSentryBreadcrumb(
  message: string,
  category: 'navigation' | 'user' | 'auth' | 'api' | 'canvas' | 'error' = 'user',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000
  });
}

/**
 * Capture error with context
 */
export function captureError(
  error: Error,
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
): void {
  Sentry.withScope((scope) => {
    if (context?.component) scope.setTag('component', context.component);
    if (context?.action) scope.setTag('action', context.action);
    if (context?.userId) scope.setUser({ id: context.userId });
    if (context?.metadata) scope.setContext('metadata', context.metadata);
    
    Sentry.captureException(error);
  });
}

/**
 * Capture message with level
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): void {
  Sentry.withScope((scope) => {
    if (context) scope.setContext('additional', context);
    Sentry.captureMessage(message, level);
  });
}

/**
 * Performance monitoring for async operations using new API
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return Sentry.startSpan(
    { 
      name, 
      op: 'function',
      attributes: context 
    }, 
    async (span) => {
      try {
        const result = await operation();
        span?.setStatus({ code: 1 }); // OK status
        return result;
      } catch (error) {
        span?.setStatus({ code: 2 }); // Error status
        captureError(error as Error, { action: name, metadata: context });
        throw error;
      }
    }
  );
}

export default Sentry;