/**
 * Task Type Utilities Module - Handles task type operations for syllabus generation
 * Extracted from syllabusTaskGenerationService.ts for better maintainability
 */

import { logger } from '../../utils/logger';
import { supabase } from '../supabaseClient';
import type { TaskTypeInsert } from '../../types/database';

/**
 * Get or create task type using the service layer (which handles RLS properly)
 */
export async function getOrCreateTaskTypeViaServiceLayer(taskTypeName: string, userId: string): Promise<string> {
  try {
    // Import the service layer functions
    const { getTaskTypes, addTaskType } = await import('../taskType/taskTypeOperations');
    
    // First, try to find existing task type using the service layer
    const existingTypes = await getTaskTypes(userId, true);
    const existingType = existingTypes.find(type => 
      type.name.toLowerCase() === taskTypeName.toLowerCase()
    );

    if (existingType) {
      logger.debug('🏷️ TASK TYPE: Found existing task type via service layer', {
        taskTypeName,
        userId,
        taskTypeId: existingType.id
      });
      return existingType.id;
    }

    logger.debug('🏷️ TASK TYPE: Creating new task type via service layer', {
      taskTypeName,
      userId
    });

    // Create new task type using service layer
    const newTaskType = await addTaskType({
      name: taskTypeName,
      color: getTaskTypeColor(taskTypeName),
      user_id: userId
    });

    if (!newTaskType) {
      throw new Error('Failed to create task type - returned null');
    }

    logger.info('✅ TASK TYPE: Successfully created new task type via service layer', {
      taskTypeName,
      userId,
      taskTypeId: newTaskType.id,
      color: newTaskType.color
    });

    return newTaskType.id;

  } catch (error) {
    logger.error('❌ TASK TYPE: Error in getOrCreateTaskTypeViaServiceLayer', {
      taskTypeName,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Fallback to legacy method
    return await getOrCreateTaskTypeLegacy(taskTypeName, userId);
  }
}

/**
 * Get or create task type for generated tasks (legacy method - kept for compatibility)
 */
export async function getOrCreateTaskTypeLegacy(taskTypeName: string, userId: string): Promise<string> {
  try {
    // First, try to find existing task type (remove .single() to avoid errors)
    const { data: existingTypes, error: findError } = await supabase
      .from('task_types')
      .select('id')
      .eq('name', taskTypeName)
      .eq('user_id', userId)
      .limit(1);

    if (!findError && existingTypes && existingTypes.length > 0) {
      logger.debug('🏷️ TASK TYPE LEGACY: Found existing task type', {
        taskTypeName,
        userId,
        taskTypeId: existingTypes[0].id
      });
      return existingTypes[0].id;
    }

    logger.debug('🏷️ TASK TYPE LEGACY: Creating new task type', {
      taskTypeName,
      userId,
      findError: findError?.message || 'No error'
    });

    // Create new task type with appropriate color
    const { data: newTaskType, error: createError } = await supabase
      .from('task_types')
      .insert({
        name: taskTypeName,
        color: getTaskTypeColor(taskTypeName),
        description: `Auto-created for ${taskTypeName} tasks`,
        user_id: userId,
        is_default: false
      })
      .select('id')
      .single();

    if (createError) {
      logger.error('❌ TASK TYPE LEGACY: Failed to create task type', {
        taskTypeName,
        userId,
        error: createError
      });
      throw createError;
    }

    if (!newTaskType) {
      logger.error('❌ TASK TYPE LEGACY: No data returned from task type creation', {
        taskTypeName,
        userId
      });
      throw new Error('No data returned from task type creation');
    }

    logger.info('✅ TASK TYPE LEGACY: Successfully created new task type', {
      taskTypeName,
      userId,
      taskTypeId: newTaskType.id,
      color: getTaskTypeColor(taskTypeName)
    });

    return newTaskType.id;

  } catch (error) {
    logger.error('❌ TASK TYPE LEGACY: Error in getOrCreateTaskType', {
      taskTypeName,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Get appropriate color for task type
 */
function getTaskTypeColor(taskType: string): string {
  const colorMap: Record<string, string> = {
    'assignment': '#3B82F6', // Blue
    'homework': '#3B82F6',   // Blue
    'exam': '#EF4444',       // Red
    'quiz': '#F59E0B',       // Amber
    'project': '#8B5CF6',    // Purple
    'reading': '#10B981',    // Emerald
    'discussion': '#06B6D4', // Cyan
    'lab': '#F97316',        // Orange
    'paper': '#84CC16',      // Lime
    'presentation': '#EC4899', // Pink
    'research': '#6366F1'    // Indigo
  };
  
  return colorMap[taskType.toLowerCase()] || '#6B7280'; // Gray fallback
}

/**
 * Get estimated duration for task type
 */
export function getEstimatedDurationForTaskType(taskType: string): number {
  const durationMap: Record<string, number> = {
    assignment: 120,    // 2 hours
    homework: 90,       // 1.5 hours  
    exam: 180,          // 3 hours (study time)
    quiz: 30,           // 30 minutes
    project: 480,       // 8 hours
    reading: 60,        // 1 hour
    discussion: 45,     // 45 minutes
    lab: 180           // 3 hours
  };
  
  return durationMap[taskType.toLowerCase()] || 60; // Default 1 hour
}