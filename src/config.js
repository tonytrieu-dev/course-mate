/**
 * Application Configuration with Environment Validation
 * Validates required environment variables at startup
 */

class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Required environment variables
const REQUIRED_ENV_VARS = {
  SUPABASE_URL: 'Supabase project URL is required',
  SUPABASE_ANON_KEY: 'Supabase anonymous key is required'
};

// Fallback values for development - these should be loaded from .env file
const DEVELOPMENT_FALLBACKS = {
  // Remove hardcoded values - use environment variables instead
};

/**
 * Validates environment variables and provides fallbacks for development
 */
function validateEnvironment() {
  const missing = [];
  
  for (const [envVar, description] of Object.entries(REQUIRED_ENV_VARS)) {
    if (!process.env[envVar]) {
      missing.push(`${envVar}: ${description}`);
    }
  }
  
  if (missing.length > 0) {
    console.warn(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      'Please set these variables in your environment or .env file'
    );
    // Don't throw in development to allow fallback to localStorage
    if (process.env.NODE_ENV === 'production') {
      throw new ConfigurationError(
        `Missing required environment variables:\n${missing.join('\n')}\n\n` +
        'Please set these variables in your environment or .env file'
      );
    }
  }
}

/**
 * Creates configuration object with validated environment variables
 */
function createConfig() {
  validateEnvironment();
  
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  return {
    supabase: {
      url: process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
      key: process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
    },
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment,
      isProduction: process.env.NODE_ENV === 'production',
      logLevel: process.env.LOG_LEVEL || 'warn'
    }
  };
}

// Export both the config and legacy format for backward compatibility
export const config = createConfig();
export const supabaseConfig = config.supabase;

// Validate configuration on module load
export { ConfigurationError };