import type { TaskInsert, ClassInsert, TaskTypeInsert } from '../types/database';
import { supabase } from './supabaseClient';
import { getTasks, getClasses, getTaskTypes } from './dataService';
import { getLocalData, saveLocalData } from '../utils/storageHelpers';
import { checkUserDataExists, batchUpsert } from '../utils/supabaseHelpers';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const LAST_SYNC_KEY = 'last_sync_timestamp';

// Sync result interface
interface SyncResult {
  success: boolean;
  error?: string;
}

// Batch upload data interface
interface BatchUploadData {
  tasks: TaskInsert[];
  classes: ClassInsert[];
  taskTypes: TaskTypeInsert[];
}

const setLastSyncTimestamp = (): void => {
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
};

export const checkIfDataExists = async (userId: string): Promise<boolean> => {
  return await checkUserDataExists('tasks', userId);
};

// Upload all local data to Supabase (for first-time sync)
export const uploadLocalDataToSupabase = async (userId: string): Promise<boolean> => {
  try {
    const tasks = await getTasks(undefined, false);
    const classes = await getClasses(undefined, false);
    const taskTypes = await getTaskTypes(undefined, false);
    
    const tasksWithUserId: TaskInsert[] = tasks.map(task => ({
      ...task,
      user_id: userId,
      created_at: task.created_at || new Date().toISOString(),
    }));

    const classesWithUserId: ClassInsert[] = classes.map(cls => ({
      ...cls,
      user_id: userId,
      created_at: cls.created_at || new Date().toISOString(),
      files: cls.files || [], // Ensure files array exists
    }));

    const taskTypesWithUserId: TaskTypeInsert[] = taskTypes.map(type => ({
      ...type,
      user_id: userId,
      created_at: type.created_at || new Date().toISOString(),
    }));

    // Now upload the data in batches
    const uploadResults = await Promise.all([
      classesWithUserId.length > 0 ? batchUpsert<ClassInsert>('classes', classesWithUserId) : Promise.resolve(true),
      taskTypesWithUserId.length > 0 ? batchUpsert<TaskTypeInsert>('task_types', taskTypesWithUserId) : Promise.resolve(true),
      tasksWithUserId.length > 0 ? batchUpsert<TaskInsert>('tasks', tasksWithUserId) : Promise.resolve(true),
    ]);

    if (!uploadResults.every(result => result === true)) {
      throw new Error('Some uploads failed');
    }

    // Update the sync timestamp
    setLastSyncTimestamp();

    return true;
  } catch (error) {
    const handled = errorHandler.handle(
      error instanceof Error ? error : new Error('Unknown error'),
      'uploadLocalDataToSupabase',
      { userId: !!userId }
    );
    logger.error('Error uploading local data to Supabase', { error: handled.userMessage, context: handled.context });
    return false;
  }
};

export const downloadDataFromSupabase = async (userId: string): Promise<boolean> => {
  try {
    // Preserve existing canvas settings before overwriting other data
    const existingCanvasUrl = localStorage.getItem('canvas_calendar_url');
    const existingAutoSync = localStorage.getItem('canvas_auto_sync');

    // Fetch all data from Supabase
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', userId);

    const { data: taskTypes, error: taskTypesError } = await supabase
      .from('task_types')
      .select('*')
      .eq('user_id', userId);

    if (tasksError) throw tasksError;
    if (classesError) throw classesError;
    if (taskTypesError) throw taskTypesError;

    // Save fetched data to local storage
    localStorage.setItem('calendar_tasks', JSON.stringify(tasks || []));
    localStorage.setItem('calendar_classes', JSON.stringify(classes || []));
    localStorage.setItem('calendar_task_types', JSON.stringify(taskTypes || []));

    // Restore canvas settings if they existed
    if (existingCanvasUrl !== null) {
      localStorage.setItem('canvas_calendar_url', existingCanvasUrl);
    }
    if (existingAutoSync !== null) {
      localStorage.setItem('canvas_auto_sync', existingAutoSync);
    }

    // Update the sync timestamp
    setLastSyncTimestamp();

    return true;
  } catch (error) {
    const handled = errorHandler.handle(
      error instanceof Error ? error : new Error('Unknown error'),
      'downloadDataFromSupabase',
      { userId: !!userId }
    );
    logger.error('Error downloading data from Supabase', { error: handled.userMessage, context: handled.context });
    return false;
  }
};

export const syncData = async (userId: string): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  try {
    const dataExists = await checkIfDataExists(userId);

    if (!dataExists) {
      return await uploadLocalDataToSupabase(userId);
    } else {
      return await downloadDataFromSupabase(userId);
    }
  } catch (error) {
    const handled = errorHandler.handle(
      error instanceof Error ? error : new Error('Unknown error'),
      'syncData',
      { userId: !!userId }
    );
    logger.error('Error during sync', { error: handled.userMessage, context: handled.context });
    return false;
  }
};