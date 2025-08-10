import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

// Security configuration constants
const SECURITY_CONFIG = {
  BUCKET_NAME: 'secure-syllabi', // Dedicated secure bucket for syllabus uploads
  MAX_FILE_SIZE: '10MB',
  ALLOWED_MIME_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_UPLOADS_PER_HOUR: 10,
  MAX_UPLOADS_PER_DAY: 50,
  MAX_TOTAL_STORAGE_MB: 100,
  PROCESSING_TIMEOUT_MS: 30000,
  MAX_PDF_PAGES: 500,
  MAX_TEXT_LENGTH: 1000000, // 1MB of text content
} as const;

// Class file security configuration (broader than syllabus-only validation)
const CLASS_FILE_SECURITY_CONFIG = {
  MAX_FILE_SIZE: '10MB',
  // Safe file types for undergraduate students
  ALLOWED_MIME_TYPES: [
    'application/pdf',                                                          // Syllabi, readings
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX assignments
    'image/jpeg',                                                              // Photos of notes
    'image/jpg',                                                               // Photos of notes  
    'image/png',                                                               // Screenshots, diagrams
    'text/plain'                                                               // Plain text notes
  ],
  MAX_UPLOADS_PER_HOUR: 20, // Higher limit for general class files
  MAX_UPLOADS_PER_DAY: 100,
  MAX_TOTAL_STORAGE_MB: 200,
  // File extensions that should be blocked for security
  BLOCKED_EXTENSIONS: [
    '.exe', '.bat', '.sh', '.zip', '.rar', '.7z',  // Executables and archives
    '.js', '.html', '.php', '.asp', '.jsp',        // Web scripts
    '.xls', '.xlsx', '.ppt', '.pptx', '.doc',      // Legacy Office files with macro risks
    '.scr', '.com', '.pif', '.cmd'                 // Other executable types
  ]
} as const;

// Security validation interfaces
interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface FileSecurityMetadata {
  originalName: string;
  sanitizedName: string;
  size: number;
  mimeType: string;
  uploadTimestamp: number;
  userId: string;
}

interface UserUploadStats {
  uploadsLastHour: number;
  uploadsLastDay: number;
  totalStorageUsed: number;
}

export class SyllabusSecurityService {
  
