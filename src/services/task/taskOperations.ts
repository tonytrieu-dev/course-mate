import type { User } from '@supabase/supabase-js';
import type {
  Task,
  TaskInsert,
  TaskUpdate
} from '../../types/database';
import type { ServiceError } from '../../types/service';
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../authService";
import { logger } from "../../utils/logger";
import { errorHandler } from "../../utils/errorHandler";
import { getLocalData, saveLocalData } from "../../utils/storageHelpers";
import { generateUniqueId } from "../../utils/idHelpers";
import { STORAGE_KEYS } from '../../types/database';

const TASKS_KEY = STORAGE_KEYS.TASKS;

export const getTasks = async (userId?: string, useSupabase = false): Promise<Task[]> => {
  logger.debug('getTasks called', { userId: !!userId, userIdType: typeof userId, useSupabase });
  
  if (useSupabase) {
    if (!userId) {
      const handled = errorHandler.handle(
        errorHandler.auth.notAuthenticated({ operation: 'getTasks' }),
        'getTasks',
        { useSupabase, fallbackUsed: true }
      );
      logger.warn(handled.userMessage);
      return getLocalData(TASKS_KEY, []);
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        const handled = errorHandler.handle(
          error,
          'getTasks - Supabase query',
          { userId: !!userId, tableName: 'tasks', fallbackUsed: true }
        );
        logger.warn(`${handled.userMessage} - falling back to local data`);
        return getLocalData(TASKS_KEY, []);
      }

      logger.debug('Retrieved tasks from Supabase', { taskCount: data?.length || 0, userId: !!userId });
      return data || [];
    } catch (error: unknown) {
      const handled = errorHandler.handle(
        error as Error,
        'getTasks - unexpected error',
        { userId: !!userId, useSupabase, fallbackUsed: true }
      );
      logger.warn(`${handled.userMessage} - falling back to local data`);
      return getLocalData(TASKS_KEY, []);
    }
  }
  return getLocalData(TASKS_KEY, []);
};

