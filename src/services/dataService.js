import { getCurrentUser } from "./authService";
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
      // Get current user ID - FIXED: correctly get user object
      const user = await getCurrentUser();

      if (!user) {
        console.error("No authenticated user found for getTasks");
        return getLocalData(TASKS_KEY);
      }

      // Get tasks filtered by user_id
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks from Supabase:", error);
        return getLocalData(TASKS_KEY);
      }

      // Update local storage with the fetched tasks
      saveLocalData(TASKS_KEY, data || []);

      // Add debugging to see what's happening
      console.log(`Retrieved ${data?.length || 0} tasks from Supabase`);

      return data;
    } catch (error) {
      console.error("Error in getTasks:", error);
      return getLocalData(TASKS_KEY);
    }
  }

  return getLocalData(TASKS_KEY);
};

export const addTask = async (task, useSupabase = false) => {
  try {
    if (!task.title || !task.dueDate) {
      console.error("Task missing required fields:", task);
      return null;
    }

    // Create a consistent task ID
    const taskToSave = {
      ...task,
      id:
        task.id ||
        `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      created_at: new Date().toISOString(),
    };

    console.log(`Adding task with useSupabase=${useSupabase}`, taskToSave);

    if (useSupabase) {
      try {
        // Get current user ID - FIXED: correctly get user object
        const user = await getCurrentUser();
        console.log("Current user from getCurrentUser:", user);

        if (!user) {
          console.error("No authenticated user found");
          throw new Error("Not authenticated");
        }

        // Let's also check the Supabase auth state directly
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Supabase session:", session);

        if (!session) {
          console.error("No active Supabase session found");
          throw new Error("Not authenticated via Supabase session");
        }

        // Add user_id to the task data - THIS IS CRUCIAL
        const taskWithUserId = {
          ...taskToSave,
          user_id: user.id,
        };

        console.log("Adding task to Supabase:", taskWithUserId);

        // First, add to Supabase
        const result = await supabase
          .from("tasks")
          .insert([taskWithUserId])
          .select("*");

        console.log("Full Supabase insert result:", result);

        const { data, error } = result;

        if (error) {
          console.error("Supabase task insertion error:", error);
          // Fall back to local storage
          const tasks = getLocalData(TASKS_KEY);
          const updatedTasks = [...tasks, taskToSave];
          saveLocalData(TASKS_KEY, updatedTasks);

          // Add task to local state and delay the calendar refresh
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("calendar-update"));
          }, 500);

          return taskToSave;
        }

        console.log("Task added successfully to Supabase:", data);

        // Save to local storage for immediate use
        const tasks = getLocalData(TASKS_KEY);
        const updatedTasks = [...tasks, data[0]];
        saveLocalData(TASKS_KEY, updatedTasks);

        // Delay the calendar refresh to ensure everything is saved
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("calendar-update"));
        }, 500);

        return data[0];
      } catch (error) {
        console.error("Error adding task to Supabase:", error);
        // Fall back to local storage
        const tasks = getLocalData(TASKS_KEY);
        const updatedTasks = [...tasks, taskToSave];
        saveLocalData(TASKS_KEY, updatedTasks);

        // Delay the calendar refresh
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("calendar-update"));
        }, 500);

        return taskToSave;
      }
    } else {
      // Only for non-Supabase storage
      const tasks = getLocalData(TASKS_KEY);
      const updatedTasks = [...tasks, taskToSave];
      saveLocalData(TASKS_KEY, updatedTasks);

      // Delay the calendar refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("calendar-update"));
      }, 500);

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

export const getClasses = async (useSupabase = false) => {
  if (useSupabase) {
    try {
      // Get current user ID
      const user = await getCurrentUser();

      if (!user) {
        console.error("No authenticated user found for getClasses");
        return getLocalData(CLASSES_KEY);
      }

      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      // Refresh signed URLs for all files
      if (data) {
        for (let cls of data) {
          // Make sure files array is initialized
          if (!cls.files) {
            cls.files = [];
          }
          
          // Refresh syllabus URL if exists
          if (cls.syllabus && cls.syllabus.path) {
            const { data: syllabusUrlData, error: syllabusUrlError } = await supabase.storage
              .from("class-materials")
              .createSignedUrl(cls.syllabus.path, 31536000);
            
            if (!syllabusUrlError && syllabusUrlData) {
              cls.syllabus.url = syllabusUrlData.signedUrl;
            }
          }

          // Refresh URLs for all class files if they exist
          if (cls.files && cls.files.length > 0) {
            for (let file of cls.files) {
              if (file.path) {
                const { data: fileUrlData, error: fileUrlError } = await supabase.storage
                  .from("class-materials")
                  .createSignedUrl(file.path, 31536000);
                
                if (!fileUrlError && fileUrlData) {
                  file.url = fileUrlData.signedUrl;
                }
              }
            }
          }
        }
      }

      // Save updated classes with refreshed URLs to local storage
      saveLocalData(CLASSES_KEY, data || []);

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
    files: classObj.files || [],
  };

  if (useSupabase) {
    try {
      // Get current user ID
      const user = await getCurrentUser();
      
      if (!user) {
        console.error("No authenticated user found for addClass");
        throw new Error("Not authenticated");
      }
      
      // Add user_id to the class data
      const classWithUserId = {
        ...classToSave,
        user_id: user.id,
      };
      
      const { data, error } = await supabase
        .from("classes")
        .insert([classWithUserId])
        .select();

      if (error) throw error;

      // Also update local cache with the data returned from Supabase
      const localClasses = getLocalData(CLASSES_KEY);
      saveLocalData(CLASSES_KEY, [...localClasses, data[0]]);

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

export const updateClass = async (
  classId,
  updatedClass,
  useSupabase = false
) => {
  const classToUpdate = {
    ...updatedClass,
    updated_at: new Date().toISOString(),
  };

  if (useSupabase) {
    try {
      // Get current user ID
      const user = await getCurrentUser();
      
      if (!user) {
        console.error("No authenticated user found for updateClass");
        throw new Error("Not authenticated");
      }
      
      // Ensure user_id is included in the update
      const classWithUserId = {
        ...classToUpdate,
        user_id: user.id,
      };
      
      const { data, error } = await supabase
        .from("classes")
        .update(classWithUserId)
        .eq("id", classId)
        .select();

      if (error) throw error;

      // Also update local cache with the data returned from Supabase
      const localClasses = getLocalData(CLASSES_KEY);
      const updatedClasses = localClasses.map((cls) =>
        cls.id === classId ? { ...cls, ...data[0] } : cls
      );
      saveLocalData(CLASSES_KEY, updatedClasses);

      return data[0];
    } catch (error) {
      console.error("Error updating class in Supabase:", error.message);
      // Fall back to local storage only
    }
  } else {
    const classes = getLocalData(CLASSES_KEY);
    const updatedClasses = classes.map((cls) =>
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
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      // Also update local cache
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
      console.error("Error fetching task types from Supabase:", error.message);
      return getLocalData(TASK_TYPES_KEY);
    }
  }

  return getLocalData(TASK_TYPES_KEY);
};

export const addTaskType = async (taskType, useSupabase = false) => {
  const typeToSave = {
    ...taskType,
    id: taskType.id || Date.now().toString(),
    created_at: new Date().toISOString(),
  };

  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("task_types")
        .insert([typeToSave])
        .select();

      if (error) throw error;

      // Also update local cache
      const localTypes = getLocalData(TASK_TYPES_KEY);
      saveLocalData(TASK_TYPES_KEY, [...localTypes, typeToSave]);

      return data[0];
    } catch (error) {
      console.error("Error adding task type to Supabase:", error.message);
    }
  } else {
    const types = getLocalData(TASK_TYPES_KEY);
    const updatedTypes = [...types, typeToSave];
    saveLocalData(TASK_TYPES_KEY, updatedTypes);
  }

  return typeToSave;
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

// Initialize default data if it doesn't exist
export const initializeDefaultData = () => {
  if (!localStorage.getItem(CLASSES_KEY)) {
    const defaultClasses = [
      { id: "cs179g", name: "CS 179G", syllabus: null, files: [] },
      { id: "cs147", name: "CS 147", syllabus: null, files: [] },
      { id: "ee100a", name: "EE 100A", syllabus: null, files: [] },
      { id: "soc151", name: "SOC 151", syllabus: null, files: [] },
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
    saveLocalData(SETTINGS_KEY, { title: "UCR" });
  }
};
