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
    const taskToSave = {
      ...task,
      id: task.id || Date.now().toString(),
      created_at: new Date().toISOString(),
    };

    if (useSupabase) {
      try {
        // Get current user ID
        const user = await getCurrentUser();
        
        if (!user) {
          console.error("No authenticated user found for addTask");
          throw new Error("Not authenticated");
        }
        
        // Add user_id to the task data
        const taskWithUserId = {
          ...taskToSave,
          user_id: user.id,
        };

        const { data, error } = await supabase
          .from("tasks")
          .insert([taskWithUserId])
          .select();

        if (error) {
          console.error("Supabase task insertion error:", error);
          throw error;
        }

        console.log("Task added successfully to Supabase:", data);

        // Save to local storage for immediate use
        const tasks = getLocalData(TASKS_KEY);
        const updatedTasks = [...tasks, data[0]];
        saveLocalData(TASKS_KEY, updatedTasks);

        return data[0];
      } catch (error) {
        console.error("Error adding task to Supabase:", error);
        throw error;
      }
    } else {
      // Only for non-Supabase storage
      const tasks = getLocalData(TASKS_KEY);
      const updatedTasks = [...tasks, taskToSave];
      saveLocalData(TASKS_KEY, updatedTasks);
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

      // Get all classes for this user
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (classesError) {
        console.error("Error fetching classes:", classesError);
        return getLocalData(CLASSES_KEY);
      }

      // Get all files from class_files table for this user
      const { data: classFiles, error: filesError } = await supabase
        .from("class_files")
        .select("*")
        .eq("owner", user.id)
        .order("uploaded_at", { ascending: false });
            
      if (filesError) {
        console.error("Error fetching class files:", filesError);
        // Continue anyway, treating as if there are no files
      }
            
      // Get all syllabi from class_syllabi table for this user
      const { data: classSyllabi, error: syllabiError } = await supabase
        .from("class_syllabi")
        .select("*")
        .eq("owner", user.id);
            
      if (syllabiError) {
        console.error("Error fetching class syllabi:", syllabiError);
        // Continue anyway, treating as if there are no syllabi
      }

      // Assign files and syllabi to their respective classes
      if (classesData) {
        for (let cls of classesData) {
          // Initialize files array if not exists
          if (!cls.files) {
            cls.files = [];
          }
          
          // Assign class files from class_files table
          if (classFiles) {
            cls.files = classFiles.filter(file => file.class_id === cls.id);
          }
          
          // Assign class syllabus from class_syllabi table
          if (classSyllabi) {
            const syllabus = classSyllabi.find(s => s.class_id === cls.id);
            cls.syllabus = syllabus || null;
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
      saveLocalData(CLASSES_KEY, classesData || []);

      return classesData;
    } catch (error) {
      console.error("Error fetching classes from Supabase:", error.message);
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
    id: cleanClassObj.id || Date.now().toString(),
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
      
      // Combine the data for local storage
      const fullClassData = {
        ...data[0],
        files: savedFiles,
        syllabus: savedSyllabus
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
  // Extract files and syllabus from the updatedClass to handle them separately
  const { files, syllabus, ...cleanClassData } = updatedClass;
  
  const classToUpdate = {
    ...cleanClassData,
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
      
      // Update the class without files and syllabus
      const { data, error } = await supabase
        .from("classes")
        .update(classWithUserId)
        .eq("id", classId)
        .select();

      if (error) throw error;
      
      let updatedFiles = files || [];
      let updatedSyllabus = syllabus;
      
      // If we have files, make sure they're properly stored in class_files
      if (files && files.length > 0) {
        // Get existing files to compare
        const { data: existingFiles } = await supabase
          .from("class_files")
          .select("*")
          .eq("class_id", classId);
          
        const existingFilesPaths = existingFiles ? existingFiles.map(f => f.path) : [];
        
        // Check for new files to add
        for (const file of files) {
          // If this file doesn't exist in the database yet, add it
          if (file.path && !existingFilesPaths.includes(file.path)) {
            const fileData = {
              ...file,
              class_id: classId,
              owner: user.id,
              uploaded_at: file.uploaded_at || new Date().toISOString()
            };
            
            await supabase
              .from("class_files")
              .insert([fileData]);
          }
        }
        
        // No need to handle file deletions here as that's handled by handleDeleteFile
      }
      
      // If we have a syllabus, make sure it's properly stored in class_syllabi
      if (syllabus) {
        // Check if there's already a syllabus for this class
        const { data: existingSyllabus } = await supabase
          .from("class_syllabi")
          .select("*")
          .eq("class_id", classId)
          .single();
          
        if (!existingSyllabus || existingSyllabus.path !== syllabus.path) {
          // If no syllabus exists or it's different, update it
          if (existingSyllabus) {
            // Delete existing syllabus
            await supabase
              .from("class_syllabi")
              .delete()
              .eq("class_id", classId);
          }
          
          // Add new syllabus
          const syllabusData = {
            ...syllabus,
            class_id: classId,
            owner: user.id,
            uploaded_at: syllabus.uploaded_at || new Date().toISOString()
          };
          
          const { data: newSyllabus } = await supabase
            .from("class_syllabi")
            .insert([syllabusData])
            .select();
            
          if (newSyllabus && newSyllabus.length > 0) {
            updatedSyllabus = newSyllabus[0];
          }
        }
      } else if (syllabus === null) {
        // If syllabus is explicitly set to null, delete any existing syllabus
        await supabase
          .from("class_syllabi")
          .delete()
          .eq("class_id", classId);
      }
      
      // Get the latest files for this class
      const { data: latestFiles } = await supabase
        .from("class_files")
        .select("*")
        .eq("class_id", classId);
        
      if (latestFiles) {
        updatedFiles = latestFiles;
      }
      
      // Combine the data for local storage
      const fullClassData = {
        ...data[0],
        files: updatedFiles,
        syllabus: updatedSyllabus
      };

      // Update local cache with the complete data
      const localClasses = getLocalData(CLASSES_KEY);
      const updatedClasses = localClasses.map((cls) =>
        cls.id === classId ? fullClassData : cls
      );
      saveLocalData(CLASSES_KEY, updatedClasses);

      return fullClassData;
    } catch (error) {
      console.error("Error updating class in Supabase:", error.message);
      // Fall back to local storage only
    }
  } else {
    // For local storage, we keep the files and syllabus with the class
    const completeClassData = {
      ...classToUpdate,
      files: files || [],
      syllabus: syllabus
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
    ...classToUpdate,
    files: files || [],
    syllabus: syllabus
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
  try {
    const typeToSave = {
      ...taskType,
      id: taskType.id || Date.now().toString(),
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

// Initialize default data if it doesn't exist
export const initializeDefaultData = () => {
  if (!localStorage.getItem(CLASSES_KEY)) {
    const defaultClasses = [
      { id: "cs179g", name: "CS 179G", syllabus: null, files: [] },
      { id: "cs147", name: "CS 147", syllabus: null, files: [] },
      { id: "ee100a", name: "EE 100A", syllabus: null, files: [] },
      { id: "soc151", name: "SOC 151", syllabus: null, files: [] },
      { id: "canvas", name: "Canvas Imports", syllabus: null, files: [] },
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
      { id: "exam", name: "Exam" },
      { id: "assignment", name: "Assignment" },
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
