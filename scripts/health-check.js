#!/usr/bin/env node

/**
 * Health Check Script for ScheduleBud
 * 
 * Performs basic health checks on the application and its dependencies.
 * Used for monitoring application health in production environments.
 */

const https = require('https');
const http = require('http');

// Configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 5000, // 5 seconds
  retries: 3,
  checks: {
    supabase: process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
    app: process.argv[2] || 'http://localhost:3000' // Allow URL override
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        statusCode: res.statusCode,
        responseTime,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function checkEndpoint(name, url, expectedStatus = 200) {
  log(colors.blue, `🔍 Checking ${name}...`);
  
  for (let attempt = 1; attempt <= HEALTH_CHECK_CONFIG.retries; attempt++) {
    try {
      const result = await makeRequest(url, HEALTH_CHECK_CONFIG.timeout);
      
      if (result.success) {
        log(colors.green, `✅ ${name}: OK (${result.responseTime}ms, Status: ${result.statusCode})`);
        return { success: true, responseTime: result.responseTime, statusCode: result.statusCode };
      } else {
        log(colors.yellow, `⚠️  ${name}: Unexpected status ${result.statusCode} (attempt ${attempt}/${HEALTH_CHECK_CONFIG.retries})`);
      }
    } catch (error) {
      log(colors.yellow, `⚠️  ${name}: ${error.message} (attempt ${attempt}/${HEALTH_CHECK_CONFIG.retries})`);
      
      if (attempt === HEALTH_CHECK_CONFIG.retries) {
        log(colors.red, `❌ ${name}: Failed after ${HEALTH_CHECK_CONFIG.retries} attempts`);
        return { success: false, error: error.message };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function checkSupabase() {
  if (!HEALTH_CHECK_CONFIG.checks.supabase) {
    log(colors.yellow, '⚠️  Supabase: No URL configured, skipping check');
    return { success: true, skipped: true };
  }
  
  const healthUrl = `${HEALTH_CHECK_CONFIG.checks.supabase}/rest/v1/`;
  return await checkEndpoint('Supabase API', healthUrl);
}

async function checkApplication() {
  return await checkEndpoint('Application', HEALTH_CHECK_CONFIG.checks.app);
}

async function checkEnvironment() {
  log(colors.blue, '🔍 Checking environment configuration...');
  
  const requiredEnvVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length === 0) {
    log(colors.green, '✅ Environment: All required variables present');
    return { success: true };
  } else {
    log(colors.red, `❌ Environment: Missing variables: ${missing.join(', ')}`);
    return { success: false, missing };
  }
}

async function performHealthCheck() {
  console.log('\n🏥 ScheduleBud Health Check');
  console.log('================================\n');
  
  const startTime = Date.now();
  const results = {};
  
  // Check environment
  results.environment = await checkEnvironment();
  
  // Check Supabase
  results.supabase = await checkSupabase();
  
  // Check application (if URL provided)
  if (HEALTH_CHECK_CONFIG.checks.app !== 'http://localhost:3000' || process.argv[2]) {
    results.application = await checkApplication();
  }
  
  // Summary
  const totalTime = Date.now() - startTime;
  console.log('\n📊 Health Check Summary');
  console.log('========================');
  
  const checks = Object.keys(results);
  const passed = checks.filter(key => results[key].success).length;
  const failed = checks.filter(key => !results[key].success && !results[key].skipped).length;
  const skipped = checks.filter(key => results[key].skipped).length;
  
  log(colors.blue, `Total checks: ${checks.length}`);
  log(colors.green, `Passed: ${passed}`);
  if (failed > 0) log(colors.red, `Failed: ${failed}`);
  if (skipped > 0) log(colors.yellow, `Skipped: ${skipped}`);
  log(colors.blue, `Total time: ${totalTime}ms\n`);
  
  if (failed === 0) {
    log(colors.green, '🎉 All health checks passed!');
    process.exit(0);
  } else {
    log(colors.red, '💥 Some health checks failed!');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(colors.red, `💥 Unhandled error: ${error.message}`);
  process.exit(1);
});

// Run health check
if (require.main === module) {
  performHealthCheck().catch((error) => {
    log(colors.red, `💥 Health check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { performHealthCheck, checkEndpoint };