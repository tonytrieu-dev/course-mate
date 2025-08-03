/**
 * Centralized logging utility with configurable levels
 */

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
    this.level = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
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
    
    // In production, this would also send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to security monitoring service (e.g., Sentry, DataDog)
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