/**
 * Cache Service for Smart Upload Optimization
 * 
 * Provides file fingerprint caching, deduplication, and smart cache management
 * for the upload pipeline. This service is standalone and doesn't affect existing
 * functionality - it only provides optimization opportunities.
 * 
 * All operations gracefully degrade to existing functionality on failures.
 */

import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { errorHandler } from '../utils/errorHandler';
import type {
  FileFingerprintCache,
  FileFingerprintRow,
  CachedTaskData,
  TaskGenerationMetadata,
  ProcessingStatus,
  CacheQueryOptions,
  CacheOperationResult,
  CacheStatistics
} from '../types/cache';
import { DEFAULT_CACHE_CONFIG } from '../types/cache';
import type {
  FileFingerprint,
  generateFileHash,
  createFileFingerprint
} from '../utils/fileFingerprinting';

/**
 * Cache service class for managing file fingerprints and cached data
 */
export class CacheService {
  private static instance: CacheService;
  // @ts-ignore - Cache system not yet integrated into pipeline
  private readonly config = DEFAULT_CACHE_CONFIG;

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Check if a file fingerprint exists in cache
   */
  async checkFingerprint(contentHash: string): Promise<FileFingerprintCache | null> {
    try {
      logger.debug('Checking file fingerprint cache', {
        contentHash: contentHash.substring(0, 12) + '...',
        operation: 'cache_lookup'
      });

      const { data, error } = await supabase
        .from('file_fingerprints')
        .select('*')
        .eq('content_hash', contentHash)
        .maybeSingle();

      if (error) {
        logger.warn('Cache lookup failed', {
          contentHash: contentHash.substring(0, 12) + '...',
          error: error.message
        });
        return null; // Graceful degradation
      }

      if (!data) {
        logger.debug('No cache entry found for fingerprint', {
          contentHash: contentHash.substring(0, 12) + '...'
        });
        return null;
      }

      // Transform database row to cache object
      const cacheEntry = this.transformRowToCache(data);
      
      // Update last used timestamp asynchronously (don't block)
      this.updateLastUsed(contentHash).catch(error => {
        logger.debug('Failed to update last_used timestamp', { error });
      });

      logger.info('Cache hit for file fingerprint', {
        contentHash: contentHash.substring(0, 12) + '...',
        processingStatus: cacheEntry.processingStatus,
        useCount: cacheEntry.useCount,
        hasExtractedText: !!cacheEntry.extractedText,
        hasGeneratedTasks: !!cacheEntry.generatedTasks
      });

      return cacheEntry;

    } catch (error) {
      logger.error('Cache fingerprint check failed', {
        contentHash: contentHash.substring(0, 12) + '...',
        error: error instanceof Error ? error.message : String(error)
      });
      return null; // Graceful degradation
    }
  }

