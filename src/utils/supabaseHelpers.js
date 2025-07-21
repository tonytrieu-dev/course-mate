/**
 * Supabase utilities for common database operations
 */
import { supabase } from '../services/supabaseClient';
import { logger } from './logger';
import { errorHandler } from './errorHandler';

/**
 * Generic CRUD operations for Supabase tables
 */
export class SupabaseHelper {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async create(data, userId) {
    try {
      if (!userId) {
        throw errorHandler.auth.notAuthenticated({ 
          operation: `create ${this.tableName}` 
        });
      }

      const dataWithUser = {
        ...data,
        user_id: userId,
        created_at: data.created_at || new Date().toISOString(),
      };

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
      return result[0];
    } catch (error) {
      if (error.name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error,
        `create ${this.tableName}`,
        { userId: !!userId }
      );
      throw errorHandler.data.saveFailed({
        operation: `create ${this.tableName}`,
        originalError: error.message
      });
    }
  }

  async update(id, data, userId) {
    try {
      if (!userId) {
        throw errorHandler.auth.notAuthenticated({ 
          operation: `update ${this.tableName}` 
        });
      }

      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

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
      return result[0];
    } catch (error) {
      if (error.name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error,
        `update ${this.tableName}`,
        { id, userId: !!userId }
      );
      throw errorHandler.data.saveFailed({
        operation: `update ${this.tableName}`,
        originalError: error.message
      });
    }
  }

  async delete(id, userId) {
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
      if (error.name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error,
        `delete ${this.tableName}`,
        { id, userId: !!userId }
      );
      throw errorHandler.data.saveFailed({
        operation: `delete ${this.tableName}`,
        originalError: error.message
      });
    }
  }

  async getAll(userId, options = {}) {
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
      return data || [];
    } catch (error) {
      if (error.name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error,
        `get ${this.tableName}`,
        { userId: !!userId }
      );
      throw errorHandler.data.loadFailed({
        operation: `get ${this.tableName}`,
        originalError: error.message
      });
    }
  }

  async getById(id, userId, options = {}) {
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
      return data;
    } catch (error) {
      if (error.name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error,
        `get ${this.tableName} by id`,
        { id, userId: !!userId }
      );
      throw errorHandler.data.loadFailed({
        operation: `get ${this.tableName} by id`,
        originalError: error.message
      });
    }
  }
}

/**
 * Common Supabase utility functions
 */
export const createSupabaseHelper = (tableName) => new SupabaseHelper(tableName);

export const checkUserDataExists = async (tableName, userId) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    logger.warn(`Failed to check if ${tableName} data exists`, { error: error.message });
    return false;
  }
};

export const batchUpsert = async (tableName, records) => {
  try {
    const { error } = await supabase
      .from(tableName)
      .upsert(records);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error(`Batch upsert failed for ${tableName}`, { error: error.message });
    return false;
  }
};