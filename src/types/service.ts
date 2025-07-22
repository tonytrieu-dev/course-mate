import { User } from '@supabase/supabase-js';

// Authentication types
export interface AuthResponse {
  user: User | null;
  session: any;
  error?: any;
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
  context?: Record<string, any>;
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
export type SupabaseQueryFn<T = any> = () => Promise<{ data: T | null; error: any }>;

// Service helper types
export interface WithSupabaseQueryOptions {
  fallbackData?: any;
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
  [key: string]: any;
}

// Local storage types
export type LocalStorageKey = string;
export type LocalStorageData = any;

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