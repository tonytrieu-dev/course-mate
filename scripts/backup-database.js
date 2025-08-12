#!/usr/bin/env node

/**
 * Database Backup Script for ScheduleBud (Supabase)
 * 
 * Handles backup procedures, scheduling, and disaster recovery
 * for ScheduleBud's Supabase PostgreSQL database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

// Configuration
const BACKUP_CONFIG = {
  // Supabase configuration
  supabaseUrl: process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Service role key needed for admin operations
  supabaseDbUrl: process.env.SUPABASE_DB_URL, // Direct database URL for pg_dump
  
  // Backup settings
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: parseInt(process.env.MAX_BACKUPS) || 30, // Keep 30 days of backups
  compressionLevel: 6, // gzip compression level (1-9)
  
  // Tables to backup (null = all tables)
  tables: [
    'profiles',
    'tasks', 
    'classes',
    'task_types',
    'study_sessions',
    'grades',
    'assignments',
    'settings'
  ],
  
  // Exclude sensitive tables if needed
  excludeTables: [],
  
  // Retention policy
  dailyRetention: 30,    // Keep daily backups for 30 days
  weeklyRetention: 12,   // Keep weekly backups for 12 weeks
  monthlyRetention: 12,  // Keep monthly backups for 12 months
  
  // Cloudflare R2 configuration (free tier: 10GB storage)
  cloudflare: {
    enabled: process.env.CLOUDFLARE_R2_ENABLED === 'true',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'schedulebud-backups',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT, // e.g., https://accountid.r2.cloudflarestorage.com
    region: 'auto' // Cloudflare R2 uses 'auto' region
  }
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
  console.log(`${color}${timestamp} ${message}${colors.reset}`);
}

/**
 * Initialize Supabase client
 */
function initSupabase() {
  if (!BACKUP_CONFIG.supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }
  
  const serviceKey = BACKUP_CONFIG.supabaseKey;
  if (!serviceKey) {
    log(colors.yellow, '⚠️  No service role key found, using anon key (limited functionality)');
    return createClient(
      BACKUP_CONFIG.supabaseUrl, 
      process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
    );
  }
  
  return createClient(BACKUP_CONFIG.supabaseUrl, serviceKey);
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDirectory() {
  if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
    fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
    log(colors.blue, `📁 Created backup directory: ${BACKUP_CONFIG.backupDir}`);
  }
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename(type = 'full') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `schedulebud_${type}_${timestamp}.sql`;
}

/**
 * Perform full database backup using pg_dump (if available)
 */