export const addTask = async (
  task: Partial<TaskInsert>, 
  useSupabase = false, 
  providedUser: User | null = null
): Promise<Task> => {
  logger.debug('[addTask] Entered function. Task summary for identification:', task?.title || 'Task undefined', 'useSupabase:', useSupabase, 'User provided:', !!providedUser);
  
  
  try {
    const taskWithTimestamp: Partial<TaskInsert> = {
      ...task,
      created_at: task.created_at || new Date().toISOString(),
    };

    if (useSupabase) {
      logger.debug('[addTask] Inside useSupabase block.');
      
      let userToUse = providedUser;
      if (!userToUse) {
        logger.debug('[addTask] No user provided directly, calling getCurrentUser.');
        userToUse = await getCurrentUser();
      } else {
        logger.debug('[addTask] Using provided user object. User ID:', userToUse.id);
      }

      if (!userToUse) {
        throw errorHandler.auth.notAuthenticated({ 
          operation: 'addTask',
          taskTitle: task?.title,
          useSupabase 
        });
      }

      // Enhanced de-duplication logic for canvas_uid with upsert behavior
      if (task.canvas_uid && String(task.canvas_uid).trim() !== "") {
        const canvasUIDString = String(task.canvas_uid).trim();
        logger.debug(`[addTask] Checking for existing task. User ID: ${userToUse.id}, Canvas UID: '${canvasUIDString}'`);

        const { data: existingTasks, error: existingTaskError } = await supabase
          .from("tasks")
          .select("*") // Select all fields to match Task type
          .eq("user_id", userToUse.id)
          .eq("canvas_uid", canvasUIDString)
          .limit(1);

        if (existingTaskError) {
          const handled = errorHandler.handle(
            existingTaskError,
            'addTask - checking for existing task',
            { canvasUID: canvasUIDString, userId: userToUse.id }
          );
          throw errorHandler.data.loadFailed({ 
            operation: 'addTask - duplicate check',
            canvasUID: canvasUIDString,
            originalError: existingTaskError.message
          });
        }

        if (existingTasks && existingTasks.length > 0) {
          const existingSupabaseTask = existingTasks[0];
          logger.debug(`[addTask] Task with canvas_uid ${canvasUIDString} already exists in Supabase. Using existing task.`);
          
          // Sync the existing task to local storage
          const currentLocalTasks = getLocalData<Task[]>(TASKS_KEY, []);
          const taskIndex = currentLocalTasks.findIndex(t => 
            t.id === existingSupabaseTask.id || 
            (t.canvas_uid && String(t.canvas_uid) === canvasUIDString)
          );
          
          if (taskIndex !== -1) {
            currentLocalTasks[taskIndex] = existingSupabaseTask;
          } else {
            currentLocalTasks.push(existingSupabaseTask);
          }
          saveLocalData(TASKS_KEY, currentLocalTasks);
          logger.debug(`[addTask] Local storage synced for existing task with canvas_uid ${canvasUIDString}.`);
          
          return existingSupabaseTask;
        } else {
          logger.debug(`[addTask] No existing task found for canvas_uid: ${canvasUIDString}. Proceeding to insert new task.`);
        }
      } else {
        logger.debug(`[addTask] canvas_uid is not present or is empty (value: '${task.canvas_uid}', type: ${typeof task.canvas_uid}). Skipping de-duplication check and proceeding to insert.`);
      }

      const { id, ...taskData } = taskWithTimestamp;
      const taskToSave: TaskInsert = {
        user_id: userToUse.id,
        title: taskData.title || 'Untitled Task',
        completed: taskData.completed ?? false,
        class: taskData.class,
        type: taskData.type,
        date: taskData.date,
        isDuration: taskData.isDuration,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        startDate: taskData.startDate,
        startTime: taskData.startTime,
        endDate: taskData.endDate,
        endTime: taskData.endTime,
        priority: taskData.priority,
        canvas_uid: (task.canvas_uid && String(task.canvas_uid).trim() !== "") ? String(task.canvas_uid) : undefined,
        created_at: taskData.created_at,
        updated_at: taskData.updated_at,
      };

      logger.debug("[addTask] Attempting to insert new task into Supabase:", taskToSave);

      const { data: insertedData, error: insertError } = await supabase
        .from("tasks")
        .insert(taskToSave)
        .select();

      if (insertError) {
        // Log the full error details for debugging
        logger.error("[addTask] Supabase insertion error details:", {
          error: insertError,
          errorMessage: insertError.message,
          errorCode: insertError.code,
          errorDetails: insertError.details,
          errorHint: insertError.hint,
          taskToSave: taskToSave
        });
        
        // Handle unique constraint violation specifically
        if (insertError.code === '23505' && insertError.message.includes('tasks_user_id_canvas_uid_key')) {
          logger.warn('[addTask] Duplicate canvas_uid constraint violation, attempting to fetch existing task');
          
          if (taskToSave.canvas_uid) {
            try {
              const { data: existingTask, error: fetchError } = await supabase
                .from("tasks")
                .select("*")
                .eq("user_id", taskToSave.user_id)
                .eq("canvas_uid", taskToSave.canvas_uid)
                .single();
              
              if (!fetchError && existingTask) {
                logger.debug('[addTask] Found existing task after constraint violation, returning it');
                // Sync to local storage
                const currentLocalTasks = getLocalData<Task[]>(TASKS_KEY, []);
                const taskIndex = currentLocalTasks.findIndex(t => t.id === existingTask.id);
                if (taskIndex !== -1) {
                  currentLocalTasks[taskIndex] = existingTask;
                } else {
                  currentLocalTasks.push(existingTask);
                }
                saveLocalData(TASKS_KEY, currentLocalTasks);
                return existingTask;
              }
            } catch (fetchError) {
              logger.error('[addTask] Failed to fetch existing task after constraint violation:', fetchError);
            }
          }
        }
        
        const handled = errorHandler.handle(
          insertError,
          'addTask - Supabase insertion',
          { taskTitle: task?.title, taskData: taskToSave, supabaseError: insertError }
        );
        throw errorHandler.data.saveFailed({
          operation: 'addTask - Supabase insertion',
          taskTitle: task?.title,
          originalError: insertError.message,
          supabaseErrorCode: insertError.code,
          supabaseErrorDetails: insertError.details
        });
      }

      const newSupabaseTask = insertedData[0];
      logger.debug("[addTask] Task added successfully to Supabase:", newSupabaseTask);

      const localTasksAfterInsert = getLocalData<Task[]>(TASKS_KEY, []);
      const existingLocalTaskIndex = localTasksAfterInsert.findIndex(t => t.id === newSupabaseTask.id);
      let tasksToSaveLocally: Task[];

      if (existingLocalTaskIndex !== -1) {
          localTasksAfterInsert[existingLocalTaskIndex] = newSupabaseTask;
          tasksToSaveLocally = [...localTasksAfterInsert];
      } else {
          tasksToSaveLocally = [...localTasksAfterInsert, newSupabaseTask];
      }
      saveLocalData(TASKS_KEY, tasksToSaveLocally);
      logger.debug("[addTask] Local storage updated after new task insertion.");

      return newSupabaseTask;
    } else {
      const taskToSaveLocally: Task = {
        id: (task.id as string) || generateUniqueId('task'),
        user_id: 'local-user',
        title: taskWithTimestamp.title || 'Untitled Task',
        completed: taskWithTimestamp.completed ?? false,
        class: taskWithTimestamp.class,
        type: taskWithTimestamp.type,
        date: taskWithTimestamp.date,
        isDuration: taskWithTimestamp.isDuration,
        dueDate: taskWithTimestamp.dueDate,
        dueTime: taskWithTimestamp.dueTime,
        startDate: taskWithTimestamp.startDate,
        startTime: taskWithTimestamp.startTime,
        endDate: taskWithTimestamp.endDate,
        endTime: taskWithTimestamp.endTime,
        priority: taskWithTimestamp.priority,
        canvas_uid: (task.canvas_uid && String(task.canvas_uid).trim() !== "") ? String(task.canvas_uid) : undefined,
        created_at: taskWithTimestamp.created_at || new Date().toISOString(),
        updated_at: taskWithTimestamp.updated_at,
      };
      
      logger.debug("[addTask] Saving task to local storage:", taskToSaveLocally);
      const tasks = getLocalData<Task[]>(TASKS_KEY, []);
      
      let updatedTasks: Task[];
      const existingLocalIndexById = tasks.findIndex(t => t.id === taskToSaveLocally.id);
      let existingLocalIndexByCanvasUid = -1;
      if (taskToSaveLocally.canvas_uid) {
          existingLocalIndexByCanvasUid = tasks.findIndex(t => 
            t.canvas_uid && String(t.canvas_uid) === String(taskToSaveLocally.canvas_uid)
          );
      }

      if (taskToSaveLocally.canvas_uid && existingLocalIndexByCanvasUid !== -1) {
          tasks[existingLocalIndexByCanvasUid] = taskToSaveLocally;
          updatedTasks = [...tasks];
      } else if (existingLocalIndexById !== -1) {
          tasks[existingLocalIndexById] = taskToSaveLocally;
          updatedTasks = [...tasks];
      } else {
          updatedTasks = [...tasks, taskToSaveLocally];
      }
      saveLocalData(TASKS_KEY, updatedTasks);
      return taskToSaveLocally;
    }
  } catch (error: unknown) {
    if ((error as ServiceError).name === 'ServiceError') {
      throw error;
    }
    
    const handled = errorHandler.handle(
      error as Error,
      'addTask - overall operation',
      { taskTitle: task?.title, useSupabase, providedUser: !!providedUser }
    );
    throw errorHandler.data.saveFailed({
      operation: 'addTask - overall operation',
      taskTitle: task?.title,
      originalError: (error as Error).message
    });
  }
};

