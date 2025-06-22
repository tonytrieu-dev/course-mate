import { supabase } from './supabaseClient';
import {
    getLocalData, saveLocalData, 
    getTasks, getClasses, getTaskTypes
} from './dataService';

const LAST_SYNC_KEY = 'last_sync_timestamp';

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
