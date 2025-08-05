/**
 * ScheduleBud Security Configuration
 * 
 * Comprehensive security headers and policies for production deployment
 * Designed for student educational app with FERPA compliance requirements
 */

const PRODUCTION_DOMAIN = 'schedulebudapp.com';
const STAGING_DOMAIN = 'staging.schedulebudapp.com';
const NORTHFLANK_DOMAINS = ['*.northflank.app']; // Northflank preview deployments
const DEV_DOMAINS = ['localhost:8080', '127.0.0.1:8080', 'localhost:3000'];

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Content Security Policy (CSP) Configuration
 * Prevents XSS attacks while allowing necessary resources
 */
function getCSPPolicy() {
  const allowedDomains = isProduction 
    ? [`https://${PRODUCTION_DOMAIN}`, `https://*.${PRODUCTION_DOMAIN}`]
    : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000', 'https://*.northflank.app'];

  const supabaseDomain = process.env.REACT_APP_SUPABASE_URL || 'https://*.supabase.co';
  
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind config in HTML
      "'unsafe-eval'", // Required for React development (remove in production)
      'https://cdn.tailwindcss.com',
      'https://unpkg.com', // For any CDN dependencies
      ...(isDevelopment ? ["'unsafe-eval'"] : [])
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and dynamic styles
      'https://cdn.tailwindcss.com',
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:', // For base64 images
      'blob:', // For generated images
      supabaseDomain,
      'https://*.supabase.co',
      'https://schedulebudapp.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'connect-src': [
      "'self'",
      supabaseDomain,
      'https://*.supabase.co',
      'https://api.stripe.com', // For payments in SaaS mode
      'https://corsproxy.io', // Canvas integration proxies
      'https://allorigins.win',
      'https://cors.sh',
      // Google API endpoints for AI
      'https://generativelanguage.googleapis.com',
      // Hugging Face for embeddings
      'https://router.huggingface.co',
      ...(isDevelopment ? ['ws://localhost:8080', 'http://localhost:8080'] : [])
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com', // Stripe Elements
      'https://hooks.stripe.com'
    ],
    'frame-ancestors': ["'none'"], // Prevent embedding in iframes
    'form-action': [
      "'self'",
      'https://api.stripe.com'
    ],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'worker-src': [
      "'self'",
      'blob:' // For web workers
    ],
    'manifest-src': ["'self'"],
    'media-src': [
      "'self'",
      'blob:',
      supabaseDomain
    ]
  };
}

/**
 * Security Headers Configuration
 */
function getSecurityHeaders() {
  const csp = getCSPPolicy();
  const cspString = Object.entries(csp)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');

  return {
    // Content Security Policy
    'Content-Security-Policy': cspString,
    
    // Strict Transport Security (HTTPS enforcement)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // XSS Protection (legacy browsers)
    'X-XSS-Protection': '1; mode=block',
    
    // Frame Options (prevent clickjacking)
    'X-Frame-Options': 'DENY',
    
    // Referrer Policy (privacy)
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy (feature control)
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', '),
    
    // Cross-Origin Policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
}

/**
 * CORS Configuration for Edge Functions
 */
function getCORSConfig() {
  const allowedOrigins = isProduction 
    ? [
        `https://${PRODUCTION_DOMAIN}`,
        `https://www.${PRODUCTION_DOMAIN}`,
        `https://${STAGING_DOMAIN}`
      ]
    : [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3000',
        // Northflank preview deployments pattern
        /^https:\/\/.*\.northflank\.app$/
      ];

  return {
    'Access-Control-Allow-Origin': allowedOrigins,
    'Access-Control-Allow-Headers': [
      'authorization',
      'x-client-info', 
      'apikey',
      'content-type',
      'x-requested-with'
    ].join(', '),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // 24 hours
  };
}

/**
 * Rate Limiting Configuration
 */
const RATE_LIMITS = {
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: 'Too many requests from this IP'
  },
  
  // AI/Chatbot endpoints (more expensive)
  ai: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 20, // requests per window
    message: 'Too many AI requests from this IP'
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // requests per window
    message: 'Too many authentication attempts'
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // requests per window
    message: 'Too many file uploads from this IP'
  }
};

/**
 * Input Validation Patterns
 */
const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  classId: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  taskTitle: /^.{1,500}$/,
  fileName: /^[a-zA-Z0-9._-]{1,255}$/
};

/**
 * Security Middleware Factory
 */
function createSecurityMiddleware() {
  return {
    // Helmet-style security headers
    helmet: (req, res, next) => {
      const headers = getSecurityHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    },

    // CORS middleware
    cors: (req, res, next) => {
      const corsConfig = getCORSConfig();
      const origin = req.headers.origin;
      
      if (corsConfig['Access-Control-Allow-Origin'].includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      Object.entries(corsConfig).forEach(([key, value]) => {
        if (key !== 'Access-Control-Allow-Origin') {
          res.setHeader(key, value);
        }
      });
      
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }
      
      next();
    },

    // Input validation
    validateInput: (schema) => (req, res, next) => {
      const errors = [];
      
      Object.entries(schema).forEach(([field, pattern]) => {
        const value = req.body[field];
        if (value && !pattern.test(value)) {
          errors.push(`Invalid ${field} format`);
        }
      });
      
      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors 
        });
      }
      
      next();
    }
  };
}

module.exports = {
  getCSPPolicy,
  getSecurityHeaders,
  getCORSConfig,
  RATE_LIMITS,
  VALIDATION_PATTERNS,
  createSecurityMiddleware,
  isProduction,
  isDevelopment
};