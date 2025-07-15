/**
 * Centralized logging utility with configurable levels
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    this.level = process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
  }

  setLevel(level) {
    this.level = level;
  }

  error(message, ...args) {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  // Auth-specific logging with sensitive data filtering
  auth(message, data = {}) {
    const safeData = this.sanitizeAuthData(data);
    this.info(`[AUTH] ${message}`, safeData);
  }

  sanitizeAuthData(data) {
    const sanitized = { ...data };
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
export { LOG_LEVELS };