  /**
   * Store file fingerprint and initial metadata in cache
   */
  async storeFingerprint(
    fingerprint: FileFingerprint,
    options: {
      classId?: string;
      userId?: string;
      processingStatus?: ProcessingStatus;
    } = {}
  ): Promise<FileFingerprintCache | null> {
    try {
      const { classId, userId, processingStatus = 'pending' } = options;

      logger.debug('Storing file fingerprint in cache', {
        contentHash: fingerprint.contentHash.substring(0, 12) + '...',
        filename: fingerprint.filename,
        size: fingerprint.size,
        classId,
        processingStatus
      });

      const insertData = {
        content_hash: fingerprint.contentHash,
        file_name: fingerprint.filename,
        file_size: fingerprint.size,
        mime_type: fingerprint.mimeType,
        processing_status: processingStatus,
        class_id: classId || null,
        user_id: userId || null,
        use_count: 0,
        embeddings_created: false,
        created_at: new Date().toISOString(),
        last_used_at: new Date().toISOString()
      };

      logger.info('🔍 ATTEMPTING DATABASE INSERT', {
        tableName: 'file_fingerprints',
        contentHash: fingerprint.contentHash.substring(0, 12) + '...',
        contentHashLength: fingerprint.contentHash.length,
        fileName: fingerprint.filename,
        fileSize: fingerprint.size,
        mimeType: fingerprint.mimeType,
        processingStatus,
        classId,
        userId,
        insertDataKeys: Object.keys(insertData)
      });

      const { data, error } = await supabase
        .from('file_fingerprints')
        .insert(insertData)
        .select()
        .maybeSingle();

      if (error) {
        // If it's a unique constraint violation, the fingerprint already exists
        if (error.code === '23505') {
          logger.debug('Fingerprint already exists in cache', {
            contentHash: fingerprint.contentHash.substring(0, 12) + '...'
          });
          return await this.checkFingerprint(fingerprint.contentHash);
        }

        // Foreign key constraint violation - invalid class_id or user_id
        if (error.code === '23503') {
          logger.error('Foreign key constraint violation when storing fingerprint', {
            contentHash: fingerprint.contentHash.substring(0, 12) + '...',
            classId,
            userId,
            error: error.message,
            detail: error.details,
            hint: error.hint
          });
          return null;
        }

        logger.warn('Failed to store fingerprint in cache', {
          contentHash: fingerprint.contentHash.substring(0, 12) + '...',
          classId,
          userId,
          errorCode: error.code,
          error: error.message,
          detail: error.details
        });
        return null; // Graceful degradation
      }

      if (!data) {
        logger.warn('No data returned from fingerprint insert');
        return null;
      }

      const cacheEntry = this.transformRowToCache(data);

      logger.info('✅ DATABASE INSERT SUCCESSFUL - Fingerprint stored in cache', {
        id: cacheEntry.id,
        contentHash: fingerprint.contentHash.substring(0, 12) + '...',
        processingStatus: cacheEntry.processingStatus,
        rowsAffected: 1,
        tableConfirmed: 'file_fingerprints'
      });

      return cacheEntry;

    } catch (error) {
      logger.error('Failed to store fingerprint in cache', {
        contentHash: fingerprint.contentHash.substring(0, 12) + '...',
        error: error instanceof Error ? error.message : String(error)
      });
      return null; // Graceful degradation
    }
  }

