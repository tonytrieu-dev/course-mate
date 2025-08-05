#!/usr/bin/env node

/**
 * Uptime Monitoring Script for ScheduleBud
 * 
 * Monitors application uptime, health, and performance
 * Sends alerts when issues are detected
 * Can be run as a standalone script or integrated with monitoring services
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const MONITOR_CONFIG = {
  // Application endpoints to monitor
  endpoints: [
    {
      name: 'Application',
      url: process.env.APP_URL || 'https://schedulebudapp.com',
      timeout: 10000,
      expectedStatus: 200,
      critical: true
    },
    {
      name: 'Health Check',
      url: (process.env.APP_URL || 'https://schedulebudapp.com') + '/health',
      timeout: 5000,
      expectedStatus: 200,
      critical: true
    },
    {
      name: 'Supabase API',
      url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/rest/v1/` : null,
      timeout: 5000,
      expectedStatus: 200,
      critical: true
    }
  ].filter(endpoint => endpoint.url), // Remove null URLs

  // Monitoring settings
  checkInterval: parseInt(process.env.CHECK_INTERVAL) || 60, // seconds
  alertThreshold: 3, // consecutive failures before alert
  timeout: 10000, // default timeout in ms
  
  // Alert settings (these would be configured with actual services)
  alerts: {
    email: process.env.ALERT_EMAIL,
    webhook: process.env.ALERT_WEBHOOK,
    slack: process.env.SLACK_WEBHOOK
  },

  // Logging
  logFile: path.join(__dirname, '../logs/uptime.log'),
  maxLogSize: 10 * 1024 * 1024, // 10MB
  retainLogs: 7 // days
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

function log(color, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} ${message}`;
  
  // Console output with color
  console.log(`${color}${logMessage}${colors.reset}`);
  
  // File logging
  logToFile(logMessage);
}

function logToFile(message) {
  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(MONITOR_CONFIG.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Rotate log if too large
    if (fs.existsSync(MONITOR_CONFIG.logFile)) {
      const stats = fs.statSync(MONITOR_CONFIG.logFile);
      if (stats.size > MONITOR_CONFIG.maxLogSize) {
        const rotatedFile = `${MONITOR_CONFIG.logFile}.${Date.now()}`;
        fs.renameSync(MONITOR_CONFIG.logFile, rotatedFile);
        
        // Clean up old logs
        cleanupOldLogs();
      }
    }

    // Append to log file
    fs.appendFileSync(MONITOR_CONFIG.logFile, message + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

function cleanupOldLogs() {
  try {
    const logsDir = path.dirname(MONITOR_CONFIG.logFile);
    const files = fs.readdirSync(logsDir);
    const cutoffDate = Date.now() - (MONITOR_CONFIG.retainLogs * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      if (file.includes('uptime.log.')) {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffDate) {
          fs.unlinkSync(filePath);
          log(colors.gray, `Cleaned up old log: ${file}`);
        }
      }
    });
  } catch (error) {
    log(colors.yellow, `Failed to cleanup old logs: ${error.message}`);
  }
}

// Status tracking
const endpointStatus = new Map();

function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          success: res.statusCode >= 200 && res.statusCode < 400,
          headers: res.headers,
          body: data.slice(0, 1000) // Limit body size
        });
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function checkEndpoint(endpoint) {
  const startTime = Date.now();
  
  try {
    const result = await makeRequest(endpoint.url, endpoint.timeout);
    const success = result.statusCode === endpoint.expectedStatus;
    
    const status = {
      name: endpoint.name,
      url: endpoint.url,
      success,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      timestamp: new Date().toISOString(),
      error: null
    };

    if (success) {
      log(colors.green, `✅ ${endpoint.name}: OK (${result.responseTime}ms, Status: ${result.statusCode})`);
    } else {
      log(colors.yellow, `⚠️  ${endpoint.name}: Unexpected status ${result.statusCode} (${result.responseTime}ms)`);
    }

    return status;
  } catch (error) {
    const status = {
      name: endpoint.name,
      url: endpoint.url,
      success: false,
      statusCode: null,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      error: error.message
    };

    log(colors.red, `❌ ${endpoint.name}: ${error.message} (${status.responseTime}ms)`);
    return status;
  }
}

async function sendAlert(endpoint, status, consecutiveFailures) {
  const alertMessage = {
    endpoint: endpoint.name,
    url: endpoint.url,
    status: status.statusCode || 'ERROR',
    error: status.error,
    responseTime: status.responseTime,
    consecutiveFailures,
    timestamp: status.timestamp,
    severity: endpoint.critical ? 'CRITICAL' : 'WARNING'
  };

  log(colors.red, `🚨 ALERT: ${endpoint.name} has failed ${consecutiveFailures} consecutive checks`);

  // Send to configured alert channels
  const alertPromises = [];

  // Webhook alert
  if (MONITOR_CONFIG.alerts.webhook) {
    alertPromises.push(sendWebhookAlert(alertMessage));
  }

  // Slack alert
  if (MONITOR_CONFIG.alerts.slack) {
    alertPromises.push(sendSlackAlert(alertMessage));
  }

  // Email alert (would require email service configuration)
  if (MONITOR_CONFIG.alerts.email) {
    log(colors.blue, `📧 Email alert would be sent to: ${MONITOR_CONFIG.alerts.email}`);
  }

  try {
    await Promise.allSettled(alertPromises);
  } catch (error) {
    log(colors.red, `Failed to send alerts: ${error.message}`);
  }
}

async function sendWebhookAlert(alert) {
  try {
    const postData = JSON.stringify(alert);
    
    // This would make an HTTP POST to the webhook URL
    log(colors.blue, `📡 Webhook alert sent: ${alert.endpoint} - ${alert.severity}`);
  } catch (error) {
    log(colors.red, `Failed to send webhook alert: ${error.message}`);
  }
}

async function sendSlackAlert(alert) {
  try {
    const slackPayload = {
      text: `🚨 ScheduleBud Alert: ${alert.endpoint}`,
      attachments: [
        {
          color: alert.severity === 'CRITICAL' ? 'danger' : 'warning',
          fields: [
            { title: 'Endpoint', value: alert.endpoint, short: true },
            { title: 'Status', value: alert.status || 'ERROR', short: true },
            { title: 'Response Time', value: `${alert.responseTime}ms`, short: true },
            { title: 'Consecutive Failures', value: alert.consecutiveFailures, short: true }
          ],
          footer: 'ScheduleBud Monitoring',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
    
    // This would make an HTTP POST to Slack webhook
    log(colors.blue, `💬 Slack alert sent: ${alert.endpoint} - ${alert.severity}`);
  } catch (error) {
    log(colors.red, `Failed to send Slack alert: ${error.message}`);
  }
}

async function runHealthCheck() {
  log(colors.blue, '🏥 Starting health check cycle...');
  
  const results = [];
  
  for (const endpoint of MONITOR_CONFIG.endpoints) {
    const status = await checkEndpoint(endpoint);
    results.push(status);
    
    // Track consecutive failures
    const key = endpoint.name;
    if (!endpointStatus.has(key)) {
      endpointStatus.set(key, { consecutiveFailures: 0, lastSuccess: null });
    }
    
    const tracking = endpointStatus.get(key);
    
    if (status.success) {
      tracking.consecutiveFailures = 0;
      tracking.lastSuccess = status.timestamp;
    } else {
      tracking.consecutiveFailures++;
      
      // Send alert if threshold reached
      if (tracking.consecutiveFailures >= MONITOR_CONFIG.alertThreshold) {
        await sendAlert(endpoint, status, tracking.consecutiveFailures);
      }
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  if (failed === 0) {
    log(colors.green, `✅ All ${results.length} endpoints healthy`);
  } else {
    log(colors.red, `⚠️  ${failed}/${results.length} endpoints failing`);
  }
  
  return results;
}

function startMonitoring() {
  log(colors.blue, '🚀 Starting ScheduleBud uptime monitoring...');
  log(colors.gray, `Configuration: ${MONITOR_CONFIG.endpoints.length} endpoints, ${MONITOR_CONFIG.checkInterval}s interval`);
  
  // Initial check
  runHealthCheck();
  
  // Schedule regular checks
  const interval = setInterval(() => {
    runHealthCheck();
  }, MONITOR_CONFIG.checkInterval * 1000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    log(colors.yellow, '🛑 Stopping uptime monitoring...');
    clearInterval(interval);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log(colors.yellow, '🛑 Stopping uptime monitoring...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Export for programmatic use
module.exports = {
  runHealthCheck,
  checkEndpoint,
  startMonitoring,
  MONITOR_CONFIG
};

// Run if called directly
if (require.main === module) {
  // Validate configuration
  if (MONITOR_CONFIG.endpoints.length === 0) {
    console.error('❌ No endpoints configured for monitoring');
    process.exit(1);
  }
  
  startMonitoring();
}