import { supabase } from "./supabaseClient";

const TASKS_KEY = "calendar_tasks";
const CLASSES_KEY = "calendar_classes";
const TASK_TYPES_KEY = "calendar_task_types";
const SETTINGS_KEY = "calendar_settings";

const getLocalData = (key, defaultValue = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getTasks = async (useSupabase = false) => {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching tasks from Supabase:", error.message);
      return getLocalData(TASKS_KEY);
    }
  }

  return getLocalData(TASKS_KEY);
};

export const refreshCalendar = () => {
  // Dispatch a custom event that the Calendar component can listen for
  window.dispatchEvent(new CustomEvent('calendar-update'));
  console.log("Calendar refresh event dispatched");
};

export const addTask = async (task, useSupabase = false) => {
  // Add debugging
  console.log("Adding task:", task);
  
  try {
    // Validate the task has required fields
    if (!task.title || !task.dueDate) {
      console.error("Task missing required fields:", task);
      return null;
    }
    
    // Ensure dueDate is a valid date
    const dueDate = new Date(task.dueDate);
    if (isNaN(dueDate.getTime())) {
      console.error("Invalid due date:", task.dueDate);
      return null;
    }
    
    console.log("Task due date:", dueDate.toLocaleDateString());
    
    const taskToSave = {
      ...task,
      id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };

    if (useSupabase) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .insert([taskToSave])
          .select("*");

        if (error) throw error;

        const localTasks = getLocalData(TASKS_KEY);
        const updatedTasks = [...localTasks, taskToSave];
        saveLocalData(TASKS_KEY, updatedTasks);
        console.log("Task saved to Supabase:", data[0]);
        
        // Refresh calendar view
        refreshCalendar();
        
        return data[0];
      } catch (error) {
        console.error("Error adding task to Supabase:", error.message);
        throw error;
      }
    } else {
      const tasks = getLocalData(TASKS_KEY);
      const updatedTasks = [...tasks, taskToSave];
      saveLocalData(TASKS_KEY, updatedTasks);
      console.log("Task saved locally. Total tasks:", updatedTasks.length);
      
      // Refresh calendar view
      refreshCalendar();
      return taskToSave;
    }
  } catch (error) {
    console.error("Error in addTask:", error);
    return null;
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

      const localTasks = getLocalData(TASKS_KEY);
      const updatedTasks = localTasks.filter((task) => task.id !== taskId);
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



export const getClasses = async (useSupabase = false) => {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error("Error fetching classes from Supabase:", error.message);
      return getLocalData(CLASSES_KEY);
    }
  }

  return getLocalData(CLASSES_KEY);
};

export const addClass = async (classObj, useSupabase = false) => {
  const classToSave = {
    ...classObj,
    id: classObj.id || Date.now().toString(),
    created_at: new Date().toISOString(),
  };

  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("classes")
        .insert([classToSave])
        .select();

      if (error) throw error;

      // Also update local cache
      const localClasses = getLocalData(CLASSES_KEY);
      saveLocalData(CLASSES_KEY, [...localClasses, classToSave]);

      return data[0];
    } catch (error) {
      console.error("Error adding class to Supabase:", error.message);
    }
  } else {
    const classes = getLocalData(CLASSES_KEY);
    const updatedClasses = [...classes, classToSave];
    saveLocalData(CLASSES_KEY, updatedClasses);
  }

  return classToSave;
};

export const updateClass = async (classId, updatedClass, useSupabase = false) => {
    const classToUpdate = {
      ...updatedClass,
      updated_at: new Date().toISOString(),
    };
    
    if (useSupabase) {
      try {
        const { data, error } = await supabase
          .from('classes')
          .update(classToUpdate)
          .eq('id', classId)
          .select();
          
        if (error) throw error;
        
        // Also update local cache
        const localClasses = getLocalData(CLASSES_KEY);
        const updatedClasses = localClasses.map(cls => 
          cls.id === classId ? { ...cls, ...classToUpdate } : cls
        );
        saveLocalData(CLASSES_KEY, updatedClasses);
        
        return data[0];
      } catch (error) {
        console.error('Error updating class in Supabase:', error.message);
        // Fall back to local storage only
      }
    } else {
        const classes = getLocalData(CLASSES_KEY);
        const updatedClasses = classes.map(cls => 
          cls.id === classId ? { ...cls, ...classToUpdate } : cls
        );
        saveLocalData(CLASSES_KEY, updatedClasses);
    }
    
    return { id: classId, ...classToUpdate };
};

