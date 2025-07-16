import { getCurrentUser } from "./authService";
import { supabase } from "./supabaseClient";
import { logger } from "../utils/logger";

const TASKS_KEY = "calendar_tasks";
const CLASSES_KEY = "calendar_classes";
const TASK_TYPES_KEY = "calendar_task_types";
const SETTINGS_KEY = "calendar_settings";

// Performance cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (operation, userId, params = {}) => {
  return `${operation}_${userId}_${JSON.stringify(params)}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('Cache hit', { key });
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired cache
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
  // Clean up old cache entries periodically
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp > CACHE_TTL) {
        cache.delete(k);
      }
    }
  }
};

const invalidateCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
  logger.debug('Cache invalidated', { pattern });
};

// Utility function to generate unique ID
export const generateUniqueId = () => {
  return `class${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const getLocalData = (key, defaultValue = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getTasks = async (userId, useSupabase = false) => {
  logger.debug('getTasks called', { userId: !!userId, userIdType: typeof userId, useSupabase });
  
  if (useSupabase) {
    if (!userId) {
      logger.warn('getTasks: Supabase requested without userId, falling back to local data');
      return getLocalData(TASKS_KEY);
    }

    // Check cache first
    const cacheKey = getCacheKey('getTasks', userId);
    const cachedData = getCachedData(cacheKey);
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
        logger.error('Failed to fetch tasks from Supabase', { error: error.message });
        return getLocalData(TASKS_KEY);
      }

      logger.debug('Retrieved tasks from Supabase', { taskCount: data?.length || 0, userId: !!userId });
      
      // Cache the result
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('getTasks Supabase error', { error: error.message });
      return getLocalData(TASKS_KEY);
    }
  }
  return getLocalData(TASKS_KEY);
};

