import { User, Session } from '@supabase/supabase-js';

// Authentication types
export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: Error | null;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

// Service operation result types
export interface ServiceResult<T> {
  data?: T;
  error?: ServiceError;
  success: boolean;
}

export interface ServiceError {
  name: string;
  message: string;
  code?: string;
  operation?: string;
  originalError?: string;
  context?: Record<string, unknown>;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string;
}

// Query options
export interface QueryOptions {
  useSupabase?: boolean;
  userId?: string;
  useCache?: boolean;
  cacheOptions?: CacheOptions;
}

// Supabase query function type
export type SupabaseQueryFn<T = unknown> = () => Promise<{ data: T | null; error: Error | null }>;

// Service helper types
export interface WithSupabaseQueryOptions<T = unknown> {
  fallbackData?: T;
  operation?: string;
  retryCount?: number;
  timeout?: number;
}

// Error handler types
export interface ErrorContext {
  operation?: string;
  userId?: string;
  taskId?: string;
  taskTitle?: string;
  classId?: string;
  useSupabase?: boolean;
  fallbackUsed?: boolean;
  [key: string]: unknown;
}

// Local storage types
export type LocalStorageKey = string;
export type LocalStorageData = unknown;

// File upload types
export interface FileUploadData {
  filename: string;
  path: string;
  size?: number;
  type?: string;
  class_id?: string;
  owner?: string;
}

// Bulk operations
export interface BulkOperationResult<T> {
  successful: T[];
  failed: Array<{ item: T; error: ServiceError }>;
  totalProcessed: number;
}

// Pagination types
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Export/Import types
export interface ExportFormatConfig {
  format: 'json' | 'csv' | 'ics' | 'pdf';
  extension: string;
  mimeType: string;
  description: string;
  supportsFiltering: boolean;
  supportsBulkExport: boolean;
}

export interface ImportFormatConfig {
  format: 'json' | 'csv' | 'ics';
  extensions: string[];
  mimeTypes: string[];
  description: string;
  supportsPreview: boolean;
  supportsValidation: boolean;
}

export interface DataExportRequest {
  format: 'json' | 'csv' | 'ics' | 'pdf';
  includeCompleted?: boolean;
  startDate?: Date;
  endDate?: Date;
  classIds?: string[];
  dataTypes?: ('tasks' | 'classes' | 'grades' | 'sessions')[];
  semester?: string;
  year?: number;
}

export interface DataImportRequest {
  format: 'json' | 'csv' | 'ics';
  file: File;
  skipDuplicates?: boolean;
  validateData?: boolean;
  conflictResolution?: 'skip' | 'overwrite' | 'merge' | 'prompt';
  classMapping?: Record<string, string>;
  taskTypeMapping?: Record<string, string>;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: ServiceError;
  metrics?: {
    itemsExported: number;
    fileSize: number;
    exportDuration: number;
  };
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
  conflicts: ImportConflict[];
  metrics?: {
    totalProcessed: number;
    importDuration: number;
    validationDuration?: number;
  };
}

export interface ImportSummary {
  totalProcessed: number;
  imported: {
    tasks: number;
    classes: number;
    taskTypes: number;
    grades: number;
    studySessions: number;
  };
  skipped: {
    tasks: number;
    classes: number;
    taskTypes: number;
    duplicates: number;
  };
  errors: number;
}

export interface ImportError {
  type: 'validation' | 'database' | 'conflict' | 'format';
  item: string;
  field?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  code?: string;
}

export interface ImportConflict {
  type: 'task' | 'class' | 'taskType';
  existing: any;
  imported: any;
  field: string;
  suggestedResolution: 'skip' | 'overwrite' | 'merge';
}

export interface ImportPreview {
  valid: boolean;
  data: ImportData;
  validation: ValidationResult;
  conflicts: ImportConflict[];
  summary: {
    tasks: number;
    classes: number;
    taskTypes: number;
    estimatedImportTime: number; // seconds
  };
}

export interface ImportData {
  tasks: any[];
  classes: any[];
  taskTypes: any[];
  grades?: any[];
  assignments?: any[];
  studySessions?: any[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportError[];
}

export type ExportProgressCallback = (progress: ExportProgress) => void;
export type ImportProgressCallback = (progress: ImportProgress) => void;

export interface ExportProgress {
  step: string;
  progress: number; // 0-100
  message: string;
  processed?: number;
  total?: number;
}

export interface ImportProgress {
  step: string;
  progress: number; // 0-100
  message: string;
  processed?: number;
  total?: number;
}