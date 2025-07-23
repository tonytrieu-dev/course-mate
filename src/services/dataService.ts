import type { User } from '@supabase/supabase-js';
import { getCurrentUser } from "./authService";
import { supabase } from "./supabaseClient";
import { logger } from "../utils/logger";
import { errorHandler, ERROR_CODES } from "../utils/errorHandler";
import { getLocalData, saveLocalData } from "../utils/storageHelpers";
import { defaultCache } from "../utils/cacheHelpers";
import { generateUniqueId, generateClassId, generateTypeId } from "../utils/idHelpers";
import { createSupabaseHelper } from "../utils/supabaseHelpers";
import type {
  Task,
  TaskInsert,
  TaskUpdate,
  Class,
  ClassInsert,
  ClassUpdate,
  ClassWithRelations,
  TaskType,
  TaskTypeInsert,
  TaskTypeUpdate,
  ClassFile,
  ClassFileInsert,
  ClassSyllabus,
  ClassSyllabusInsert,
  AppSettings
} from '../types/database';
import { STORAGE_KEYS } from '../types/database';
import type {
  QueryOptions,
  ServiceError,
  CacheOptions,
  BulkOperationResult,
  FileUploadData
} from '../types/service';

const TASKS_KEY = STORAGE_KEYS.TASKS;
const CLASSES_KEY = STORAGE_KEYS.CLASSES;
const TASK_TYPES_KEY = STORAGE_KEYS.TASK_TYPES;
const SETTINGS_KEY = STORAGE_KEYS.SETTINGS;

// Create Supabase helpers for each table
const tasksHelper = createSupabaseHelper('tasks');
const classesHelper = createSupabaseHelper('classes');
const taskTypesHelper = createSupabaseHelper('task_types');

// Cache helper functions
const getCacheKey = (operation: string, userId: string, params: Record<string, any> = {}): string => {
  return defaultCache.getCacheKey(operation, userId, params);
};

const getCachedData = <T>(key: string): T | null => {
  return defaultCache.get(key);
};

const setCachedData = <T>(key: string, data: T): void => {
  defaultCache.set(key, data);
};

const invalidateCache = (pattern: string): void => {
  defaultCache.invalidate(pattern);
  logger.debug('Cache invalidated', { pattern });
};

// Export the generateUniqueId for backwards compatibility
export { generateUniqueId } from "../utils/idHelpers";