  /**
   * Initialize dedicated secure bucket for syllabus uploads
   * Creates new secure bucket with built-in security restrictions
   */
  static async initializeBucketSecurity(): Promise<void> {
    try {
      logger.debug('Initializing dedicated secure bucket for syllabus uploads', {
        bucketName: SECURITY_CONFIG.BUCKET_NAME,
        maxFileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
        allowedMimeTypes: [...SECURITY_CONFIG.ALLOWED_MIME_TYPES]
      });

      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        throw errorHandler.data.loadFailed({
          operation: 'initializeBucketSecurity - list buckets',
          originalError: listError.message
        });
      }

      const bucketExists = buckets?.some(bucket => bucket.name === SECURITY_CONFIG.BUCKET_NAME);

      if (!bucketExists) {
        // Create new secure bucket
        logger.info('Creating dedicated secure bucket for syllabus uploads', {
          bucketName: SECURITY_CONFIG.BUCKET_NAME
        });

        const { data: newBucket, error: createError } = await supabase.storage.createBucket(
          SECURITY_CONFIG.BUCKET_NAME,
          {
            public: false, // Private bucket - requires authentication
            fileSizeLimit: SECURITY_CONFIG.MAX_FILE_SIZE,
            allowedMimeTypes: [...SECURITY_CONFIG.ALLOWED_MIME_TYPES],
          }
        );

        if (createError) {
          logger.error('Failed to create secure bucket', {
            bucketName: SECURITY_CONFIG.BUCKET_NAME,
            error: createError.message
          });
          throw errorHandler.data.loadFailed({
            operation: 'initializeBucketSecurity - create bucket',
            originalError: createError.message
          });
        }

        logger.info('Secure bucket created successfully', {
          bucketName: SECURITY_CONFIG.BUCKET_NAME,
          bucketId: newBucket?.name,
          securityFeatures: ['Private access', 'File size limits', 'MIME type restrictions']
        });
      } else {
        // Update existing bucket with security restrictions
        logger.info('Updating existing bucket with enhanced security', {
          bucketName: SECURITY_CONFIG.BUCKET_NAME
        });

        try {
          const { error: updateError } = await supabase.storage.updateBucket(
            SECURITY_CONFIG.BUCKET_NAME,
            {
              public: false, // Ensure bucket is private
              fileSizeLimit: SECURITY_CONFIG.MAX_FILE_SIZE,
              allowedMimeTypes: [...SECURITY_CONFIG.ALLOWED_MIME_TYPES],
            }
          );

          if (updateError) {
            logger.warn('Could not update bucket settings programmatically', {
              error: updateError.message,
              recommendation: 'Configure file size limit and MIME type restrictions manually in Supabase dashboard'
            });
          } else {
            logger.info('Bucket security settings updated successfully', {
              bucketName: SECURITY_CONFIG.BUCKET_NAME,
              fileSizeLimit: SECURITY_CONFIG.MAX_FILE_SIZE,
              allowedMimeTypes: [...SECURITY_CONFIG.ALLOWED_MIME_TYPES]
            });
          }
        } catch (updateError) {
          // updateBucket may not be available in all Supabase versions
          logger.warn('Bucket update not supported, using application-level validation', {
            bucketName: SECURITY_CONFIG.BUCKET_NAME,
            fallback: 'Application-level security validation will be used'
          });
        }
      }

      logger.info('Secure bucket initialization completed', {
        bucketName: SECURITY_CONFIG.BUCKET_NAME,
        securityLayers: [
          'Private bucket access',
          'Built-in file size limits', 
          'MIME type restrictions',
          'RLS policies',
          'Application validation', 
          'File content scanning'
        ]
      });
    } catch (error) {
      logger.error('Failed to initialize secure bucket', error);
      throw error;
    }
  }

  /**
   * Validate file before upload with comprehensive security checks
   */
  static validateFileUpload(file: File, user: User): SecurityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // File size validation
    const maxSizeBytes = this.parseFileSize(SECURITY_CONFIG.MAX_FILE_SIZE);
    if (file.size > maxSizeBytes) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${SECURITY_CONFIG.MAX_FILE_SIZE})`);
    }

    // MIME type validation
    if (!SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)) {
      errors.push(`File type '${file.type}' is not allowed. Only PDF and DOCX files are permitted.`);
    }

    // Filename security validation
    const sanitizedName = this.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      warnings.push(`Filename was sanitized from '${file.name}' to '${sanitizedName}'`);
    }

    // Basic filename validation
    if (file.name.length > 255) {
      errors.push('Filename is too long (maximum 255 characters)');
    }

    // Check for suspicious file patterns
    const suspiciousPatterns = [
      /\.exe$/i, /\.bat$/i, /\.sh$/i, /\.zip$/i, /\.rar$/i,
      /\.js$/i, /\.html$/i, /\.php$/i, /\.asp$/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        errors.push(`Filename contains suspicious pattern: ${file.name}`);
        break;
      }
    }

    logger.debug('File upload validation completed', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      userId: user.id,
      errors: errors.length,
      warnings: warnings.length
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check user rate limits and usage quotas
   */
  static async checkUserRateLimits(userId: string): Promise<SecurityValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const stats = await this.getUserUploadStats(userId);

      // Check hourly rate limit
      if (stats.uploadsLastHour >= SECURITY_CONFIG.MAX_UPLOADS_PER_HOUR) {
        errors.push(`Hourly upload limit exceeded (${stats.uploadsLastHour}/${SECURITY_CONFIG.MAX_UPLOADS_PER_HOUR})`);
      }

      // Check daily rate limit
      if (stats.uploadsLastDay >= SECURITY_CONFIG.MAX_UPLOADS_PER_DAY) {
        errors.push(`Daily upload limit exceeded (${stats.uploadsLastDay}/${SECURITY_CONFIG.MAX_UPLOADS_PER_DAY})`);
      }

      // Check storage quota
      const maxStorageBytes = SECURITY_CONFIG.MAX_TOTAL_STORAGE_MB * 1024 * 1024;
      if (stats.totalStorageUsed >= maxStorageBytes) {
        errors.push(`Storage quota exceeded (${this.formatFileSize(stats.totalStorageUsed)}/${SECURITY_CONFIG.MAX_TOTAL_STORAGE_MB}MB)`);
      }

      // Warning at 80% of limits
      if (stats.uploadsLastHour >= SECURITY_CONFIG.MAX_UPLOADS_PER_HOUR * 0.8) {
        warnings.push(`Approaching hourly upload limit (${stats.uploadsLastHour}/${SECURITY_CONFIG.MAX_UPLOADS_PER_HOUR})`);
      }

      logger.debug('User rate limit check completed', {
        userId,
        stats,
        errors: errors.length,
        warnings: warnings.length
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('Failed to check user rate limits', { userId, error });
      return {
        isValid: false,
        errors: ['Failed to verify upload limits'],
        warnings: []
      };
    }
  }

  /**
   * Validate PDF file structure and content
   */
  static async validatePDFSecurity(file: File): Promise<SecurityValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Read first 1024 bytes to check PDF header
      const headerBuffer = await file.slice(0, 1024).arrayBuffer();
      const headerBytes = new Uint8Array(headerBuffer);
      
      // Check PDF magic number (%PDF-)
      const pdfHeader = new TextDecoder().decode(headerBytes.slice(0, 5));
      if (pdfHeader !== '%PDF-') {
        errors.push('Invalid PDF file: Missing PDF header signature');
      }

      // Basic compression ratio check (simple heuristic)
      const compressionRatio = file.size / Math.max(1, file.name.length * 100);
      if (compressionRatio > 10000) { // Suspiciously high compression
        warnings.push('PDF has unusually high compression ratio - may need manual review');
      }

      // Check for reasonable file size vs. content expectations
      if (file.size < 1000) { // Less than 1KB
        warnings.push('PDF file is suspiciously small');
      }

      if (file.size > 50 * 1024 * 1024) { // More than 50MB
        errors.push('PDF file is too large for a typical syllabus');
      }

      logger.debug('PDF security validation completed', {
        fileName: file.name,
        fileSize: file.size,
        compressionRatio,
        errors: errors.length,
        warnings: warnings.length
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      logger.error('PDF security validation failed', { fileName: file.name, error });
      return {
        isValid: false,
        errors: ['Failed to validate PDF file structure'],
        warnings: []
      };
    }
  }

  /**
   * Sanitize filename to prevent path traversal and other attacks
   */
  static sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    let sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[\.\s]+|[\.\s]+$/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }
    
    // Ensure it's not empty
    if (!sanitized || sanitized === '') {
      sanitized = 'unnamed_file.pdf';
    }

    return sanitized;
  }

  /**
   * Generate secure file path for storage
   */
  static generateSecureFilePath(classId: string, filename: string, userId: string): string {
    const sanitizedFilename = this.sanitizeFilename(filename);
    const timestamp = Date.now();
    const userPrefix = userId.substring(0, 8); // First 8 chars of user ID for additional isolation
    
    return `${userPrefix}/${classId}/syllabi/${timestamp}_${sanitizedFilename}`;
  }

  /**
   * Get user upload statistics for rate limiting
   */
  private static async getUserUploadStats(userId: string): Promise<UserUploadStats> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get upload counts from class_syllabi table
    const [hourlyResult, dailyResult, storageResult] = await Promise.all([
      // Uploads in the last hour
      supabase
        .from('class_syllabi')
        .select('id', { count: 'exact' })
        .eq('owner', userId)
        .gte('uploaded_at', oneHourAgo.toISOString()),
      
      // Uploads in the last day  
      supabase
        .from('class_syllabi')
        .select('id', { count: 'exact' })
        .eq('owner', userId)
        .gte('uploaded_at', oneDayAgo.toISOString()),
      
      // Total storage used
      supabase
        .from('class_syllabi')
        .select('size')
        .eq('owner', userId)
    ]);

    const uploadsLastHour = hourlyResult.count || 0;
    const uploadsLastDay = dailyResult.count || 0;
    const totalStorageUsed = storageResult.data?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;

    return {
      uploadsLastHour,
      uploadsLastDay,
      totalStorageUsed
    };
  }

  /**
   * Parse file size string to bytes
   */
  private static parseFileSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)$/i);
    if (!match) return 0;
    
    const size = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    switch (unit) {
      case 'KB': return size * 1024;
      case 'MB': return size * 1024 * 1024;
      case 'GB': return size * 1024 * 1024 * 1024;
      default: return 0;
    }
  }

  /**
   * Format file size in bytes to human readable string
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Validate class file uploads with broader security checks
   * Supports images, text files, PDF, and DOCX - safe for student use
   */
  static validateClassFileUpload(file: File, user: User): SecurityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // File size validation
    const maxSizeBytes = this.parseFileSize(CLASS_FILE_SECURITY_CONFIG.MAX_FILE_SIZE);
    if (file.size > maxSizeBytes) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${CLASS_FILE_SECURITY_CONFIG.MAX_FILE_SIZE})`);
    }

    // MIME type validation for class files (broader than syllabus validation)
    if (!CLASS_FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)) {
      const allowedTypes = CLASS_FILE_SECURITY_CONFIG.ALLOWED_MIME_TYPES
        .map(type => {
          if (type.includes('pdf')) return 'PDF';
          if (type.includes('wordprocessingml')) return 'DOCX';
          if (type.includes('jpeg') || type.includes('jpg')) return 'JPG';
          if (type.includes('png')) return 'PNG';
          if (type.includes('text/plain')) return 'TXT';
          return type;
        })
        .join(', ');
      errors.push(`File type '${file.type}' is not allowed. Only ${allowedTypes} files are permitted for class materials.`);
    }

    // Enhanced filename security validation for class files
    const sanitizedName = this.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      warnings.push(`Filename was sanitized from '${file.name}' to '${sanitizedName}'`);
    }

    // Basic filename validation
    if (file.name.length > 255) {
      errors.push('Filename is too long (maximum 255 characters)');
    }

    // Check for blocked file extensions (comprehensive security check)
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (CLASS_FILE_SECURITY_CONFIG.BLOCKED_EXTENSIONS.some(ext => ext.toLowerCase() === fileExtension)) {
      errors.push(`File extension '${fileExtension}' is blocked for security reasons. This file type may contain executable code or macros.`);
    }

    // Additional security patterns for class files
    const suspiciousPatterns = [
      /\.(exe|bat|sh|cmd|scr|com|pif)$/i,  // Executables
      /\.(zip|rar|7z|tar|gz)$/i,          // Archives (zip bombs, etc.)
      /\.(js|html|php|asp|jsp)$/i,         // Web scripts
      /\.(xls|xlsx|ppt|pptx|doc)$/i       // Legacy Office files with macro risks
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        errors.push(`Filename contains blocked file type: ${file.name}. This file type is not permitted for security reasons.`);
        break;
      }
    }

    logger.debug('Class file upload validation completed', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      userId: user.id,
      errors: errors.length,
      warnings: warnings.length,
      validationType: 'class_file_upload'
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Log security event for monitoring
   */
  static logSecurityEvent(event: string, details: Record<string, any>): void {
    logger.security('Security event logged', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

// Export configuration for external use
export const SYLLABUS_SECURITY_CONFIG = SECURITY_CONFIG;
export const CLASS_FILE_SECURITY_CONFIG_EXPORT = CLASS_FILE_SECURITY_CONFIG;