export const addTask = async (task, useSupabase = false, providedUser = null) => {
  console.log('[addTask] Entered function. Task summary for identification:', task ? task.title : 'Task undefined', 'useSupabase:', useSupabase, 'User provided:', !!providedUser);
  try {
    // Ensure created_at is set, Supabase default might handle this but good practice
    const taskWithTimestamp = {
      ...task,
      created_at: task.created_at || new Date().toISOString(),
    };

    if (useSupabase) {
      console.log('[addTask] Inside useSupabase block.');
      
      let userToUse = providedUser;
      if (!userToUse) {
        console.log('[addTask] No user provided directly, calling getCurrentUser.');
        userToUse = await getCurrentUser();
      } else {
        console.log('[addTask] Using provided user object. User ID:', userToUse.id);
      }
      
      // console.log('[addTask] getCurrentUser call completed. User ID:', userToUse ? userToUse.id : 'User object is null or undefined'); // Keep for now, or adapt

      if (!userToUse) {
        console.error("[addTask] No authenticated user found for addTask (user object is null).");
        throw new Error("User not authenticated");
      }

      // De-duplication logic for canvas_uid (only if canvas_uid is truthy)
      if (task.canvas_uid && String(task.canvas_uid).trim() !== "") {
        const canvasUIDString = String(task.canvas_uid).trim();
        console.log(`[addTask] Checking for existing task. User ID: ${userToUse.id}, Canvas UID: '${canvasUIDString}'`);

        const { data: existingTasks, error: existingTaskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", userToUse.id)
          .eq("canvas_uid", canvasUIDString)
          .limit(1); // Expect at most one match

        if (existingTaskError) {
          console.error(`[addTask] Error checking for existing task with canvas_uid ${canvasUIDString}:`, existingTaskError);
          throw existingTaskError; // Critical: stop if check fails
        }

        if (existingTasks && existingTasks.length > 0) {
          const existingSupabaseTask = existingTasks[0];
          console.log(`[addTask] Task with canvas_uid ${canvasUIDString} already exists in Supabase. DB record:`, existingSupabaseTask);
          
          // Update local storage with the task from Supabase to ensure consistency
          const currentLocalTasks = getLocalData(TASKS_KEY);
          const taskIndex = currentLocalTasks.findIndex(t => t.id === existingSupabaseTask.id || (t.canvas_uid && String(t.canvas_uid) === canvasUIDString));
          
          if (taskIndex !== -1) {
            currentLocalTasks[taskIndex] = existingSupabaseTask; // Update existing local task
          } else {
            currentLocalTasks.push(existingSupabaseTask); // Add if missing locally (e.g., first sync)
          }
          saveLocalData(TASKS_KEY, currentLocalTasks);
          console.log(`[addTask] Local storage synced for existing task with canvas_uid ${canvasUIDString}.`);
          
          return existingSupabaseTask; // Return the existing task from Supabase
        } else {
          console.log(`[addTask] No existing task found for canvas_uid: ${canvasUIDString}. Proceeding to insert new task.`);
        }
      } else {
        console.log(`[addTask] canvas_uid is not present or is empty (value: '${task.canvas_uid}', type: ${typeof task.canvas_uid}). Skipping de-duplication check and proceeding to insert.`);
      }

      // Prepare task for Supabase: add user_id, ensure no client-side ID
      const { id, ...taskData } = taskWithTimestamp; // Remove client-generated ID if any
      const taskToSave = {
        ...taskData,
        user_id: userToUse.id,
        canvas_uid: (task.canvas_uid && String(task.canvas_uid).trim() !== "") ? String(task.canvas_uid) : null, // Store as string or null
      };

      console.log("[addTask] Attempting to insert new task into Supabase:", taskToSave);

      try {
        const { data: insertedData, error: insertError } = await supabase
          .from("tasks")
          .insert(taskToSave)
          .select("*"); 

        if (insertError) {
          console.error("[addTask] Supabase task insertion error:", insertError);
          console.error("[addTask] Task data causing error:", taskToSave);
          throw insertError;
        }

        const newSupabaseTask = insertedData[0];
        console.log("[addTask] Task added successfully to Supabase:", newSupabaseTask);

        // Update local storage with the newly inserted task
        const localTasksAfterInsert = getLocalData(TASKS_KEY);
        // Avoid adding duplicates to local storage if it somehow got there already
        const existingLocalTaskIndex = localTasksAfterInsert.findIndex(t => t.id === newSupabaseTask.id);
        let tasksToSaveLocally;

        if (existingLocalTaskIndex !== -1) {
            localTasksAfterInsert[existingLocalTaskIndex] = newSupabaseTask; // Update if present by id
            tasksToSaveLocally = [...localTasksAfterInsert];
        } else {
            tasksToSaveLocally = [...localTasksAfterInsert, newSupabaseTask]; // Add if new
        }
        saveLocalData(TASKS_KEY, tasksToSaveLocally);
        console.log("[addTask] Local storage updated after new task insertion.");

        return newSupabaseTask;
      } catch (error) {
        console.error("[addTask] Error during Supabase insert operation:", error);
        throw error; 
      }
    } else {
      // Local storage fallback
      const taskToSaveLocally = {
        id: task.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
         ...taskWithTimestamp,
         canvas_uid: (task.canvas_uid && String(task.canvas_uid).trim() !== "") ? String(task.canvas_uid) : null,
       };
      console.log("[addTask] Saving task to local storage:", taskToSaveLocally);
      const tasks = getLocalData(TASKS_KEY);
      
      let updatedTasks;
      // Local de-duplication for canvas_uid (if present) or ID
      const existingLocalIndexById = tasks.findIndex(t => t.id === taskToSaveLocally.id);
      let existingLocalIndexByCanvasUid = -1;
      if (taskToSaveLocally.canvas_uid) {
          existingLocalIndexByCanvasUid = tasks.findIndex(t => t.canvas_uid && String(t.canvas_uid) === String(taskToSaveLocally.canvas_uid));
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
  } catch (error) {
    console.error("Error in addTask (overall):", error);
    throw error; // Propagate error
  }
};

export const updateTask = async (taskId, updatedTask, useSupabase = false) => {
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

      if (error) throw error;

      const localTasks = getLocalData(TASKS_KEY);
      const updatedTasks = localTasks.map((task) =>
        task.id === taskId ? { ...task, ...taskToUpdate } : task
      );
      saveLocalData(TASKS_KEY, updatedTasks);

      return data[0];
    } catch (error) {
      console.error("Error updating task in Supabase:", error.message);
    }
  } else {
    const tasks = getLocalData(TASKS_KEY);
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, ...taskToUpdate } : task
    );
    saveLocalData(TASKS_KEY, updatedTasks);
  }

  return { id: taskId, ...taskToUpdate };
};

export const deleteTask = async (taskId, useSupabase = false) => {
  if (useSupabase) {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;

      const tasks = getLocalData(TASKS_KEY);
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      saveLocalData(TASKS_KEY, updatedTasks);
      return true;
    } catch (error) {
      console.error("Error deleting task from Supabase:", error.message);
    }
  } else {
    const tasks = getLocalData(TASKS_KEY);
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    saveLocalData(TASKS_KEY, updatedTasks);
  }

  return true;
};

