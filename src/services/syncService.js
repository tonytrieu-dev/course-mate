import { supabase } from './supabaseClient';
import {
    getLocalData, saveLocalData, 
    getTasks, getClasses, getTaskTypes
} from './dataService';

const LAST_SYNC_KEY = 'last_sync_timestamp';
/*
const getLastSyncTimestamp = () => {
    const timestamp = localStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? new Date(timestamp) : null;
}
*/

const setLastSyncTimestamp = () => {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}

export const checkIfDataExists = async (userId) => {
    try {
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (tasksError) throw tasksError;

        return tasks && tasks.length > 0;
    } catch (error) {
        console.error('There was an error checking if any data exists: ', error);
        return false;
    }
};

// Upload all local data to Supabase (for first-time sync)
export const uploadLocalDataToSupabase = async (userId) => {
    try {
        const tasks = await getTasks(false);
        const classes = await getClasses(false);
        const taskTypes = await getTaskTypes(false);
        
        const tasksWithUserId = tasks.map(task => ({
            ...task,
            user_id: userId,
            created_at: task.created_at || new Date().toISOString(),
        }));

        const classesWithUserId = classes.map(cls => ({
            ...cls,
            user_id: userId,
            created_at: cls.created_at || new Date().toISOString(),
            files: cls.files || [], // Ensure files array exists
        }));

        const taskTypesWithUserId = taskTypes.map(type => ({
            ...type,
            user_id: userId,
            created_at: type.created_at || new Date().toISOString(),
        }));

        // Now upload the data in batches
        if (classesWithUserId.length > 0) {
            const { error: classesError } = await supabase
                .from('classes')
                .upsert(classesWithUserId)

            if (classesError) throw classesError;
        }

        if (taskTypesWithUserId.length > 0) {
            const { error: typesError } = await supabase
                .from('task_types')
                .upsert(taskTypesWithUserId)

            if (typesError) throw typesError;
        }

        if (tasksWithUserId.length > 0) {
            const { error: tasksError } = await supabase
                .from('tasks')
                .upsert(tasksWithUserId)

            if (tasksError) throw tasksError;
        }

        // Update the sync timestamp
        setLastSyncTimestamp();

        return true;
    } catch (error) {
        console.error('Error uploading local data to Supabase: ', error.message);
        return false;
    }
};

export const downloadDataFromSupabase = async (userId) => {
    try {
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId);

        if (tasksError) throw tasksError;

        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .select('*')
            .eq('user_id', userId);

        if (classesError) throw classesError;

        const { data: taskTypes, error: typesError } = await supabase
            .from('task_types')
            .select('*')
            .eq('user_id', userId);

        if (typesError) throw typesError;

        // Get all files from class_files table
        const { data: classFiles, error: filesError } = await supabase
            .from('class_files')
            .select('*')
            .order('uploaded_at', { ascending: false });
            
        if (filesError) {
            console.error("Error fetching class files:", filesError);
            // Continue anyway, as this might be a new table
        }
            
        // Get all syllabi from class_syllabi table
        const { data: classSyllabi, error: syllabiError } = await supabase
            .from('class_syllabi')
            .select('*');
            
        if (syllabiError) {
            console.error("Error fetching class syllabi:", syllabiError);
            // Continue anyway, as this might be a new table
        }

        // Assign files and syllabi to their respective classes
        if (classes) {
            for (let cls of classes) {
                // Initialize files array if not exists
                if (!cls.files) {
                    cls.files = [];
                }
                
                // Assign class files
                if (classFiles) {
                    cls.files = classFiles.filter(file => file.class_id === cls.id);
                }
                
                // Assign class syllabus
                if (classSyllabi) {
                    const syllabus = classSyllabi.find(s => s.class_id === cls.id);
                    cls.syllabus = syllabus || null;
                }
                
                // Refresh signed URLs for files and syllabus
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

        localStorage.setItem('calendar_tasks', JSON.stringify(tasks || []));
        localStorage.setItem('calendar_classes', JSON.stringify(classes || []));
        localStorage.setItem('calendar_task_types', JSON.stringify(taskTypes || []));

        // Update the sync timestamp
        setLastSyncTimestamp();

        return true;
    } catch (error) {
        console.error('Error downloading data from Supabase: ', error.message);
        return false;
    }
};

export const syncData = async (userId) => {
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
        console.error('Error during sync: ', error.message);
        return false;
    }
};