export const deleteClass = async (classId, useSupabase = false) => {
    if (useSupabase) {
      try {
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('id', classId);
          
        if (error) throw error;
        
        // Also update local cache
        const localClasses = getLocalData(CLASSES_KEY);
        const updatedClasses = localClasses.filter(cls => cls.id !== classId);
        saveLocalData(CLASSES_KEY, updatedClasses);
        
        return true;
      } catch (error) {
        console.error('Error deleting class from Supabase:', error.message);
      }
    } else {
        const classes = getLocalData(CLASSES_KEY);
        const updatedClasses = classes.filter(cls => cls.id !== classId);
        saveLocalData(CLASSES_KEY, updatedClasses);
    }
    
    return true;
};



export const getTaskTypes = async (useSupabase = false) => {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching task types from Supabase:', error.message);
      return getLocalData(TASK_TYPES_KEY);
    }
  }

  return getLocalData(TASK_TYPES_KEY);
};

export const addTaskType = async (taskType, useSupabase = false) => {
    const typeToSave = {
        ...taskType,
        id: taskType.id || Date.now().toString(),
        'created_at': new Date().toISOString(),
    };

    if (useSupabase) {
        try {
            const { data, error } = await supabase
                .from('task_types')
                .insert([typeToSave])
                .select();

            if (error) throw error;

            // Also update local cache
            const localTypes = getLocalData(TASK_TYPES_KEY);
            saveLocalData(TASK_TYPES_KEY, [...localTypes, typeToSave]);

            return data[0];
        } catch (error) {
            console.error('Error adding task type to Supabase:', error.message);
        }
    } else {
        const types = getLocalData(TASK_TYPES_KEY);
        const updatedTypes = [...types, typeToSave];
        saveLocalData(TASK_TYPES_KEY, updatedTypes);
    }

    return typeToSave;
};

export const updateTaskType = async (typeId, updatedType, useSupabase = false) => {
    const typeToUpdate = {
      ...updatedType,
      updated_at: new Date().toISOString(),
    };
    
    if (useSupabase) {
      try {
        const { data, error } = await supabase
          .from('task_types')
          .update(typeToUpdate)
          .eq('id', typeId)
          .select();
          
        if (error) throw error;
        
        const localTypes = getLocalData(TASK_TYPES_KEY);
        const updatedTypes = localTypes.map(type => 
          type.id === typeId ? { ...type, ...typeToUpdate } : type
        );
        saveLocalData(TASK_TYPES_KEY, updatedTypes);
        
        return data[0];
      } catch (error) {
        console.error('Error updating task type in Supabase:', error.message);
      }
    } else {
        const types = getLocalData(TASK_TYPES_KEY);
        const updatedTypes = types.map(type => 
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
          .from('task_types')
          .delete()
          .eq('id', typeId);
          
        if (error) throw error;
        
        const localTypes = getLocalData(TASK_TYPES_KEY);
        const updatedTypes = localTypes.filter(type => type.id !== typeId);
        saveLocalData(TASK_TYPES_KEY, updatedTypes);
        
        return true;
      } catch (error) {
        console.error('Error deleting task type from Supabase:', error.message);
      }
    } else {
        const types = getLocalData(TASK_TYPES_KEY);
        const updatedTypes = types.filter(type => type.id !== typeId);
        saveLocalData(TASK_TYPES_KEY, updatedTypes);
    }
    
    return true;
};



export const getSettings = () => {
  return getLocalData(SETTINGS_KEY, { title: 'UCR' });
};

export const updateSettings = (settings) => {
    saveLocalData(SETTINGS_KEY, settings);
    return settings;
  };
  
  // Initialize default data if it doesn't exist
  export const initializeDefaultData = () => {
    if (!localStorage.getItem(CLASSES_KEY)) {
      const defaultClasses = [
        { id: "cs179g", name: "CS 179G", syllabus: null },
        { id: "cs147", name: "CS 147", syllabus: null },
        { id: "ee100a", name: "EE 100A", syllabus: null },
        { id: "soc151", name: "SOC 151", syllabus: null },
      ];
      saveLocalData(CLASSES_KEY, defaultClasses);
    }
    
    // Default task types
    if (!localStorage.getItem(TASK_TYPES_KEY)) {
      const defaultTaskTypes = [
        { id: "homework", name: "Homework" },
        { id: "final", name: "Final" },
        { id: "quiz", name: "Quiz" },
        { id: "lab", name: "Lab Report" },
        { id: "project", name: "Project" },
      ];
      saveLocalData(TASK_TYPES_KEY, defaultTaskTypes);
    }
    
    // Default tasks (empty array)
    if (!localStorage.getItem(TASKS_KEY)) {
      saveLocalData(TASKS_KEY, []);
    }
    
    // Default settings
    if (!localStorage.getItem(SETTINGS_KEY)) {
      saveLocalData(SETTINGS_KEY, { title: 'UCR' });
    }
};