  /**
   * Update processing status for a cached fingerprint
   */
  async updateProcessingStatus(
    contentHash: string,
    status: ProcessingStatus,
    additionalData?: {
      extractedText?: string;
      generatedTasks?: CachedTaskData[];
      taskGenerationMetadata?: TaskGenerationMetadata;
      embeddingChunks?: number;
      processingDuration?: number;
    }
  ): Promise<boolean> {
    try {
      logger.debug('Updating cache processing status', {
        contentHash: contentHash.substring(0, 12) + '...',
        status,
        hasAdditionalData: !!additionalData
      });

      const updateData: any = {
        processing_status: status,
        last_used_at: new Date().toISOString()
      };

      if (additionalData?.extractedText) {
        updateData.extracted_text = additionalData.extractedText;
        updateData.extracted_text_length = additionalData.extractedText.length;
        updateData.extraction_method = 'pdfjs'; // Default method
      }

      if (additionalData?.generatedTasks) {
        updateData.generated_tasks = JSON.stringify(additionalData.generatedTasks);
      }

      if (additionalData?.taskGenerationMetadata) {
        updateData.task_generation_metadata = JSON.stringify(additionalData.taskGenerationMetadata);
      }

      if (additionalData?.embeddingChunks !== undefined) {
        updateData.embedding_chunks = additionalData.embeddingChunks;
        updateData.embeddings_created = additionalData.embeddingChunks > 0;
      }

      if (additionalData?.processingDuration !== undefined) {
        updateData.last_processing_duration = additionalData.processingDuration;
      }

      const { error } = await supabase
        .from('file_fingerprints')
        .update(updateData)
        .eq('content_hash', contentHash);

      if (error) {
        logger.warn('Failed to update cache processing status', {
          contentHash: contentHash.substring(0, 12) + '...',
          status,
          error: error.message
        });
        return false;
      }

      logger.info('Successfully updated cache processing status', {
        contentHash: contentHash.substring(0, 12) + '...',
        status
      });

      return true;

    } catch (error) {
      logger.error('Error updating cache processing status', {
        contentHash: contentHash.substring(0, 12) + '...',
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Get cached extracted text for a file
   */
  async getCachedText(contentHash: string): Promise<string | null> {
    try {
      const cacheEntry = await this.checkFingerprint(contentHash);
      
      if (cacheEntry && cacheEntry.extractedText && cacheEntry.processingStatus !== 'failed') {
        logger.info('Retrieved cached extracted text', {
          contentHash: contentHash.substring(0, 12) + '...',
          textLength: cacheEntry.extractedText.length,
          extractionMethod: cacheEntry.extractionMethod || 'unknown'
        });
        return cacheEntry.extractedText;
      }

      return null;

    } catch (error) {
      logger.error('Failed to get cached text', {
        contentHash: contentHash.substring(0, 12) + '...',
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Get cached generated tasks for a file
   */
  async getCachedTasks(contentHash: string, classId?: string): Promise<CachedTaskData[] | null> {
    try {
      const cacheEntry = await this.checkFingerprint(contentHash);
      
      if (cacheEntry && 
          cacheEntry.generatedTasks && 
          cacheEntry.processingStatus === 'completed' &&
          (!classId || cacheEntry.classId === classId)) {
        
        logger.info('Retrieved cached generated tasks', {
          contentHash: contentHash.substring(0, 12) + '...',
          taskCount: cacheEntry.generatedTasks.length,
          classId: cacheEntry.classId
        });
        
        return cacheEntry.generatedTasks;
      }

      return null;

    } catch (error) {
      logger.error('Failed to get cached tasks', {
        contentHash: contentHash.substring(0, 12) + '...',
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      logger.debug('Starting cache cleanup');

      const { data, error } = await supabase.rpc('cleanup_expired_fingerprints');

      if (error) {
        logger.error('Cache cleanup failed', { error: error.message });
        return 0;
      }

      const deletedCount = data || 0;
      
      if (deletedCount > 0) {
        logger.info('Cache cleanup completed', { deletedEntries: deletedCount });
      }

      return deletedCount;

    } catch (error) {
      logger.error('Cache cleanup error', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStatistics(): Promise<CacheStatistics | null> {
    try {
      const { data, error } = await supabase.rpc('get_fingerprint_cache_stats');

      if (error || !data || !data[0]) {
        logger.warn('Failed to get cache statistics', { error: error?.message });
        return null;
      }

      const stats = data[0];
      
      const cacheStats: CacheStatistics = {
        totalEntries: stats.total_entries || 0,
        hitRate: 0, // Would need additional tracking
        missRate: 0, // Would need additional tracking
        averageProcessingTime: 0, // Could calculate from last_processing_duration
        storageSize: stats.total_cache_size || 0,
        expiredEntries: 0, // Would need query for expired entries
        recentActivity: {
          hits: 0,
          misses: 0,
          creates: 0,
          deletes: 0
        }
      };

      return cacheStats;

    } catch (error) {
      logger.error('Error getting cache statistics', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Private helper: Transform database row to cache object
   */
  private transformRowToCache(row: FileFingerprintRow): FileFingerprintCache {
    return {
      id: row.id,
      contentHash: row.content_hash,
      filename: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      processingStatus: row.processing_status,
      createdAt: new Date(row.created_at),
      lastUsedAt: new Date(row.last_used_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      extractedText: row.extracted_text || undefined,
      extractedTextLength: row.extracted_text_length || undefined,
      extractionMethod: row.extraction_method as any,
      generatedTasks: row.generated_tasks ? JSON.parse(row.generated_tasks) : undefined,
      taskGenerationMetadata: row.task_generation_metadata ? JSON.parse(row.task_generation_metadata) : undefined,
      embeddingChunks: row.embedding_chunks || 0,
      embeddingsCreated: row.embeddings_created,
      useCount: row.use_count,
      lastProcessingDuration: row.last_processing_duration || undefined,
      classId: row.class_id || undefined,
      userId: row.user_id || undefined
    };
  }

  /**
   * Private helper: Update last used timestamp
   */
  private async updateLastUsed(contentHash: string): Promise<void> {
    try {
      await supabase
        .from('file_fingerprints')
        .update({ last_used_at: new Date().toISOString() })
        .eq('content_hash', contentHash);
    } catch (error) {
      // Silently fail - this is not critical
    }
  }
}

/**
 * Singleton instance export for easy access
 */
export const cacheService = CacheService.getInstance();