// Task operations
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

    // Check cache first
    const cacheKey = getCacheKey('getTasks', userId);
    const cachedData = getCachedData<Task[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get tasks filtered by user_id
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
      
      // Cache the result
      setCachedData(cacheKey, data || []);
      return data || [];
    } catch (error: any) {
      const handled = errorHandler.handle(
        error,
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
    // Ensure created_at is set, Supabase default might handle this but good practice
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

      // De-duplication logic for canvas_uid (only if canvas_uid is truthy)
      if (task.canvas_uid && String(task.canvas_uid).trim() !== "") {
        const canvasUIDString = String(task.canvas_uid).trim();
        logger.debug(`[addTask] Checking for existing task. User ID: ${userToUse.id}, Canvas UID: '${canvasUIDString}'`);

        const { data: existingTasks, error: existingTaskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userToUse.id)
          .eq("canvas_uid", canvasUIDString)
          .limit(1); // Expect at most one match

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
          logger.debug(`[addTask] Task with canvas_uid ${canvasUIDString} already exists in Supabase. DB record:`, existingSupabaseTask);
          
          // Update local storage with the task from Supabase to ensure consistency
          const currentLocalTasks = getLocalData<Task[]>(TASKS_KEY, []);
          const taskIndex = currentLocalTasks.findIndex(t => 
            t.id === existingSupabaseTask.id || 
            (t.canvas_uid && String(t.canvas_uid) === canvasUIDString)
          );
          
          if (taskIndex !== -1) {
            currentLocalTasks[taskIndex] = existingSupabaseTask; // Update existing local task
          } else {
            currentLocalTasks.push(existingSupabaseTask); // Add if missing locally (e.g., first sync)
          }
          saveLocalData(TASKS_KEY, currentLocalTasks);
          logger.debug(`[addTask] Local storage synced for existing task with canvas_uid ${canvasUIDString}.`);
          
          return existingSupabaseTask; // Return the existing task from Supabase
        } else {
          logger.debug(`[addTask] No existing task found for canvas_uid: ${canvasUIDString}. Proceeding to insert new task.`);
        }
      } else {
        logger.debug(`[addTask] canvas_uid is not present or is empty (value: '${task.canvas_uid}', type: ${typeof task.canvas_uid}). Skipping de-duplication check and proceeding to insert.`);
      }

      // Prepare task for Supabase: add user_id, ensure no client-side ID
      const { id, ...taskData } = taskWithTimestamp; // Remove client-generated ID if any
      const taskToSave: TaskInsert = {
        ...taskData,
        user_id: userToUse.id,
        title: taskData.title || 'Untitled Task',
        completed: taskData.completed ?? false,
        canvas_uid: (task.canvas_uid && String(task.canvas_uid).trim() !== "") ? String(task.canvas_uid) : undefined, // Store as string or undefined
      };

      logger.debug("[addTask] Attempting to insert new task into Supabase:", taskToSave);

      try {
        const { data: insertedData, error: insertError } = await supabase
          .from("tasks")
          .insert(taskToSave)
          .select("*"); 

        if (insertError) {
          const handled = errorHandler.handle(
            insertError,
            'addTask - Supabase insertion',
            { taskTitle: task?.title, taskData: taskToSave }
          );
          throw errorHandler.data.saveFailed({
            operation: 'addTask - Supabase insertion',
            taskTitle: task?.title,
            originalError: insertError.message
          });
        }

        const newSupabaseTask = insertedData[0];
        logger.debug("[addTask] Task added successfully to Supabase:", newSupabaseTask);

        // Update local storage with the newly inserted task
        const localTasksAfterInsert = getLocalData<Task[]>(TASKS_KEY, []);
        // Avoid adding duplicates to local storage if it somehow got there already
        const existingLocalTaskIndex = localTasksAfterInsert.findIndex(t => t.id === newSupabaseTask.id);
        let tasksToSaveLocally: Task[];

        if (existingLocalTaskIndex !== -1) {
            localTasksAfterInsert[existingLocalTaskIndex] = newSupabaseTask; // Update if present by id
            tasksToSaveLocally = [...localTasksAfterInsert];
        } else {
            tasksToSaveLocally = [...localTasksAfterInsert, newSupabaseTask]; // Add if new
        }
        saveLocalData(TASKS_KEY, tasksToSaveLocally);
        logger.debug("[addTask] Local storage updated after new task insertion.");

        return newSupabaseTask;
      } catch (error: any) {
        // If it's already a ServiceError, just re-throw it
        if (error.name === 'ServiceError') {
          throw error;
        }
        
        const handled = errorHandler.handle(
          error,
          'addTask - Supabase operation',
          { taskTitle: task?.title, useSupabase }
        );
        throw errorHandler.data.saveFailed({
          operation: 'addTask - Supabase operation',
          taskTitle: task?.title,
          originalError: error.message
        });
      }
    } else {
      // Local storage fallback
      const taskToSaveLocally: Task = {
        id: (task.id as string) || generateUniqueId('task'),
        user_id: 'local-user',
        title: taskWithTimestamp.title || 'Untitled Task',
        description: taskWithTimestamp.description,
        completed: taskWithTimestamp.completed ?? false,
        due_date: taskWithTimestamp.due_date,
        priority: taskWithTimestamp.priority,
        type: taskWithTimestamp.type,
        canvas_uid: (task.canvas_uid && String(task.canvas_uid).trim() !== "") ? String(task.canvas_uid) : undefined,
        created_at: taskWithTimestamp.created_at || new Date().toISOString(),
        updated_at: taskWithTimestamp.updated_at,
      };
      
      logger.debug("[addTask] Saving task to local storage:", taskToSaveLocally);
      const tasks = getLocalData<Task[]>(TASKS_KEY, []);
      
      let updatedTasks: Task[];
      // Local de-duplication for canvas_uid (if present) or ID
      const existingLocalIndexById = tasks.findIndex(t => t.id === taskToSaveLocally.id);
      let existingLocalIndexByCanvasUid = -1;
      if (taskToSaveLocally.canvas_uid) {
          existingLocalIndexByCanvasUid = tasks.findIndex(t => 
            t.canvas_uid && String(t.canvas_uid) === String(taskToSaveLocally.canvas_uid)
          );
      }

      if (taskToSaveLocally.canvas_uid && existingLocalIndexByCanvasUid !== -1) {
          tasks[existingLocalIndexByCanvasUid] = taskToSaveLocally; // Update by canvas_uid
          updatedTasks = [...tasks];
      } else if (existingLocalIndexById !== -1) {
          tasks[existingLocalIndexById] = taskToSaveLocally; // Update by ID
          updatedTasks = [...tasks];
      } else {
          updatedTasks = [...tasks, taskToSaveLocally]; // Add if new
      }
      saveLocalData(TASKS_KEY, updatedTasks);
      return taskToSaveLocally;
    }
  } catch (error: any) {
    // If it's already a ServiceError, just re-throw it with proper logging
    if (error.name === 'ServiceError') {
      // Already handled and logged
      throw error;
    }
    
    // Handle unexpected errors
    const handled = errorHandler.handle(
      error,
      'addTask - overall operation',
      { taskTitle: task?.title, useSupabase, providedUser: !!providedUser }
    );
    throw errorHandler.data.saveFailed({
      operation: 'addTask - overall operation',
      taskTitle: task?.title,
      originalError: error.message
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
    } catch (error: any) {
      // If it's already a ServiceError, just re-throw it
      if (error.name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error,
        'updateTask - unexpected error',
        { taskId, useSupabase, taskTitle: updatedTask?.title }
      );
      throw errorHandler.data.saveFailed({
        operation: 'updateTask - unexpected error',
        taskId,
        originalError: error.message
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
  if (useSupabase) {
    try {
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

      const tasks = getLocalData<Task[]>(TASKS_KEY, []);
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      saveLocalData(TASKS_KEY, updatedTasks);
      return true;
    } catch (error: any) {
      // If it's already a ServiceError, just re-throw it
      if (error.name === 'ServiceError') {
        throw error;
      }
      
      const handled = errorHandler.handle(
        error,
        'deleteTask - unexpected error',
        { taskId, useSupabase }
      );
      throw errorHandler.data.saveFailed({
        operation: 'deleteTask - unexpected error',
        taskId,
        originalError: error.message
      });
    }
  } else {
    const tasks = getLocalData<Task[]>(TASKS_KEY, []);
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    saveLocalData(TASKS_KEY, updatedTasks);
  }

  return true;
};

// Class operations
export const getClasses = async (userId?: string, useSupabase = false): Promise<ClassWithRelations[]> => {
  logger.debug('[getClasses] Entered. userId:', userId, '(type:', typeof userId + ')', 'useSupabase:', useSupabase);
  
  if (useSupabase) {
    if (!userId) {
      const handled = errorHandler.handle(
        errorHandler.auth.notAuthenticated({ operation: 'getClasses' }),
        'getClasses',
        { useSupabase, fallbackUsed: true }
      );
      logger.warn(handled.userMessage);
      return getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    }
    
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*, class_syllabi(*), class_files(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching classes from Supabase:", error);
        return getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
      }
      
      logger.debug(`Retrieved ${data?.length || 0} classes from Supabase for user ${userId}`);
      return data.map(cls => {
        const { istaskclass, class_syllabi, class_files, ...cleanCls } = cls;
        return {
          ...cleanCls,
          syllabus: class_syllabi && class_syllabi.length > 0 ? class_syllabi[0] : null,
          files: class_files || [],
          isTaskClass: istaskclass // Map database column to JavaScript field name
        } as ClassWithRelations;
      });
    } catch (error: any) {
      console.error("Error in getClasses (Supabase path):", error);
      return getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    }
  }
  
  return getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
};

export const addClass = async (
  classObj: Partial<ClassInsert> & { files?: ClassFile[]; syllabus?: ClassSyllabus | null }, 
  useSupabase = false
): Promise<ClassWithRelations> => {
  // Create a clean class object without files and syllabus
  // (we'll handle those separately in our new tables)
  const { files, syllabus, ...cleanClassObj } = classObj;
  
  const classToSave: ClassInsert = {
    ...cleanClassObj,
    id: cleanClassObj.id || generateUniqueId(),
    user_id: cleanClassObj.user_id || 'local-user',
    name: cleanClassObj.name || 'Untitled Class',
    created_at: cleanClassObj.created_at || new Date().toISOString(),
  };

  if (useSupabase) {
    try {
      // Get current user ID
      const user = await getCurrentUser();
      
      if (!user) {
        console.error("No authenticated user found for addClass");
        throw new Error("Not authenticated");
      }
      
      // Add user_id to the class data and map isTaskClass to istaskclass for database
      const classWithUserId: ClassInsert = {
        ...classToSave,
        user_id: user.id,
      };
      
      // Map isTaskClass to database column name (istaskclass)
      const { isTaskClass, ...classWithoutIsTaskClass } = classWithUserId as any;
      const classForSupabase = {
        ...classWithoutIsTaskClass,
        istaskclass: isTaskClass || false
      };
      
      const { data, error } = await supabase
        .from("classes")
        .insert([classForSupabase])
        .select();

      if (error) throw error;

      // Handle files in the separate table if they exist
      const savedFiles: ClassFile[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const fileData: ClassFileInsert = {
            ...file,
            class_id: data[0].id,
            owner: user.id,
            uploaded_at: file.uploaded_at || new Date().toISOString()
          };
          
          const { data: fileDbData, error: fileDbError } = await supabase
            .from("class_files")
            .insert([fileData])
            .select();
            
          if (fileDbError) {
            console.error("Error storing file metadata:", fileDbError);
          } else if (fileDbData) {
            savedFiles.push(fileDbData[0]);
          }
        }
      }
      
      // Handle syllabus in the separate table if it exists
      let savedSyllabus: ClassSyllabus | null = null;
      if (syllabus) {
        const syllabusData: ClassSyllabusInsert = {
          ...syllabus,
          class_id: data[0].id,
          owner: user.id,
          uploaded_at: syllabus.uploaded_at || new Date().toISOString()
        };
        
        const { data: syllabusDbData, error: syllabusDbError } = await supabase
          .from("class_syllabi")
          .insert([syllabusData])
          .select();
          
        if (syllabusDbError) {
          console.error("Error storing syllabus metadata:", syllabusDbError);
        } else if (syllabusDbData) {
          savedSyllabus = syllabusDbData[0];
        }
      }
      
      // Combine the data for local storage, mapping database column back to JavaScript field
      const { istaskclass, ...dbData } = data[0];
      const fullClassData: ClassWithRelations = {
        ...dbData,
        files: savedFiles,
        syllabus: savedSyllabus,
        isTaskClass: istaskclass // Map database column back to JavaScript field name
      };

      // Update local cache with the complete data
      const localClasses = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
      saveLocalData(CLASSES_KEY, [...localClasses, fullClassData]);

      return fullClassData;
    } catch (error: any) {
      console.error("Error adding class to Supabase:", error.message);
      throw error;
    }
  } else {
    // For local storage, keep files and syllabus with the class
    const classWithFileData: ClassWithRelations = {
      id: classToSave.id as string,
      user_id: classToSave.user_id,
      name: classToSave.name,
      created_at: classToSave.created_at as string,
      updated_at: classToSave.updated_at,
      files: files || [],
      syllabus: syllabus || null,
      isTaskClass: (classObj as any).isTaskClass || false
    };
    
    const classes = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    const updatedClasses = [...classes, classWithFileData];
    saveLocalData(CLASSES_KEY, updatedClasses);
    
    return classWithFileData;
  }
};

// Continue with the rest of the dataService methods...
// I'll need to continue in the next part due to length constraints

export const updateClass = async (
  classId: string,
  updatedClass: Partial<ClassUpdate> & { files?: ClassFile[]; syllabus?: ClassSyllabus | null },
  useSupabase = false
): Promise<ClassWithRelations> => {
  if (useSupabase) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User is not authenticated.");
      }

      // Create a clean object for the update
      const updateData: ClassUpdate = {
        name: updatedClass.name,
        user_id: user.id,
      };

      logger.debug(`[updateClass] Attempting to update class ${classId} in Supabase with data:`, updateData);

      const { data, error } = await supabase
        .from("classes")
        .update(updateData)
        .eq("id", classId)
        .select("*");

      if (error) {
        console.error(`Error updating class in Supabase:`, error.message);
        // Add more context to the error
        if (error.message.includes("column")) {
          console.error("This might be a schema mismatch. Check the columns in your 'classes' table.");
          console.error("Data sent:", updatedClass);
        }
        throw error;
      }

      // Get the latest files for this class
      const { data: latestFiles } = await supabase
        .from("class_files")
        .select("*")
        .eq("class_id", classId);
        
      if (latestFiles) {
        const fullClassData: ClassWithRelations = {
          ...data[0],
          files: latestFiles,
          syllabus: null, // Could be enhanced to fetch syllabus too
          isTaskClass: data[0].istaskclass || false
        };

        // Update local cache with the complete data
        const localClasses = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
        const updatedClasses = localClasses.map((cls) =>
          cls.id === classId ? fullClassData : cls
        );
        saveLocalData(CLASSES_KEY, updatedClasses);

        return fullClassData;
      }
      
      // Fallback if files fetch fails
      return {
        ...data[0],
        files: [],
        syllabus: null,
        isTaskClass: data[0].istaskclass || false
      };
    } catch (error: any) {
      console.error("Error updating class in Supabase:", error.message);
      throw error;
    }
  } else {
    // For local storage, we keep the files and syllabus with the class
    const completeClassData: ClassWithRelations = {
      id: classId,
      user_id: 'local-user',
      name: updatedClass.name || 'Untitled Class',
      created_at: new Date().toISOString(),
      files: updatedClass.files || [],
      syllabus: updatedClass.syllabus || null,
      isTaskClass: false
    };
    
    const classes = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    const updatedClasses = classes.map((cls) =>
      cls.id === classId ? { ...cls, ...completeClassData } : cls
    );
    saveLocalData(CLASSES_KEY, updatedClasses);
    
    return completeClassData;
  }
};