export const updateTask = async (
  taskId: string, 
  updatedTask: Partial<TaskUpdate>, 
  useSupabase = false
): Promise<Task> => {
  const taskToUpdate = {
    ...updatedTask,
    updated_at: new Date().toISOString(),
  };

  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update(taskToUpdate)
        .eq("id", taskId)
        .select("*");

      if (error) {
        const handled = errorHandler.handle(
          error,
          'updateTask - Supabase update',
          { taskId, taskTitle: updatedTask?.title }
        );
        throw errorHandler.data.saveFailed({
          operation: 'updateTask',
          taskId,
          originalError: error.message
        });
      }

      const localTasks = getLocalData<Task[]>(TASKS_KEY, []);
      const updatedTasks = localTasks.map((task) =>
        task.id === taskId ? { ...task, ...taskToUpdate } as Task : task
      );
      saveLocalData(TASKS_KEY, updatedTasks);

      return data[0];
    } catch (error: unknown) {
      if ((error as ServiceError).name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error as Error,
        'updateTask - unexpected error',
        { taskId, useSupabase, taskTitle: updatedTask?.title }
      );
      throw errorHandler.data.saveFailed({
        operation: 'updateTask - unexpected error',
        taskId,
        originalError: (error as Error).message
      });
    }
  } else {
    const tasks = getLocalData<Task[]>(TASKS_KEY, []);
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, ...taskToUpdate } as Task : task
    );
    saveLocalData(TASKS_KEY, updatedTasks);
  }

  return { id: taskId, ...taskToUpdate } as Task;
};

export const deleteTask = async (taskId: string, useSupabase = false): Promise<boolean> => {
  logger.debug('[deleteTask] Starting task deletion', { taskId, useSupabase });
  
  if (useSupabase) {
    try {
      // First get the task to see if it's a Canvas task
      const { data: taskToDelete, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (fetchError) {
        logger.warn('[deleteTask] Could not fetch task before deletion:', fetchError);
      } else {
        logger.debug('[deleteTask] Task being deleted:', { 
          title: taskToDelete?.title, 
          canvas_uid: taskToDelete?.canvas_uid,
          isCanvasTask: !!taskToDelete?.canvas_uid 
        });
      }

      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) {
        const handled = errorHandler.handle(
          error,
          'deleteTask - Supabase delete',
          { taskId }
        );
        throw errorHandler.data.saveFailed({
          operation: 'deleteTask',
          taskId,
          originalError: error.message
        });
      }

      logger.debug('[deleteTask] Successfully deleted from Supabase');

      const tasks = getLocalData<Task[]>(TASKS_KEY, []);
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      saveLocalData(TASKS_KEY, updatedTasks);
      
      logger.debug('[deleteTask] Local storage updated');
      return true;
    } catch (error: unknown) {
      if ((error as ServiceError).name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error as Error,
        'deleteTask - unexpected error',
        { taskId, useSupabase }
      );
      throw errorHandler.data.saveFailed({
        operation: 'deleteTask - unexpected error',
        taskId,
        originalError: (error as Error).message
      });
    }
  } else {
    logger.debug('[deleteTask] Deleting from local storage only');
    const tasks = getLocalData<Task[]>(TASKS_KEY, []);
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    saveLocalData(TASKS_KEY, updatedTasks);
  }

  return true;
};