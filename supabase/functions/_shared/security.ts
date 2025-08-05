/**
 * Shared Security Configuration for Supabase Edge Functions
 * 
 * Provides secure CORS, rate limiting, input validation, and security headers
 * for all ScheduleBud Edge Functions
 */

// Environment-based allowed origins
const PRODUCTION_ORIGINS = [
  'https://schedulebudapp.com',
  'https://www.schedulebudapp.com'
];

const STAGING_ORIGINS = [
  'https://staging.schedulebudapp.com'
];

const NORTHFLANK_ORIGINS = [
  /^https:\/\/.*\.northflank\.app$/ // Northflank preview deployments
];

const DEVELOPMENT_ORIGINS = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000'
];

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): (string | RegExp)[] {
  const environment = Deno.env.get('ENVIRONMENT') || 'development';
  
  switch (environment) {
    case 'production':
      return PRODUCTION_ORIGINS;
    case 'staging':
      return [...STAGING_ORIGINS, ...NORTHFLANK_ORIGINS, ...DEVELOPMENT_ORIGINS];
    case 'development':
    default:
      return [...DEVELOPMENT_ORIGINS, ...STAGING_ORIGINS, ...NORTHFLANK_ORIGINS];
  }
}

/**
 * Create secure CORS headers based on request origin
 */
export function createSecureCORSHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is allowed (handle both strings and regex patterns)
  const isAllowedOrigin = origin && allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return allowed === origin;
    } else if (allowed instanceof RegExp) {
      return allowed.test(origin);
    }
    return false;
  });
  
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Headers': [
      'authorization',
      'x-client-info', 
      'apikey',
      'content-type',
      'x-requested-with'
    ].join(', '),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true'
  };

  // Only set allowed origin if it's in our allowlist
  if (isAllowedOrigin) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else {
    // Log potential security issue
    console.warn(`Blocked request from unauthorized origin: ${origin}`);
    // Don't set CORS headers for unauthorized origins
    return {};
  }

  return corsHeaders;
}

/**
 * Security headers for all responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}

/**
 * Rate limiting store (in-memory for Edge Functions)
 * In production, consider using Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

export const RATE_LIMITS = {
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP'
  },
  ai: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 20,
    message: 'Too many AI requests from this IP'
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many authentication attempts'
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: 'Too many file uploads from this IP'
  }
};

/**
 * Check rate limit for an IP address
 */
export function checkRateLimit(
  ip: string, 
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `rate_limit:${ip}`;
  const now = Date.now();
  
  let bucket = rateLimitStore.get(key);
  
  // Initialize or reset bucket if window has passed
  if (!bucket || now >= bucket.resetTime) {
    bucket = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }
  
  bucket.count++;
  rateLimitStore.set(key, bucket);
  
  // Cleanup expired entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupExpiredRateLimits();
  }
  
  return {
    allowed: bucket.count <= config.max,
    remaining: Math.max(0, config.max - bucket.count),
    resetTime: bucket.resetTime
  };
}

/**
 * Cleanup expired rate limit entries
 */
function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now >= bucket.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try various headers in order of preference
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip' // Cloudflare
  ];
  
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Take first IP from comma-separated list
      return value.split(',')[0].trim();
    }
  }
  
  // Fallback to connection info (limited in Edge Functions)
  return 'unknown';
}

/**
 * Input validation patterns
 */
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  uuid: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  taskTitle: /^.{1,500}$/,
  fileName: /^[a-zA-Z0-9._-]{1,255}$/,
  className: /^.{1,100}$/,
  query: /^.{1,1000}$/
};

/**
 * Validate input against pattern
 */
export function validateInput(value: string, pattern: RegExp): boolean {
  return pattern.test(value);
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove on* event handlers
    .trim();
}

/**
 * Create a secure response with all security headers
 */
export function createSecureResponse(
  body: string,
  options: {
    status?: number;
    headers?: Record<string, string>;
    corsHeaders?: Record<string, string>;
  } = {}
): Response {
  const { status = 200, headers = {}, corsHeaders = {} } = options;
  
  const allHeaders = {
    'Content-Type': 'application/json',
    ...getSecurityHeaders(),
    ...corsHeaders,
    ...headers
  };
  
  return new Response(body, {
    status,
    headers: allHeaders
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCORSPreflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    const corsHeaders = createSecureCORSHeaders(request);
    
    // If no CORS headers, origin is not allowed
    if (Object.keys(corsHeaders).length === 0) {
      return new Response('Forbidden', { status: 403 });
    }
    
    return createSecureResponse('ok', { corsHeaders });
  }
  
  return null;
}

/**
 * Security middleware for Edge Functions
 */
export async function withSecurity<T>(
  request: Request,
  rateLimitConfig: RateLimitConfig,
  handler: (request: Request, corsHeaders: Record<string, string>) => Promise<T>
): Promise<Response> {
  try {
    // Handle CORS preflight
    const preflightResponse = handleCORSPreflight(request);
    if (preflightResponse) {
      return preflightResponse;
    }
    
    // Get secure CORS headers
    const corsHeaders = createSecureCORSHeaders(request);
    
    // Block requests from unauthorized origins
    if (Object.keys(corsHeaders).length === 0) {
      return createSecureResponse(
        JSON.stringify({ error: 'Unauthorized origin' }),
        { status: 403 }
      );
    }
    
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitCheck = checkRateLimit(clientIP, rateLimitConfig);
    
    if (!rateLimitCheck.allowed) {
      return createSecureResponse(
        JSON.stringify({ 
          error: rateLimitConfig.message,
          retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
        }),
        { 
          status: 429,
          corsHeaders,
          headers: {
            'Retry-After': Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': rateLimitConfig.max.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitCheck.resetTime).toISOString()
          }
        }
      );
    }
    
    // Call the actual handler
    const result = await handler(request, corsHeaders);
    
    // If handler returns a Response, add security headers
    if (result instanceof Response) {
      const body = await result.text();
      return createSecureResponse(body, {
        status: result.status,
        corsHeaders,
        headers: Object.fromEntries(result.headers.entries())
      });
    }
    
    // If handler returns data, wrap in secure response
    return createSecureResponse(
      typeof result === 'string' ? result : JSON.stringify(result),
      { corsHeaders }
    );
    
  } catch (error) {
    console.error('Security middleware error:', error);
    
    return createSecureResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      }),
      { 
        status: 500,
        corsHeaders: createSecureCORSHeaders(request)
      }
    );
  }
}