export const deleteClass = async (classId: string, useSupabase = false): Promise<boolean> => {
  if (useSupabase) {
    try {
      // First, fetch the class to get its files and syllabus
      const { data: existingClass, error: fetchError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching class for deletion:", fetchError);
      }
      
      // Get files from class_files
      const { data: classFiles, error: filesError } = await supabase
        .from("class_files")
        .select("path")
        .eq("class_id", classId);
        
      if (filesError) {
        console.error("Error fetching class files for deletion:", filesError);
      }
      
      // Get syllabus from class_syllabi
      const { data: classSyllabus, error: syllabusError } = await supabase
        .from("class_syllabi")
        .select("path")
        .eq("class_id", classId)
        .single();
        
      if (syllabusError && syllabusError.code !== 'PGRST116') { // Code for no rows returned
        console.error("Error fetching class syllabus for deletion:", syllabusError);
      }
      
      // Delete files from storage
      const filePaths: string[] = [];
      if (classFiles && classFiles.length > 0) {
        classFiles.forEach(file => {
          if (file.path) filePaths.push(file.path);
        });
      }
      
      if (classSyllabus && classSyllabus.path) {
        filePaths.push(classSyllabus.path);
      }
      
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("class-materials")
          .remove(filePaths);
          
        if (storageError) {
          console.error("Error deleting files from storage:", storageError);
        }
      }
      
      // Delete files from class_files table
      if (classFiles && classFiles.length > 0) {
        const { error: deleteFilesError } = await supabase
          .from("class_files")
          .delete()
          .eq("class_id", classId);
          
        if (deleteFilesError) {
          console.error("Error deleting files from database:", deleteFilesError);
        }
      }
      
      // Delete syllabus from class_syllabi table
      if (classSyllabus) {
        const { error: deleteSyllabusError } = await supabase
          .from("class_syllabi")
          .delete()
          .eq("class_id", classId);
          
        if (deleteSyllabusError) {
          console.error("Error deleting syllabus from database:", deleteSyllabusError);
        }
      }
      
      // Finally delete the class
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      // Update local cache
      const localClasses = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
      const updatedClasses = localClasses.filter((cls) => cls.id !== classId);
      saveLocalData(CLASSES_KEY, updatedClasses);

      return true;
    } catch (error: any) {
      console.error("Error deleting class from Supabase:", error.message);
      throw error;
    }
  } else {
    const classes = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    const updatedClasses = classes.filter((cls) => cls.id !== classId);
    saveLocalData(CLASSES_KEY, updatedClasses);
  }

  return true;
};

