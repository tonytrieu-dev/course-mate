/**
 * Supabase utilities for common database operations
 */
import type { Database } from '../services/supabaseClient';
import { supabase } from '../services/supabaseClient';
import { logger } from './logger';
import { errorHandler } from './errorHandler';

// Base database row interface with common fields
interface BaseDbRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

// Query options for Supabase operations
interface SupabaseQueryOptions {
  select?: string;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}

// Generic table types
type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

/**
 * Generic CRUD operations for Supabase tables
 */
export class SupabaseHelper<T extends TableName> {
  private tableName: T;

  constructor(tableName: T) {
    this.tableName = tableName;
  }

  async create(
    data: Omit<TableInsert<T>, 'user_id' | 'created_at'>, 
    userId: string
  ): Promise<TableRow<T>> {
    try {
      if (!userId) {
        throw errorHandler.auth.notAuthenticated({ 
          operation: `create ${this.tableName}` 
        });
      }

      const dataWithUser = {
        ...data,
        user_id: userId,
        created_at: new Date().toISOString(),
      } as TableInsert<T>;

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(dataWithUser)
        .select('*');

      if (error) {
        throw errorHandler.data.saveFailed({
          operation: `create ${this.tableName}`,
          originalError: error.message
        });
      }

      logger.debug(`Created ${this.tableName}`, { id: result[0]?.id });
      return result[0] as TableRow<T>;
    } catch (error) {
      if (error instanceof Error && error.name === 'ServiceError') {
        throw error;
      }
      
      errorHandler.handle(
        error instanceof Error ? error : new Error('Unknown error'),
        `create ${this.tableName}`,
        { userId: !!userId }
      );
      throw errorHandler.data.saveFailed({
        operation: `create ${this.tableName}`,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(
    id: string, 
    data: Omit<TableUpdate<T>, 'user_id' | 'updated_at'>, 
    userId: string
  ): Promise<TableRow<T>> {
    try {
      if (!userId) {
        throw errorHandler.auth.notAuthenticated({ 
          operation: `update ${this.tableName}` 
        });
      }

      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      } as TableUpdate<T>;

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*');

      if (error) {
        throw errorHandler.data.saveFailed({
          operation: `update ${this.tableName}`,
          originalError: error.message
        });
      }

      logger.debug(`Updated ${this.tableName}`, { id });
      return result[0] as TableRow<T>;
    } catch (error) {
      if (error instanceof Error && error.name === 'ServiceError') {
        throw error;
      }
      
      errorHandler.handle(
        error instanceof Error ? error : new Error('Unknown error'),
        `update ${this.tableName}`,
        { id, userId: !!userId }
      );
      throw errorHandler.data.saveFailed({
        operation: `update ${this.tableName}`,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      if (!userId) {
        throw errorHandler.auth.notAuthenticated({ 
          operation: `delete ${this.tableName}` 
        });
      }

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        throw errorHandler.data.saveFailed({
          operation: `delete ${this.tableName}`,
          originalError: error.message
        });
      }

      logger.debug(`Deleted ${this.tableName}`, { id });
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'ServiceError') {
        throw error;
      }
      
      errorHandler.handle(
        error instanceof Error ? error : new Error('Unknown error'),
        `delete ${this.tableName}`,
        { id, userId: !!userId }
      );
      throw errorHandler.data.saveFailed({
        operation: `delete ${this.tableName}`,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAll(userId: string, options: SupabaseQueryOptions = {}): Promise<TableRow<T>[]> {
    try {
      if (!userId) {
        throw errorHandler.auth.notAuthenticated({ 
          operation: `get ${this.tableName}` 
        });
      }

      let query = supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('user_id', userId);

      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw errorHandler.data.loadFailed({
          operation: `get ${this.tableName}`,
          originalError: error.message
        });
      }

      logger.debug(`Retrieved ${this.tableName}`, { count: data?.length || 0 });
      return (data as any) || [];
    } catch (error) {
      if (error instanceof Error && error.name === 'ServiceError') {
        throw error;
      }
      
      errorHandler.handle(
        error instanceof Error ? error : new Error('Unknown error'),
        `get ${this.tableName}`,
        { userId: !!userId }
      );
      throw errorHandler.data.loadFailed({
        operation: `get ${this.tableName}`,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getById(id: string, userId: string, options: SupabaseQueryOptions = {}): Promise<TableRow<T> | null> {
    try {
      if (!userId) {
        throw errorHandler.auth.notAuthenticated({ 
          operation: `get ${this.tableName} by id` 
        });
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select(options.select || '*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw errorHandler.data.loadFailed({
          operation: `get ${this.tableName} by id`,
          originalError: error.message
        });
      }

      logger.debug(`Retrieved ${this.tableName} by id`, { id });
      return data as any;
    } catch (error) {
      if (error instanceof Error && error.name === 'ServiceError') {
        throw error;
      }
      
      errorHandler.handle(
        error instanceof Error ? error : new Error('Unknown error'),
        `get ${this.tableName} by id`,
        { id, userId: !!userId }
      );
      throw errorHandler.data.loadFailed({
        operation: `get ${this.tableName} by id`,
        originalError: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

/**
 * Common Supabase utility functions
 */
export const createSupabaseHelper = <T extends TableName>(tableName: T): SupabaseHelper<T> => 
  new SupabaseHelper(tableName);

export const checkUserDataExists = async (tableName: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn(`Failed to check if ${tableName} data exists`, { error: errorMessage });
    return false;
  }
};

export const batchUpsert = async <T extends Record<string, any>>(
  tableName: string, 
  records: T[]
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .upsert(records);

    if (error) throw error;
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Batch upsert failed for ${tableName}`, { error: errorMessage });
    return false;
  }
};