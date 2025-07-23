import type {
  Class,
  ClassInsert,
  ClassUpdate,
  ClassWithRelations,
  ClassFile,
  ClassFileInsert,
  ClassSyllabus,
  ClassSyllabusInsert
} from '../../types/database';
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../authService";
import { logger } from "../../utils/logger";
import { getLocalData, saveLocalData } from "../../utils/storageHelpers";
import { generateUniqueId } from "../../utils/idHelpers";
import { STORAGE_KEYS } from '../../types/database';

const CLASSES_KEY = STORAGE_KEYS.CLASSES;

export const getClasses = async (userId?: string, useSupabase = false): Promise<ClassWithRelations[]> => {
  logger.debug('[getClasses] Entered. userId:', userId, '(type:', typeof userId + ')', 'useSupabase:', useSupabase);
  
  if (useSupabase) {
    if (!userId) {
      logger.warn('[getClasses] No userId provided for Supabase query, falling back to local data');
      return getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    }
    
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*, class_syllabi(*), class_files(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching classes from Supabase:", error);
        return getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
      }
      
      logger.debug(`Retrieved ${data?.length || 0} classes from Supabase for user ${userId}`);
      return data.map(cls => {
        const { istaskclass, class_syllabi, class_files, ...cleanCls } = cls;
        return {
          ...cleanCls,
          syllabus: class_syllabi && class_syllabi.length > 0 ? class_syllabi[0] : null,
          files: class_files || [],
          isTaskClass: istaskclass
        } as ClassWithRelations;
      });
    } catch (error: unknown) {
      logger.error("Error in getClasses (Supabase path):", error);
      return getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    }
  }
  
  return getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
};

export const addClass = async (
  classObj: Partial<ClassInsert> & { files?: ClassFile[]; syllabus?: ClassSyllabus | null }, 
  useSupabase = false
): Promise<ClassWithRelations> => {
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
      const user = await getCurrentUser();
      
      if (!user) {
        logger.error("No authenticated user found for addClass");
        throw new Error("Not authenticated");
      }
      
      const classWithUserId: ClassInsert = {
        ...classToSave,
        user_id: user.id,
      };
      
      const { isTaskClass, ...classWithoutIsTaskClass } = classWithUserId as ClassInsert & { isTaskClass?: boolean };
      const classForSupabase = {
        ...classWithoutIsTaskClass,
        istaskclass: isTaskClass || false
      };
      
      const { data, error } = await supabase
        .from("classes")
        .insert([classForSupabase])
        .select();

      if (error) throw error;

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
            logger.error("Error storing file metadata:", fileDbError);
          } else if (fileDbData) {
            savedFiles.push(fileDbData[0]);
          }
        }
      }
      
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
          logger.error("Error storing syllabus metadata:", syllabusDbError);
        } else if (syllabusDbData) {
          savedSyllabus = syllabusDbData[0];
        }
      }
      
      const { istaskclass, ...dbData } = data[0];
      const fullClassData: ClassWithRelations = {
        ...dbData,
        files: savedFiles,
        syllabus: savedSyllabus,
        isTaskClass: istaskclass
      };

      const localClasses = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
      saveLocalData(CLASSES_KEY, [...localClasses, fullClassData]);

      return fullClassData;
    } catch (error: unknown) {
      logger.error("Error adding class to Supabase:", (error as Error).message);
      throw error;
    }
  } else {
    const classWithFileData: ClassWithRelations = {
      id: classToSave.id as string,
      user_id: classToSave.user_id,
      name: classToSave.name,
      created_at: classToSave.created_at as string,
      updated_at: classToSave.updated_at,
      files: files || [],
      syllabus: syllabus || null,
      isTaskClass: (classObj as ClassInsert & { isTaskClass?: boolean }).isTaskClass || false
    };
    
    const classes = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    const updatedClasses = [...classes, classWithFileData];
    saveLocalData(CLASSES_KEY, updatedClasses);
    
    return classWithFileData;
  }
};

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
        logger.error(`Error updating class in Supabase:`, error.message);
        if (error.message.includes("column")) {
          logger.error("This might be a schema mismatch. Check the columns in your 'classes' table.");
          logger.error("Data sent:", updatedClass);
        }
        throw error;
      }

      const { data: latestFiles } = await supabase
        .from("class_files")
        .select("*")
        .eq("class_id", classId);
        
      if (latestFiles) {
        const fullClassData: ClassWithRelations = {
          ...data[0],
          files: latestFiles,
          syllabus: null,
          isTaskClass: data[0].istaskclass || false
        };

        const localClasses = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
        const updatedClasses = localClasses.map((cls) =>
          cls.id === classId ? fullClassData : cls
        );
        saveLocalData(CLASSES_KEY, updatedClasses);

        return fullClassData;
      }
      
      return {
        ...data[0],
        files: [],
        syllabus: null,
        isTaskClass: data[0].istaskclass || false
      };
    } catch (error: unknown) {
      logger.error("Error updating class in Supabase:", (error as Error).message);
      throw error;
    }
  } else {
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
      const { data: existingClass, error: fetchError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .single();
        
      if (fetchError) {
        logger.error("Error fetching class for deletion:", fetchError);
      }
      
      const { data: classFiles, error: filesError } = await supabase
        .from("class_files")
        .select("path")
        .eq("class_id", classId);
        
      if (filesError) {
        logger.error("Error fetching class files for deletion:", filesError);
      }
      
      const { data: classSyllabus, error: syllabusError } = await supabase
        .from("class_syllabi")
        .select("path")
        .eq("class_id", classId)
        .single();
        
      if (syllabusError && syllabusError.code !== 'PGRST116') {
        logger.error("Error fetching class syllabus for deletion:", syllabusError);
      }
      
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
          logger.error("Error deleting files from storage:", storageError);
        }
      }
      
      if (classFiles && classFiles.length > 0) {
        const { error: deleteFilesError } = await supabase
          .from("class_files")
          .delete()
          .eq("class_id", classId);
          
        if (deleteFilesError) {
          logger.error("Error deleting files from database:", deleteFilesError);
        }
      }
      
      if (classSyllabus) {
        const { error: deleteSyllabusError } = await supabase
          .from("class_syllabi")
          .delete()
          .eq("class_id", classId);
          
        if (deleteSyllabusError) {
          logger.error("Error deleting syllabus from database:", deleteSyllabusError);
        }
      }
      
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      const localClasses = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
      const updatedClasses = localClasses.filter((cls) => cls.id !== classId);
      saveLocalData(CLASSES_KEY, updatedClasses);

      return true;
    } catch (error: unknown) {
      logger.error("Error deleting class from Supabase:", (error as Error).message);
      throw error;
    }
  } else {
    const classes = getLocalData<ClassWithRelations[]>(CLASSES_KEY, []);
    const updatedClasses = classes.filter((cls) => cls.id !== classId);
    saveLocalData(CLASSES_KEY, updatedClasses);
  }

  return true;
};