async function performFullBackup() {
  const filename = generateBackupFilename('full');
  const filepath = path.join(BACKUP_CONFIG.backupDir, filename);
  
  if (!BACKUP_CONFIG.supabaseDbUrl) {
    log(colors.yellow, '⚠️  No direct database URL available, falling back to table-level backup');
    return performTableBackup();
  }
  
  log(colors.blue, '🗃️  Starting full database backup...');
  
  return new Promise((resolve, reject) => {
    const args = [
      '--verbose',
      '--clean',
      '--no-owner',
      '--no-privileges',
      '--format=custom',
      '--file', filepath,
      BACKUP_CONFIG.supabaseDbUrl
    ];
    
    const pgDump = spawn('pg_dump', args);
    
    pgDump.stdout.on('data', (data) => {
      log(colors.gray, data.toString().trim());
    });
    
    pgDump.stderr.on('data', (data) => {
      log(colors.yellow, data.toString().trim());
    });
    
    pgDump.on('close', (code) => {
      if (code === 0) {
        log(colors.green, `✅ Full backup completed: ${filename}`);
        compressBackup(filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`pg_dump failed with code ${code}`));
      }
    });
    
    pgDump.on('error', (error) => {
      if (error.code === 'ENOENT') {
        log(colors.yellow, '⚠️  pg_dump not found, falling back to table-level backup');
        performTableBackup().then(resolve).catch(reject);
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Perform table-level backup using Supabase client
 */
async function performTableBackup() {
  const filename = generateBackupFilename('tables');
  const filepath = path.join(BACKUP_CONFIG.backupDir, filename);
  
  log(colors.blue, '📊 Starting table-level backup...');
  
  const supabase = initSupabase();
  const backupData = {};
  
  try {
    // Get list of tables to backup
    const tablesToBackup = BACKUP_CONFIG.tables || await getTableList(supabase);
    
    for (const table of tablesToBackup) {
      if (BACKUP_CONFIG.excludeTables.includes(table)) {
        log(colors.gray, `⏭️  Skipping excluded table: ${table}`);
        continue;
      }
      
      log(colors.blue, `📋 Backing up table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');
      
      if (error) {
        log(colors.yellow, `⚠️  Failed to backup table ${table}: ${error.message}`);
        continue;
      }
      
      backupData[table] = {
        table_name: table,
        row_count: data?.length || 0,
        backed_up_at: new Date().toISOString(),
        data: data || []
      };
      
      log(colors.green, `✅ Backed up ${data?.length || 0} rows from ${table}`);
    }
    
    // Write backup to file
    const backupContent = {
      backup_info: {
        type: 'table_level',
        created_at: new Date().toISOString(),
        supabase_url: BACKUP_CONFIG.supabaseUrl,
        tables_backed_up: Object.keys(backupData).length,
        total_rows: Object.values(backupData).reduce((sum, table) => sum + table.row_count, 0)
      },
      tables: backupData
    };
    
    fs.writeFileSync(filepath, JSON.stringify(backupContent, null, 2));
    log(colors.green, `💾 Table backup saved: ${filename}`);
    
    return compressBackup(filepath);
  } catch (error) {
    throw new Error(`Table backup failed: ${error.message}`);
  }
}

/**
 * Get list of all tables in database
 */
async function getTableList(supabase) {
  try {
    // This requires service role access
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_type', 'VIEW');
    
    if (error) throw error;
    
    return data.map(row => row.table_name);
  } catch (error) {
    log(colors.yellow, '⚠️  Could not get table list, using configured tables');
    return BACKUP_CONFIG.tables;
  }
}

/**
 * Compress backup file
 */
async function compressBackup(filepath) {
  return new Promise((resolve, reject) => {
    const compressedPath = `${filepath}.gz`;
    
    const gzip = spawn('gzip', ['-' + BACKUP_CONFIG.compressionLevel, filepath]);
    
    gzip.on('close', (code) => {
      if (code === 0) {
        log(colors.green, `🗜️  Backup compressed: ${path.basename(compressedPath)}`);
        resolve(compressedPath);
      } else {
        reject(new Error(`Compression failed with code ${code}`));
      }
    });
    
    gzip.on('error', (error) => {
      log(colors.yellow, '⚠️  Compression failed, keeping uncompressed backup');
      resolve(filepath);
    });
  });
}

/**
 * Clean up old backups based on retention policy
 */
function cleanupOldBackups() {
  log(colors.blue, '🧹 Cleaning up old backups...');
  
  try {
    const files = fs.readdirSync(BACKUP_CONFIG.backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('schedulebud_') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
      .map(file => {
        const filepath = path.join(BACKUP_CONFIG.backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          name: file,
          path: filepath,
          date: stats.mtime,
          age: Date.now() - stats.mtime.getTime()
        };
      })
      .sort((a, b) => b.date - a.date); // Sort by date, newest first
    
    const maxAge = BACKUP_CONFIG.dailyRetention * 24 * 60 * 60 * 1000;
    const filesToDelete = backupFiles.filter(file => file.age > maxAge);
    
    if (filesToDelete.length > BACKUP_CONFIG.maxBackups) {
      const excessFiles = backupFiles.slice(BACKUP_CONFIG.maxBackups);
      filesToDelete.push(...excessFiles);
    }
    
    filesToDelete.forEach(file => {
      try {
        fs.unlinkSync(file.path);
        log(colors.gray, `🗑️  Deleted old backup: ${file.name}`);
      } catch (error) {
        log(colors.yellow, `⚠️  Failed to delete ${file.name}: ${error.message}`);
      }
    });
    
    log(colors.green, `✅ Cleanup completed: ${filesToDelete.length} old backups removed`);
  } catch (error) {
    log(colors.red, `❌ Cleanup failed: ${error.message}`);
  }
}

/**
 * Verify backup integrity (basic check)
 */
async function verifyBackup(backupPath) {
  log(colors.blue, `🔍 Verifying backup: ${path.basename(backupPath)}`);
  
  try {
    if (backupPath.endsWith('.gz')) {
      // For compressed files, just check if they can be read
      const zcat = spawn('zcat', [backupPath]);
      return new Promise((resolve) => {
        let hasContent = false;
        
        zcat.stdout.on('data', () => {
          hasContent = true;
        });
        
        zcat.on('close', (code) => {
          if (code === 0 && hasContent) {
            log(colors.green, '✅ Backup verification passed');
            resolve(true);
          } else {
            log(colors.red, '❌ Backup verification failed');
            resolve(false);
          }
        });
      });
    } else if (backupPath.endsWith('.sql')) {
      // For JSON backups, parse and validate structure
      const content = fs.readFileSync(backupPath, 'utf8');
      const backup = JSON.parse(content);
      
      const isValid = backup.backup_info && 
                     backup.tables && 
                     Object.keys(backup.tables).length > 0;
      
      if (isValid) {
        log(colors.green, `✅ Backup verification passed: ${backup.backup_info.total_rows} total rows`);
        return true;
      } else {
        log(colors.red, '❌ Backup verification failed: Invalid structure');
        return false;
      }
    }
  } catch (error) {
    log(colors.red, `❌ Backup verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Comprehensive backup integrity verification
 */
async function verifyBackupIntegrity(backupPath) {
  log(colors.blue, `🔬 Running comprehensive backup verification: ${path.basename(backupPath)}`);
  
  const results = {
    fileExists: false,
    fileSize: 0,
    checksumValid: false,
    contentValid: false,
    structureValid: false,
    dataValid: false,
    errors: []
  };
  
  try {
    // 1. File existence and size check
    if (!fs.existsSync(backupPath)) {
      results.errors.push('Backup file does not exist');
      return results;
    }
    
    const stats = fs.statSync(backupPath);
    results.fileExists = true;
    results.fileSize = stats.size;
    
    if (stats.size === 0) {
      results.errors.push('Backup file is empty');
      return results;
    }
    
    log(colors.blue, `📏 File size: ${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`);
    
    // 2. Checksum verification (for future integrity)
    const fileContent = fs.readFileSync(backupPath);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    results.checksum = checksum;
    results.checksumValid = true;
    log(colors.blue, `🔐 SHA256: ${checksum.substring(0, 16)}...`);
    
    // 3. Content format verification
    if (backupPath.endsWith('.gz')) {
      // Compressed file verification
      const zcat = spawn('zcat', [backupPath]);
      
      return new Promise((resolve) => {
        let contentSize = 0;
        let hasValidContent = false;
        
        zcat.stdout.on('data', (chunk) => {
          contentSize += chunk.length;
          const content = chunk.toString();
          
          // Check for SQL or JSON markers
          if (content.includes('INSERT INTO') || 
              content.includes('CREATE TABLE') ||
              content.includes('"backup_info"')) {
            hasValidContent = true;
          }
        });
        
        zcat.on('close', (code) => {
          results.contentValid = code === 0 && contentSize > 0;
          results.structureValid = hasValidContent;
          
          if (results.contentValid && results.structureValid) {
            log(colors.green, `✅ Compressed backup verification passed (${Math.round(contentSize / 1024)} KB uncompressed)`);
          } else {
            results.errors.push('Compressed backup content invalid');
          }
          
          resolve(results);
        });
        
        zcat.on('error', (error) => {
          results.errors.push(`Decompression error: ${error.message}`);
          resolve(results);
        });
      });
      
    } else if (backupPath.endsWith('.sql')) {
      // JSON backup verification
      try {
        const content = fs.readFileSync(backupPath, 'utf8');
        const backup = JSON.parse(content);
        
        results.contentValid = true;
        
        // 4. Structure validation
        const hasBackupInfo = backup.backup_info && backup.backup_info.created_at;
        const hasTables = backup.tables && typeof backup.tables === 'object';
        const hasTableData = hasTables && Object.keys(backup.tables).length > 0;
        
        results.structureValid = hasBackupInfo && hasTables;
        
        if (results.structureValid) {
          log(colors.blue, `📊 Backup contains ${Object.keys(backup.tables).length} tables`);
          
          // 5. Data validation
          let totalRows = 0;
          let validTables = 0;
          
          for (const [tableName, tableData] of Object.entries(backup.tables)) {
            if (tableData.data && Array.isArray(tableData.data)) {
              totalRows += tableData.data.length;
              validTables++;
              log(colors.gray, `   📋 ${tableName}: ${tableData.data.length} rows`);
            }
          }
          
          results.dataValid = validTables > 0 && totalRows > 0;
          results.totalRows = totalRows;
          results.validTables = validTables;
          
          if (results.dataValid) {
            log(colors.green, `✅ Comprehensive verification passed: ${validTables} tables, ${totalRows} total rows`);
          } else {
            results.errors.push('No valid table data found');
          }
        } else {
          results.errors.push('Invalid backup structure');
        }
        
      } catch (parseError) {
        results.errors.push(`JSON parsing error: ${parseError.message}`);
      }
    } else {
      results.errors.push('Unknown backup file format');
    }
    
  } catch (error) {
    results.errors.push(`Verification error: ${error.message}`);
  }
  
  // Summary
  if (results.errors.length > 0) {
    log(colors.red, `❌ Verification failed with ${results.errors.length} errors:`);
    results.errors.forEach(error => log(colors.red, `   • ${error}`));
  }
  
  return results;
}

/**
 * Verify all backups in backup directory
 */
async function verifyAllBackups() {
  log(colors.blue, '🔍 Verifying all backups in backup directory...');
  
  try {
    const files = fs.readdirSync(BACKUP_CONFIG.backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('schedulebud_') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
      .sort();
    
    if (backupFiles.length === 0) {
      log(colors.yellow, '⚠️  No backup files found');
      return { success: false, error: 'No backups to verify' };
    }
    
    log(colors.blue, `📁 Found ${backupFiles.length} backup files`);
    
    const results = [];
    let passedCount = 0;
    let failedCount = 0;
    
    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_CONFIG.backupDir, file);
      const result = await verifyBackup(filePath);
      
      results.push({
        file,
        passed: result,
        size: fs.statSync(filePath).size
      });
      
      if (result) {
        passedCount++;
      } else {
        failedCount++;
      }
    }
    
    // Summary
    log(colors.blue, '\n📊 Verification Summary:');
    log(colors.green, `   ✅ Passed: ${passedCount}`);
    if (failedCount > 0) {
      log(colors.red, `   ❌ Failed: ${failedCount}`);
    }
    
    const totalSize = results.reduce((sum, r) => sum + r.size, 0);
    log(colors.blue, `   📦 Total size: ${Math.round(totalSize / 1024 / 1024 * 100) / 100} MB`);
    
    return {
      success: failedCount === 0,
      passed: passedCount,
      failed: failedCount,
      results
    };
    
  } catch (error) {
    log(colors.red, `❌ Backup verification failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Upload backup to Cloudflare R2
 */
async function uploadToCloudflareR2(backupPath) {
  if (!BACKUP_CONFIG.cloudflare.enabled) {
    log(colors.gray, '⏭️  Cloudflare R2 upload disabled');
    return null;
  }

  if (!BACKUP_CONFIG.cloudflare.accessKeyId || !BACKUP_CONFIG.cloudflare.secretAccessKey) {
    log(colors.yellow, '⚠️  Cloudflare R2 credentials not configured, skipping upload');
    return null;
  }

  log(colors.blue, '☁️  Uploading backup to Cloudflare R2...');

  try {
    // Generate S3-compatible request for Cloudflare R2
    const filename = path.basename(backupPath);
    const fileContent = fs.readFileSync(backupPath);
    const stats = fs.statSync(backupPath);
    
    // Create S3-compatible signature for Cloudflare R2
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const region = BACKUP_CONFIG.cloudflare.region;
    const service = 's3';
    
    // Build the request
    const method = 'PUT';
    const host = BACKUP_CONFIG.cloudflare.endpoint.replace('https://', '');
    const uri = `/${BACKUP_CONFIG.cloudflare.bucketName}/${filename}`;
    
    // Calculate content hash
    const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
    
    // Build canonical request for signing
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${contentHash}\nx-amz-date:${timestamp}T000000Z\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `${method}\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${contentHash}`;
    
    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${timestamp}/${region}/${service}/aws4_request`;
    const stringToSign = `${algorithm}\n${timestamp}T000000Z\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;
    
    // Calculate signature
    const kDate = crypto.createHmac('sha256', `AWS4${BACKUP_CONFIG.cloudflare.secretAccessKey}`).update(timestamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    
    // Build authorization header
    const authorization = `${algorithm} Credential=${BACKUP_CONFIG.cloudflare.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    // Make the request using native HTTPS
    const https = require('https');
    const url = require('url');
    
    const uploadUrl = `${BACKUP_CONFIG.cloudflare.endpoint}${uri}`;
    const urlParts = url.parse(uploadUrl);
    
    const options = {
      hostname: urlParts.hostname,
      port: urlParts.port || 443,
      path: urlParts.path,
      method: method,
      headers: {
        'Host': host,
        'X-Amz-Content-Sha256': contentHash,
        'X-Amz-Date': `${timestamp}T000000Z`,
        'Authorization': authorization,
        'Content-Type': 'application/octet-stream',
        'Content-Length': stats.size
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            const sizeMB = Math.round(stats.size / 1024 / 1024 * 100) / 100;
            log(colors.green, `✅ Backup uploaded to Cloudflare R2: ${filename} (${sizeMB} MB)`);
            resolve({
              success: true,
              filename,
              size: stats.size,
              url: uploadUrl
            });
          } else {
            log(colors.red, `❌ R2 upload failed: ${res.statusCode} ${responseData}`);
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${responseData}` });
          }
        });
      });
      
      req.on('error', (error) => {
        log(colors.red, `❌ R2 upload error: ${error.message}`);
        resolve({ success: false, error: error.message });
      });
      
      // Write the file content
      req.write(fileContent);
      req.end();
    });
    
  } catch (error) {
    log(colors.red, `❌ R2 upload failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Clean up old backups from Cloudflare R2
 */
async function cleanupCloudflareR2() {
  if (!BACKUP_CONFIG.cloudflare.enabled) {
    return;
  }

  log(colors.blue, '🧹 Cleaning up old R2 backups...');
  
  try {
    // This would require listing objects from R2 and deleting old ones
    // For simplicity, we'll rely on local cleanup and R2's lifecycle policies
    log(colors.gray, '💡 Set up R2 lifecycle policies in Cloudflare dashboard for automatic cleanup');
  } catch (error) {
    log(colors.yellow, `⚠️  R2 cleanup warning: ${error.message}`);
  }
}

/**
 * Get backup status and statistics
 */
function getBackupStatus() {
  try {
    const files = fs.readdirSync(BACKUP_CONFIG.backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('schedulebud_'))
      .map(file => {
        const filepath = path.join(BACKUP_CONFIG.backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          name: file,
          size: stats.size,
          date: stats.mtime,
          age: Date.now() - stats.mtime.getTime()
        };
      })
      .sort((a, b) => b.date - a.date);
    
    const totalSize = backupFiles.reduce((sum, file) => sum + file.size, 0);
    const latestBackup = backupFiles[0];
    
    return {
      total_backups: backupFiles.length,
      total_size: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
      latest_backup: latestBackup ? {
        name: latestBackup.name,
        date: latestBackup.date.toISOString(),
        age_hours: Math.round(latestBackup.age / 1000 / 60 / 60),
        size_mb: Math.round(latestBackup.size / 1024 / 1024 * 100) / 100
      } : null,
      backup_directory: BACKUP_CONFIG.backupDir
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Main backup function
 */
async function runBackup(options = {}) {
  const startTime = Date.now();
  
  try {
    log(colors.blue, '🚀 Starting ScheduleBud database backup...');
    
    // Ensure backup directory exists
    ensureBackupDirectory();
    
    // Perform backup
    let backupPath;
    if (options.tableOnly || !BACKUP_CONFIG.supabaseDbUrl) {
      backupPath = await performTableBackup();
    } else {
      backupPath = await performFullBackup();
    }
    
    // Verify backup
    const isValid = await verifyBackup(backupPath);
    if (!isValid) {
      throw new Error('Backup verification failed');
    }
    
    // Upload to Cloudflare R2 if enabled
    let cloudUploadResult = null;
    if (!options.noCloudUpload) {
      cloudUploadResult = await uploadToCloudflareR2(backupPath);
    }
    
    // Cleanup old backups
    if (!options.noCleanup) {
      cleanupOldBackups();
      await cleanupCloudflareR2();
    }
    
    const duration = Date.now() - startTime;
    const stats = fs.statSync(backupPath);
    const sizeMB = Math.round(stats.size / 1024 / 1024 * 100) / 100;
    
    log(colors.green, `🎉 Backup completed successfully!`);
    log(colors.green, `   File: ${path.basename(backupPath)}`);
    log(colors.green, `   Size: ${sizeMB} MB`);
    log(colors.green, `   Duration: ${Math.round(duration / 1000)}s`);
    
    return {
      success: true,
      filepath: backupPath,
      size: stats.size,
      duration,
      cloudUpload: cloudUploadResult
    };
  } catch (error) {
    log(colors.red, `❌ Backup failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'backup';
  
  switch (command) {
    case 'backup':
      const options = {
        tableOnly: args.includes('--table-only'),
        noCleanup: args.includes('--no-cleanup'),
        noCloudUpload: args.includes('--no-cloud-upload')
      };
      await runBackup(options);
      break;
      
    case 'status':
      const status = getBackupStatus();
      console.log('\n📊 Backup Status:');
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'cleanup':
      cleanupOldBackups();
      break;
      
    case 'verify':
      const backupPath = args[1];
      if (!backupPath) {
        console.error('❌ Please provide backup file path');
        process.exit(1);
      }
      await verifyBackup(backupPath);
      break;
      
    case 'verify-integrity':
      const integityPath = args[1];
      if (!integityPath) {
        console.error('❌ Please provide backup file path');
        process.exit(1);
      }
      const integrityResult = await verifyBackupIntegrity(integityPath);
      console.log('\n🔬 Integrity Check Results:');
      console.log(JSON.stringify(integrityResult, null, 2));
      break;
      
    case 'verify-all':
      const allResults = await verifyAllBackups();
      if (!allResults.success) {
        process.exit(1);
      }
      break;
      
    default:
      console.log(`
🗄️  ScheduleBud Database Backup Tool with Cloudflare R2 Support

Usage:
  npm run db:backup              # Run full backup with cloud upload
  npm run db:backup -- --table-only    # Table-level backup only
  npm run db:backup -- --no-cleanup    # Skip cleanup
  npm run db:backup -- --no-cloud-upload  # Skip Cloudflare R2 upload
  
  node scripts/backup-database.js status   # Show backup status
  node scripts/backup-database.js cleanup  # Clean old backups
  node scripts/backup-database.js verify <file>  # Basic backup verification
  node scripts/backup-database.js verify-integrity <file>  # Comprehensive integrity check
  node scripts/backup-database.js verify-all  # Verify all backups in directory

Environment Variables for Cloudflare R2:
  CLOUDFLARE_R2_ENABLED=true
  CLOUDFLARE_ACCOUNT_ID=your-account-id
  CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
  CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
  CLOUDFLARE_R2_BUCKET_NAME=schedulebud-backups
  CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
      `);
      break;
  }
}

// Export for programmatic use
module.exports = {
  runBackup,
  performFullBackup,
  performTableBackup,
  getBackupStatus,
  verifyBackup,
  verifyBackupIntegrity,
  verifyAllBackups,
  uploadToCloudflareR2,
  cleanupOldBackups,
  cleanupCloudflareR2,
  BACKUP_CONFIG
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(colors.red, `💥 Fatal error: ${error.message}`);
    process.exit(1);
  });
}