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
  monthlyRetention: 12   // Keep monthly backups for 12 months
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
 * Verify backup integrity
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
    
    // Cleanup old backups
    if (!options.noCleanup) {
      cleanupOldBackups();
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
      duration
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
        noCleanup: args.includes('--no-cleanup')
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
      
    default:
      console.log(`
🗄️  ScheduleBud Database Backup Tool

Usage:
  npm run db:backup              # Run full backup
  npm run db:backup -- --table-only    # Table-level backup only
  npm run db:backup -- --no-cleanup    # Skip cleanup
  
  node scripts/backup-database.js status   # Show backup status
  node scripts/backup-database.js cleanup  # Clean old backups
  node scripts/backup-database.js verify <file>  # Verify backup
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
  cleanupOldBackups,
  BACKUP_CONFIG
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(colors.red, `💥 Fatal error: ${error.message}`);
    process.exit(1);
  });
}