// Task Type operations
export const getTaskTypes = async (userId?: string, useSupabase = false): Promise<TaskType[]> => {
  logger.debug('[getTaskTypes] Entered. userId:', userId, '(type:', typeof userId + ')', 'useSupabase:', useSupabase);
  
  if (useSupabase) {
    if (!userId) {
      console.error("[getTaskTypes] Supabase fetch requested but no userId provided. Falling back to local data.");
      return getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
    }
    
    try {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching task types from Supabase:", error);
        return getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
      }
      
      logger.debug(`Retrieved ${data?.length || 0} task types from Supabase for user ${userId}`);
      
      // Merge with local completedColor data
      const completedColors = getLocalData<Record<string, string>>('task_type_completed_colors', {});
      const typesWithCompletedColors = (data || []).map(type => ({
        ...type,
        completedColor: completedColors[type.id] || 'green'
      })) as TaskType[];
      
      return typesWithCompletedColors;
    } catch (error: any) {
      console.error("Error in getTaskTypes (Supabase path):", error);
      return getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
    }
  }
  
  return getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
};

export const addTaskType = async (taskType: Partial<TaskTypeInsert>, useSupabase = false): Promise<TaskType | null> => {
  try {
    // Extract completedColor since it's not in the database
    const { completedColor, ...dbTaskType } = taskType;
    
    const typeToSave: TaskTypeInsert = {
      ...dbTaskType,
      id: taskType.id || generateUniqueId('type'),
      user_id: taskType.user_id || 'local-user',
      name: taskType.name || 'Untitled Type',
      created_at: taskType.created_at || new Date().toISOString(),
    };

    if (useSupabase) {
      try {
        // Get current user ID
        const user = await getCurrentUser();
        
        if (!user) {
          console.error("No authenticated user found for addTaskType");
          throw new Error("Not authenticated");
        }
        
        // Add user_id to the task type data
        const typeWithUserId: TaskTypeInsert = {
          ...typeToSave,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from("task_types")
          .insert([typeWithUserId])
          .select();

        if (error) {
          console.error("Error adding task type to Supabase:", error);
          throw error;
        }

        // Also update local cache with completedColor
        const localTypes = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
        const newTaskType = { ...data[0], completedColor: completedColor || 'green' } as TaskType;
        saveLocalData(TASK_TYPES_KEY, [...localTypes, newTaskType]);

        // Save completedColor mapping separately
        if (completedColor) {
          const completedColors = getLocalData<Record<string, string>>('task_type_completed_colors', {});
          completedColors[data[0].id] = completedColor;
          saveLocalData('task_type_completed_colors', completedColors);
        }

        return newTaskType;
      } catch (error: any) {
        console.error("Error adding task type to Supabase:", error.message);
        throw error;
      }
    } else {
      const types = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
      const newTaskType = { ...typeToSave, completedColor: completedColor || 'green' } as TaskType;
      const updatedTypes = [...types, newTaskType];
      saveLocalData(TASK_TYPES_KEY, updatedTypes);
      return newTaskType;
    }
  } catch (error: any) {
    console.error("Error in addTaskType:", error);
    return null;
  }
};

export const updateTaskType = async (
  typeId: string,
  updatedType: Partial<TaskTypeUpdate>,
  useSupabase = false
): Promise<TaskType> => {
  // Extract completedColor from the update since it's not in the database
  const { completedColor, ...dbUpdate } = updatedType;
  
  const typeToUpdate = {
    ...dbUpdate,
    updated_at: new Date().toISOString(),
  };

  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("task_types")
        .update(typeToUpdate)
        .eq("id", typeId)
        .select();

      if (error) throw error;

      // Store completedColor in local storage separately
      const localTypes = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
      const updatedTypes = localTypes.map((type) =>
        type.id === typeId ? { ...type, ...data[0], completedColor } as TaskType : type
      );
      saveLocalData(TASK_TYPES_KEY, updatedTypes);

      // Also save completedColor mappings separately
      const completedColors = getLocalData<Record<string, string>>('task_type_completed_colors', {});
      if (completedColor !== undefined) {
        completedColors[typeId] = completedColor;
        saveLocalData('task_type_completed_colors', completedColors);
      }

      return { ...data[0], completedColor } as TaskType;
    } catch (error: any) {
      console.error("Error updating task type in Supabase:", error.message);
      throw error;
    }
  } else {
    const types = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
    const updatedTypes = types.map((type) =>
      type.id === typeId ? { ...type, ...typeToUpdate, ...updatedType } as TaskType : type
    );
    saveLocalData(TASK_TYPES_KEY, updatedTypes);
    
    // Return the full updated type
    const updatedTaskType = updatedTypes.find(t => t.id === typeId);
    return updatedTaskType || { id: typeId, ...typeToUpdate, ...updatedType } as TaskType;
  }

  return { id: typeId, ...typeToUpdate } as TaskType;
};

export const deleteTaskType = async (typeId: string, useSupabase = false): Promise<boolean> => {
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from("task_types")
        .delete()
        .eq("id", typeId);

      if (error) throw error;

      const localTypes = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
      const updatedTypes = localTypes.filter((type) => type.id !== typeId);
      saveLocalData(TASK_TYPES_KEY, updatedTypes);

      return true;
    } catch (error: any) {
      console.error("Error deleting task type from Supabase:", error.message);
      throw error;
    }
  } else {
    const types = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
    const updatedTypes = types.filter((type) => type.id !== typeId);
    saveLocalData(TASK_TYPES_KEY, updatedTypes);
  }

  return true;
};

// Settings operations
export const getSettings = (): AppSettings => {
  return getLocalData<AppSettings>(SETTINGS_KEY, { title: "UCR" });
};

export const updateSettings = (settings: AppSettings): AppSettings => {
  saveLocalData(SETTINGS_KEY, settings);
  return settings;
};