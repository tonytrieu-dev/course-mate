/**
 * Cache Types for Smart Upload Optimization
 * 
 * Defines TypeScript interfaces for file fingerprinting and caching system.
 * This enables deduplication and performance optimization in the upload pipeline.
 */

import type { FileFingerprint } from '../utils/fileFingerprinting';

// Processing status for cached files
export type ProcessingStatus = 
  | 'pending'       // File fingerprinted but not processed
  | 'extracting'    // Text extraction in progress
  | 'extracted'     // Text extraction completed
  | 'embedding'     // Vector embedding generation in progress
  | 'embedded'      // Vector embeddings created
  | 'generating'    // Task generation in progress
  | 'completed'     // All processing completed
  | 'failed'        // Processing failed
  | 'expired';      // Cache entry expired

// Cache entry for file fingerprints and processed data
export interface FileFingerprintCache {
  id: string;
  contentHash: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  
  // Processing status and timestamps
  processingStatus: ProcessingStatus;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt?: Date;
  
  // Cached extracted text
  extractedText?: string;
  extractedTextLength?: number;
  extractionMethod?: 'pdfjs' | 'enhanced' | 'fallback';
  
  // Cached task generation results
  generatedTasks?: CachedTaskData[];
  taskGenerationMetadata?: TaskGenerationMetadata;
  
  // Cached embedding information
  embeddingChunks?: number;
  embeddingsCreated: boolean;
  
  // Usage statistics
  useCount: number;
  lastProcessingDuration?: number; // milliseconds
  
  // Associated class and user info
  classId?: string;
  userId?: string;
}

// Cached task data structure
export interface CachedTaskData {
  title: string;
  description?: string;
  dueDate?: string;
  assignmentDate?: string;
  sessionDate?: string;
  taskType: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  tags?: string[];
  estimatedDuration?: number;
}

// Task generation metadata
export interface TaskGenerationMetadata {
  averageConfidence: number;
  totalTasks: number;
  processingDuration: number; // milliseconds
  generatedAt: Date;
  warnings: string[];
  duplicatesDetected: number;
  duplicatesRemoved: number;
}

// Cache query options
export interface CacheQueryOptions {
  includeExpired?: boolean;
  minConfidence?: number;
  classId?: string;
  userId?: string;
  processingStatus?: ProcessingStatus[];
}

// Cache operation result
export interface CacheOperationResult<T = any> {
  success: boolean;
  data?: T;
  fromCache: boolean;
  cacheKey?: string;
  processedAt?: Date;
  processingDuration?: number;
  metadata?: Record<string, any>;
}

// Cache statistics for monitoring
export interface CacheStatistics {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  averageProcessingTime: number;
  storageSize: number; // bytes
  expiredEntries: number;
  recentActivity: {
    hits: number;
    misses: number;
    creates: number;
    deletes: number;
  };
}

// Cache configuration
export interface CacheConfig {
  maxEntries: number;
  defaultTTL: number; // time to live in milliseconds
  cleanupInterval: number; // cleanup frequency in milliseconds
  enableCompression: boolean;
  enableEncryption: boolean;
  maxTextLength: number;
  maxTasksPerFile: number;
}

// Database table interface for file_fingerprints
export interface FileFingerprintRow {
  id: string;
  content_hash: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  processing_status: ProcessingStatus;
  
  // Cached data (JSON columns)
  extracted_text?: string;
  extracted_text_length?: number;
  extraction_method?: string;
  generated_tasks?: any; // JSONB
  task_generation_metadata?: any; // JSONB
  
  // Embedding info
  embedding_chunks?: number;
  embeddings_created: boolean;
  
  // Statistics
  use_count: number;
  last_processing_duration?: number;
  
  // Associations
  class_id?: string;
  user_id?: string;
  
  // Timestamps
  created_at: string; // ISO string from database
  last_used_at: string; // ISO string from database
  expires_at?: string; // ISO string from database
}

// Type guards for runtime validation
export const isCachedTaskData = (obj: any): obj is CachedTaskData => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.title === 'string' &&
    typeof obj.taskType === 'string' &&
    typeof obj.priority === 'string' &&
    ['low', 'medium', 'high'].includes(obj.priority) &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 && obj.confidence <= 1
  );
};

export const isTaskGenerationMetadata = (obj: any): obj is TaskGenerationMetadata => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.averageConfidence === 'number' &&
    typeof obj.totalTasks === 'number' &&
    typeof obj.processingDuration === 'number' &&
    obj.generatedAt instanceof Date &&
    Array.isArray(obj.warnings)
  );
};

export const isFileFingerprintCache = (obj: any): obj is FileFingerprintCache => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.contentHash === 'string' &&
    typeof obj.filename === 'string' &&
    typeof obj.fileSize === 'number' &&
    typeof obj.processingStatus === 'string' &&
    obj.createdAt instanceof Date &&
    obj.lastUsedAt instanceof Date &&
    typeof obj.useCount === 'number' &&
    typeof obj.embeddingsCreated === 'boolean'
  );
};

// Cache key generation utilities
export const generateFingerprintCacheKey = (contentHash: string): string => {
  return `fingerprint:${contentHash}`;
};

export const generateTextCacheKey = (contentHash: string): string => {
  return `text:${contentHash}`;
};

export const generateTaskCacheKey = (contentHash: string, classId?: string): string => {
  const baseKey = `tasks:${contentHash}`;
  return classId ? `${baseKey}:${classId}` : baseKey;
};

export const generateEmbeddingCacheKey = (contentHash: string): string => {
  return `embeddings:${contentHash}`;
};

// Default cache configuration
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxEntries: 10000,
  defaultTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  cleanupInterval: 24 * 60 * 60 * 1000,  // 24 hours
  enableCompression: true,
  enableEncryption: false,
  maxTextLength: 1000000, // 1MB
  maxTasksPerFile: 100
};

// Processing status transitions
export const PROCESSING_STATUS_TRANSITIONS: Record<ProcessingStatus, ProcessingStatus[]> = {
  'pending': ['extracting', 'failed'],
  'extracting': ['extracted', 'failed'],
  'extracted': ['embedding', 'generating', 'completed'],
  'embedding': ['embedded', 'failed'],
  'embedded': ['generating', 'completed'],
  'generating': ['completed', 'failed'],
  'completed': ['extracting'], // Allow reprocessing if needed
  'failed': ['pending', 'extracting'], // Allow retry
  'expired': ['pending'] // Allow refresh
};

// Utility for checking valid status transitions
export const canTransitionStatus = (
  from: ProcessingStatus, 
  to: ProcessingStatus
): boolean => {
  return PROCESSING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};