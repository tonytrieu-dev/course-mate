/**
 * Application Configuration with Environment Validation
 * Validates required environment variables at startup
 */

// Configuration interfaces
interface SupabaseConfig {
  url: string | undefined;
  key: string | undefined;
}

interface StripeConfig {
  publishableKey: string | undefined;
  studentMonthlyPriceId: string | undefined;
  academicYearPriceId: string | undefined;
}

interface AppConfig {
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  logLevel: string;
}

interface Config {
  supabase: SupabaseConfig;
  stripe: StripeConfig;
  app: AppConfig;
}

// Environment variable mapping
interface RequiredEnvVars {
  [key: string]: string;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Required environment variables for basic functionality
const REQUIRED_ENV_VARS: RequiredEnvVars = {
  REACT_APP_SUPABASE_URL: 'Supabase project URL is required for database connectivity',
  REACT_APP_SUPABASE_ANON_KEY: 'Supabase anonymous key is required for authentication'
};

// Optional environment variables that enhance functionality
const OPTIONAL_ENV_VARS: Record<string, string> = {
  REACT_APP_STRIPE_PUBLISHABLE_KEY: 'Stripe publishable key (required for SaaS subscription features)',
  REACT_APP_BUILD_MODE: 'Build mode configuration (personal/saas)',
  REACT_APP_SENTRY_DSN: 'Sentry DSN for error tracking in production'
};

// Fallback values for development - these should be loaded from .env file
const DEVELOPMENT_FALLBACKS: Record<string, string> = {
  // Remove hardcoded values - use environment variables instead
};

/**
 * Validates Supabase URL format
 */
function validateSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('https://') && url.includes('.supabase.co');
}

/**
 * Validates environment variables and provides accurate status reporting
 * Checks multiple variable name patterns used by different deployment systems
 */
function validateEnvironment(): void {
  const missing: string[] = [];
  const invalid: string[] = [];
  
  // Check Supabase configuration with multiple variable name patterns
  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  console.log('🔍 Environment Variable Check:');
  console.log(`  Supabase URL: ${supabaseUrl ? '✅ FOUND' : '❌ MISSING'}`);
  console.log(`  Supabase Key: ${supabaseKey ? '✅ FOUND' : '❌ MISSING'}`);
  
  // Debug: Show which specific variables are set
  console.log('🔧 Variable Sources:');
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`  REACT_APP_SUPABASE_URL: ${process.env.REACT_APP_SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`  SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅' : '❌'}`);
  console.log(`  REACT_APP_SUPABASE_ANON_KEY: ${process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅' : '❌'}`);
  
  // Only report as missing if NONE of the variable patterns are found
  if (!supabaseUrl) {
    missing.push('Supabase URL: Required for database connectivity (SUPABASE_URL or REACT_APP_SUPABASE_URL)');
  }
  
  if (!supabaseKey) {
    missing.push('Supabase Key: Required for authentication (SUPABASE_ANON_KEY or REACT_APP_SUPABASE_ANON_KEY)');
  }
  
  // Validate Supabase URL format if provided
  if (supabaseUrl && !validateSupabaseUrl(supabaseUrl)) {
    invalid.push('Supabase URL: Must be a valid Supabase URL (https://your-project.supabase.co)');
  }
  
  // Handle missing variables
  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`🚨 Missing required environment variables in production:\n${missing.join('\n')}`);
      console.error('⚠️  Application may not function correctly without these variables!');
      return;
    } else {
      // Development warning with helpful guidance
      console.warn(
        `⚠️  Missing required environment variables:\n${missing.join('\n')}\n\n` +
        '📋 To fix this:\n' +
        '1. Copy .env.example to .env\n' +
        '2. Fill in your actual Supabase credentials\n' +
        '3. Restart your development server\n\n' +
        '🔒 Never commit actual credentials to version control!'
      );
    }
  } else {
    console.log('✅ All required environment variables found!');
  }
  
  // Handle invalid variables
  if (invalid.length > 0) {
    throw new ConfigurationError(
      `❌ Invalid environment variable format:\n${invalid.join('\n')}\n\n` +
      '📚 See .env.example for the correct format.'
    );
  }
}

/**
 * Creates configuration object with validated environment variables
 */
function createConfig(): Config {
  validateEnvironment();
  
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  return {
    supabase: {
      url: process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
      key: process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
    },
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
      studentMonthlyPriceId: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID || process.env.REACT_APP_STRIPE_STUDENT_MONTHLY_PRICE_ID,
      academicYearPriceId: process.env.STRIPE_ACADEMIC_YEAR_PRICE_ID || process.env.REACT_APP_STRIPE_ACADEMIC_YEAR_PRICE_ID
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
export const config: Config = createConfig();
export const supabaseConfig: SupabaseConfig = config.supabase;
export const stripeConfig: StripeConfig = config.stripe;