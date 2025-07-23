import type {
  TaskType,
  TaskTypeInsert,
  TaskTypeUpdate
} from '../../types/database';
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../authService";
import { logger } from "../../utils/logger";
import { getLocalData, saveLocalData } from "../../utils/storageHelpers";
import { generateUniqueId } from "../../utils/idHelpers";
import { STORAGE_KEYS } from '../../types/database';

const TASK_TYPES_KEY = STORAGE_KEYS.TASK_TYPES;

export const getTaskTypes = async (userId?: string, useSupabase = false): Promise<TaskType[]> => {
  logger.debug('[getTaskTypes] Entered. userId:', userId, '(type:', typeof userId + ')', 'useSupabase:', useSupabase);
  
  if (useSupabase) {
    if (!userId) {
      logger.error("[getTaskTypes] Supabase fetch requested but no userId provided. Falling back to local data.");
      return getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
    }
    
    try {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error) {
        logger.error("Error fetching task types from Supabase:", error);
        return getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
      }
      
      logger.debug(`Retrieved ${data?.length || 0} task types from Supabase for user ${userId}`);
      
      const completedColors = getLocalData<Record<string, string>>('task_type_completed_colors', {});
      const typesWithCompletedColors = (data || []).map(type => ({
        ...type,
        completedColor: completedColors[type.id] || 'green'
      })) as TaskType[];
      
      return typesWithCompletedColors;
    } catch (error: unknown) {
      logger.error("Error in getTaskTypes (Supabase path):", error);
      return getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
    }
  }
  
  return getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
};

export const addTaskType = async (taskType: Partial<TaskTypeInsert>, useSupabase = false): Promise<TaskType | null> => {
  try {
    const { completedColor, ...dbTaskType } = taskType as Partial<TaskTypeInsert> & { completedColor?: string };
    
    const typeToSave: TaskTypeInsert = {
      ...dbTaskType,
      id: taskType.id || generateUniqueId('type'),
      user_id: taskType.user_id || 'local-user',
      name: taskType.name || 'Untitled Type',
      created_at: taskType.created_at || new Date().toISOString(),
    };

    if (useSupabase) {
      try {
        const user = await getCurrentUser();
        
        if (!user) {
          logger.error("No authenticated user found for addTaskType");
          throw new Error("Not authenticated");
        }
        
        const typeWithUserId: TaskTypeInsert = {
          ...typeToSave,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from("task_types")
          .insert([typeWithUserId])
          .select();

        if (error) {
          logger.error("Error adding task type to Supabase:", error);
          throw error;
        }

        const localTypes = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
        const newTaskType = { ...data[0], completedColor: completedColor || 'green' } as TaskType;
        saveLocalData(TASK_TYPES_KEY, [...localTypes, newTaskType]);

        if (completedColor) {
          const completedColors = getLocalData<Record<string, string>>('task_type_completed_colors', {});
          completedColors[data[0].id] = completedColor;
          saveLocalData('task_type_completed_colors', completedColors);
        }

        return newTaskType;
      } catch (error: unknown) {
        logger.error("Error adding task type to Supabase:", (error as Error).message);
        throw error;
      }
    } else {
      const types = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
      const newTaskType = { ...typeToSave, completedColor: completedColor || 'green' } as TaskType;
      const updatedTypes = [...types, newTaskType];
      saveLocalData(TASK_TYPES_KEY, updatedTypes);
      return newTaskType;
    }
  } catch (error: unknown) {
    logger.error("Error in addTaskType:", error);
    return null;
  }
};

export const updateTaskType = async (
  typeId: string,
  updatedType: Partial<TaskTypeUpdate>,
  useSupabase = false
): Promise<TaskType> => {
  const { completedColor, ...dbUpdate } = updatedType as Partial<TaskTypeUpdate> & { completedColor?: string };
  
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

      const localTypes = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
      const updatedTypes = localTypes.map((type) =>
        type.id === typeId ? { ...type, ...data[0], completedColor } as TaskType : type
      );
      saveLocalData(TASK_TYPES_KEY, updatedTypes);

      const completedColors = getLocalData<Record<string, string>>('task_type_completed_colors', {});
      if (completedColor !== undefined) {
        completedColors[typeId] = completedColor;
        saveLocalData('task_type_completed_colors', completedColors);
      }

      return { ...data[0], completedColor } as TaskType;
    } catch (error: unknown) {
      logger.error("Error updating task type in Supabase:", (error as Error).message);
      throw error;
    }
  } else {
    const types = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
    const updatedTypes = types.map((type) =>
      type.id === typeId ? { ...type, ...typeToUpdate, completedColor } as TaskType : type
    );
    saveLocalData(TASK_TYPES_KEY, updatedTypes);
    
    const updatedTaskType = updatedTypes.find(t => t.id === typeId);
    return updatedTaskType || { id: typeId, ...typeToUpdate, completedColor } as TaskType;
  }
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
    } catch (error: unknown) {
      logger.error("Error deleting task type from Supabase:", (error as Error).message);
      throw error;
    }
  } else {
    const types = getLocalData<TaskType[]>(TASK_TYPES_KEY, []);
    const updatedTypes = types.filter((type) => type.id !== typeId);
    saveLocalData(TASK_TYPES_KEY, updatedTypes);
  }

  return true;
};