export const getClasses = async (userId, useSupabase = false) => {
  console.log('[getClasses] Entered. userId:', userId, '(type:', typeof userId + ')', 'useSupabase:', useSupabase);
  if (useSupabase) {
    if (!userId) {
      console.error("[getClasses] Supabase fetch requested but no userId provided. Falling back to local data.");
      return getLocalData(CLASSES_KEY);
    }
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*, class_syllabi(*), class_files(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching classes from Supabase:", error);
        return getLocalData(CLASSES_KEY);
      }
      console.log(`Retrieved ${data?.length || 0} classes from Supabase for user ${userId}`);
      return data.map(cls => {
        const { istaskclass, class_syllabi, class_files, ...cleanCls } = cls;
        return {
          ...cleanCls,
          syllabus: class_syllabi && class_syllabi.length > 0 ? class_syllabi[0] : null,
          files: class_files || [],
          isTaskClass: istaskclass // Map database column to JavaScript field name
        };
      });
    } catch (error) {
      console.error("Error in getClasses (Supabase path):", error);
      return getLocalData(CLASSES_KEY);
    }
  }
  return getLocalData(CLASSES_KEY);
};

export const addClass = async (classObj, useSupabase = false) => {
  // Create a clean class object without files and syllabus
  // (we'll handle those separately in our new tables)
  const { files, syllabus, ...cleanClassObj } = classObj;
  
  const classToSave = {
    ...cleanClassObj,
    id: cleanClassObj.id || generateUniqueId(),
    created_at: new Date().toISOString(),
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
      const classWithUserId = {
        ...classToSave,
        user_id: user.id,
      };
      
      // Map isTaskClass to database column name (istaskclass)
      const { isTaskClass, ...classForSupabase } = classWithUserId;
      if (isTaskClass !== undefined) {
        classForSupabase.istaskclass = isTaskClass;
      }
      
      const { data, error } = await supabase
        .from("classes")
        .insert([classForSupabase])
        .select();

      if (error) throw error;

      // Handle files in the separate table if they exist
      const savedFiles = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const fileData = {
            ...file,
            class_id: data[0].id,
            owner: user.id,
            uploaded_at: new Date().toISOString()
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
      let savedSyllabus = null;
      if (syllabus) {
        const syllabusData = {
          ...syllabus,
          class_id: data[0].id,
          owner: user.id,
          uploaded_at: new Date().toISOString()
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
      const fullClassData = {
        ...dbData,
        files: savedFiles,
        syllabus: savedSyllabus,
        isTaskClass: istaskclass // Map database column back to JavaScript field name
      };

      // Update local cache with the complete data
      const localClasses = getLocalData(CLASSES_KEY);
      saveLocalData(CLASSES_KEY, [...localClasses, fullClassData]);

      return fullClassData;
    } catch (error) {
      console.error("Error adding class to Supabase:", error.message);
    }
  } else {
    // For local storage, keep files and syllabus with the class
    const classWithFileData = {
      ...classToSave,
      files: files || [],
      syllabus: syllabus || null
    };
    
    const classes = getLocalData(CLASSES_KEY);
    const updatedClasses = [...classes, classWithFileData];
    saveLocalData(CLASSES_KEY, updatedClasses);
    
    return classWithFileData;
  }

  return { ...classToSave, files: files || [], syllabus: syllabus || null };
};

export const updateClass = async (
  classId,
  updatedClass,
  useSupabase = false
) => {
  if (useSupabase) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User is not authenticated.");
      }

      // Create a clean object for the update
      const updateData = {
        name: updatedClass.name,
        user_id: user.id,
      };

      console.log(`[updateClass] Attempting to update class ${classId} in Supabase with data:`, updateData);

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
        const fullClassData = {
          ...data[0],
          files: latestFiles,
        };

        // Update local cache with the complete data
        const localClasses = getLocalData(CLASSES_KEY);
        const updatedClasses = localClasses.map((cls) =>
          cls.id === classId ? fullClassData : cls
        );
        saveLocalData(CLASSES_KEY, updatedClasses);

        return fullClassData;
      }
    } catch (error) {
      console.error("Error updating class in Supabase:", error.message);
      // Fall back to local storage only
    }
  } else {
    // For local storage, we keep the files and syllabus with the class
    const completeClassData = {
      ...updatedClass,
      files: updatedClass.files || [],
      syllabus: updatedClass.syllabus
    };
    
    const classes = getLocalData(CLASSES_KEY);
    const updatedClasses = classes.map((cls) =>
      cls.id === classId ? completeClassData : cls
    );
    saveLocalData(CLASSES_KEY, updatedClasses);
    
    return completeClassData;
  }

  // Return the complete data
  return { 
    id: classId, 
    ...updatedClass,
    files: updatedClass.files || [],
    syllabus: updatedClass.syllabus
  };
};

export const deleteClass = async (classId, useSupabase = false) => {
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
      const filePaths = [];
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
      const localClasses = getLocalData(CLASSES_KEY);
      const updatedClasses = localClasses.filter((cls) => cls.id !== classId);
      saveLocalData(CLASSES_KEY, updatedClasses);

      return true;
    } catch (error) {
      console.error("Error deleting class from Supabase:", error.message);
    }
  } else {
    const classes = getLocalData(CLASSES_KEY);
    const updatedClasses = classes.filter((cls) => cls.id !== classId);
    saveLocalData(CLASSES_KEY, updatedClasses);
  }

  return true;
};

export const getTaskTypes = async (userId, useSupabase = false) => {
  console.log('[getTaskTypes] Entered. userId:', userId, '(type:', typeof userId + ')', 'useSupabase:', useSupabase);
  if (useSupabase) {
    if (!userId) {
      console.error("[getTaskTypes] Supabase fetch requested but no userId provided. Falling back to local data.");
      return getLocalData(TASK_TYPES_KEY);
    }
    try {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching task types from Supabase:", error);
        return getLocalData(TASK_TYPES_KEY);
      }
      console.log(`Retrieved ${data?.length || 0} task types from Supabase for user ${userId}`);
      return data;
    } catch (error) {
      console.error("Error in getTaskTypes (Supabase path):", error);
      return getLocalData(TASK_TYPES_KEY);
    }
  }
  return getLocalData(TASK_TYPES_KEY);
};

export const addTaskType = async (taskType, useSupabase = false) => {
  try {
    const typeToSave = {
      ...taskType,
      id: taskType.id || `type_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      created_at: new Date().toISOString(),
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
        const typeWithUserId = {
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

        // Also update local cache
        const localTypes = getLocalData(TASK_TYPES_KEY);
        saveLocalData(TASK_TYPES_KEY, [...localTypes, data[0]]);

        return data[0];
      } catch (error) {
        console.error("Error adding task type to Supabase:", error.message);
        throw error;
      }
    } else {
      const types = getLocalData(TASK_TYPES_KEY);
      const updatedTypes = [...types, typeToSave];
      saveLocalData(TASK_TYPES_KEY, updatedTypes);
      return typeToSave;
    }
  } catch (error) {
    console.error("Error in addTaskType:", error);
    return null;
  }
};

export const updateTaskType = async (
  typeId,
  updatedType,
  useSupabase = false
) => {
  const typeToUpdate = {
    ...updatedType,
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

      const localTypes = getLocalData(TASK_TYPES_KEY);
      const updatedTypes = localTypes.map((type) =>
        type.id === typeId ? { ...type, ...typeToUpdate } : type
      );
      saveLocalData(TASK_TYPES_KEY, updatedTypes);

      return data[0];
    } catch (error) {
      console.error("Error updating task type in Supabase:", error.message);
    }
  } else {
    const types = getLocalData(TASK_TYPES_KEY);
    const updatedTypes = types.map((type) =>
      type.id === typeId ? { ...type, ...typeToUpdate } : type
    );
    saveLocalData(TASK_TYPES_KEY, updatedTypes);
  }

  return { id: typeId, ...typeToUpdate };
};

export const deleteTaskType = async (typeId, useSupabase = false) => {
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from("task_types")
        .delete()
        .eq("id", typeId);

      if (error) throw error;

      const localTypes = getLocalData(TASK_TYPES_KEY);
      const updatedTypes = localTypes.filter((type) => type.id !== typeId);
      saveLocalData(TASK_TYPES_KEY, updatedTypes);

      return true;
    } catch (error) {
      console.error("Error deleting task type from Supabase:", error.message);
    }
  } else {
    const types = getLocalData(TASK_TYPES_KEY);
    const updatedTypes = types.filter((type) => type.id !== typeId);
    saveLocalData(TASK_TYPES_KEY, updatedTypes);
  }

  return true;
};

export const getSettings = () => {
  return getLocalData(SETTINGS_KEY, { title: "UCR" });
};

export const updateSettings = (settings) => {
  saveLocalData(SETTINGS_KEY, settings);
  return settings;
};
