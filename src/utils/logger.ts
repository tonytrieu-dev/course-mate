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
  [key: string]: any;
  password?: string;
  token?: string;
  key?: string;
  user?: {
    id?: string;
    [key: string]: any;
  };
}

export interface SanitizedAuthData {
  [key: string]: any;
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

  error(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  // Auth-specific logging with sensitive data filtering
  auth(message: string, data: AuthData = {}): void {
    const safeData = this.sanitizeAuthData(data);
    this.info(`[AUTH] ${message}`, safeData);
  }

  private sanitizeAuthData(data: AuthData): SanitizedAuthData {
    const sanitized: any = { ...data };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.key;
    if (sanitized.user) {
      sanitized.user = { id: sanitized.user.id || 'unknown' };
    }
    return sanitized;
  }
}

export const logger = new Logger();