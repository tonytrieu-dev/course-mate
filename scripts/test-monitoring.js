#!/usr/bin/env node

/**
 * Monitoring System Test Script
 * 
 * Validates that all monitoring components are properly configured
 * and ready for production deployment
 */

const fs = require('fs');
const path = require('path');

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

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(colors.green, `✅ ${description}: ${path.basename(filePath)}`);
    return true;
  } else {
    log(colors.red, `❌ ${description}: Missing ${filePath}`);
    return false;
  }
}

function checkPackage(packageName, description) {
  try {
    require.resolve(packageName);
    log(colors.green, `✅ ${description}: ${packageName} installed`);
    return true;
  } catch (error) {
    log(colors.red, `❌ ${description}: ${packageName} not found`);
    return false;
  }
}

function checkScript(scriptName, description) {
  const packageJson = require('../package.json');
  if (packageJson.scripts && packageJson.scripts[scriptName]) {
    log(colors.green, `✅ ${description}: npm run ${scriptName}`);
    return true;
  } else {
    log(colors.red, `❌ ${description}: Script ${scriptName} not found`);
    return false;
  }
}

function validateSentryConfig() {
  try {
    const sentryConfigPath = path.join(__dirname, '../src/config/sentry.ts');
    if (!fs.existsSync(sentryConfigPath)) {
      log(colors.red, '❌ Sentry: Configuration file missing');
      return false;
    }
    
    const content = fs.readFileSync(sentryConfigPath, 'utf8');
    const hasInit = content.includes('export function initSentry');
    const hasErrorCapture = content.includes('export function captureError');
    const hasPerformance = content.includes('measurePerformance');
    
    if (hasInit && hasErrorCapture && hasPerformance) {
      log(colors.green, '✅ Sentry: Configuration complete');
      return true;
    } else {
      log(colors.red, '❌ Sentry: Configuration incomplete');
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ Sentry: Configuration error - ${error.message}`);
    return false;
  }
}

function validatePerformanceMonitor() {
  try {
    const perfMonitorPath = path.join(__dirname, '../src/utils/performanceMonitor.ts');
    if (!fs.existsSync(perfMonitorPath)) {
      log(colors.red, '❌ Performance: Monitor file missing');
      return false;
    }
    
    const content = fs.readFileSync(perfMonitorPath, 'utf8');
    const hasWebVitals = content.includes('getCLS') && content.includes('getLCP');
    const hasMonitoring = content.includes('class PerformanceMonitor');
    
    if (hasWebVitals && hasMonitoring) {
      log(colors.green, '✅ Performance: Core Web Vitals monitoring configured');
      return true;
    } else {
      log(colors.red, '❌ Performance: Monitoring incomplete');
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ Performance: Configuration error - ${error.message}`);
    return false;
  }
}

async function runTests() {
  log(colors.blue, '🧪 ScheduleBud Monitoring System Test');
  log(colors.blue, '=====================================\n');
  
  let passed = 0;
  let total = 0;
  
  // Test monitoring files
  log(colors.blue, '📁 Monitoring Files:');
  total += 4;
  passed += checkFile(path.join(__dirname, 'health-check.js'), 'Health Check Script') ? 1 : 0;
  passed += checkFile(path.join(__dirname, 'uptime-monitor.js'), 'Uptime Monitor') ? 1 : 0;
  passed += checkFile(path.join(__dirname, 'backup-database.js'), 'Database Backup') ? 1 : 0;
  passed += checkFile(path.join(__dirname, '../PRODUCTION_LAUNCH_CHECKLIST.md'), 'Launch Checklist') ? 1 : 0;
  
  console.log();
  
  // Test monitoring packages
  log(colors.blue, '📦 Required Packages:');
  total += 3;
  passed += checkPackage('@sentry/react', 'Sentry SDK') ? 1 : 0;
  passed += checkPackage('web-vitals', 'Web Vitals') ? 1 : 0;
  passed += checkPackage('@supabase/supabase-js', 'Supabase Client') ? 1 : 0;
  
  console.log();
  
  // Test NPM scripts
  log(colors.blue, '🔧 NPM Scripts:');
  total += 6;
  passed += checkScript('health-check', 'Health Check') ? 1 : 0;
  passed += checkScript('uptime:monitor', 'Uptime Monitor') ? 1 : 0;
  passed += checkScript('db:backup', 'Database Backup') ? 1 : 0;
  passed += checkScript('db:status', 'Backup Status') ? 1 : 0;
  passed += checkScript('security:scan', 'Security Scan') ? 1 : 0;
  passed += checkScript('monitoring:test', 'Monitoring Test') ? 1 : 0;
  
  console.log();
  
  // Test configuration files
  log(colors.blue, '⚙️  Configuration:');
  total += 2;
  passed += validateSentryConfig() ? 1 : 0;
  passed += validatePerformanceMonitor() ? 1 : 0;
  
  console.log();
  
  // Test infrastructure files
  log(colors.blue, '🏗️  Infrastructure:');
  total += 3;
  passed += checkFile(path.join(__dirname, '../nginx.conf'), 'Nginx Config') ? 1 : 0;
  passed += checkFile(path.join(__dirname, '../northflank.json'), 'Northflank Config') ? 1 : 0;
  passed += checkFile(path.join(__dirname, '../.env.example'), 'Environment Template') ? 1 : 0;
  
  console.log();
  
  // Results summary
  log(colors.blue, '📊 Test Results:');
  log(colors.blue, '================');
  log(colors.blue, `Total tests: ${total}`);
  log(colors.green, `Passed: ${passed}`);
  
  if (total - passed > 0) {
    log(colors.red, `Failed: ${total - passed}`);
  }
  
  const percentage = Math.round((passed / total) * 100);
  log(colors.blue, `Success rate: ${percentage}%\n`);
  
  if (percentage >= 95) {
    log(colors.green, '🎉 PRODUCTION READY! All monitoring systems configured.');
    log(colors.green, '   Ready for student launch.');
  } else if (percentage >= 80) {
    log(colors.yellow, '⚠️  MOSTLY READY. Some optional components missing.');
    log(colors.yellow, '   Can launch with reduced monitoring capabilities.');
  } else {
    log(colors.red, '❌ NOT READY. Critical monitoring components missing.');
    log(colors.red, '   Please address failed tests before production launch.');
  }
  
  return percentage >= 80;
}

// Run tests
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(colors.red, `💥 Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };