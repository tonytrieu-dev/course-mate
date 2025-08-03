import type { AppSettings } from '../../types/database';
import { getLocalData, saveLocalData } from "../../utils/storageHelpers";
import { STORAGE_KEYS } from '../../types/database';
import { supabase } from '../supabaseClient';

const SETTINGS_KEY = STORAGE_KEYS.SETTINGS;

// Default navigation order
const DEFAULT_NAV_ORDER = ['dashboard', 'calendar', 'tasks', 'grades'];

export const getDefaultSettings = (): AppSettings => ({
  title: "UCR", 
  classNamingStyle: 'technical',
  navigationOrder: DEFAULT_NAV_ORDER,
  selectedView: 'dashboard',
  titleColor: 'blue',
  classesHeaderColor: 'blue'
});

export const getSettings = (): AppSettings => {
  const defaultSettings = getDefaultSettings();
  const storedSettings = getLocalData<AppSettings>(SETTINGS_KEY, defaultSettings);
  
  // Ensure all required fields are present (for existing users who might not have new fields)
  const mergedSettings = {
    ...defaultSettings,
    ...storedSettings
  };
  
  return mergedSettings;
};

export const updateSettings = (settings: AppSettings): AppSettings => {
  saveLocalData(SETTINGS_KEY, settings);
  return settings;
};

/**
 * Enhanced settings service with Supabase sync capability
 */
export const getSettingsWithSync = async (userId?: string): Promise<AppSettings> => {
  const defaultSettings = getDefaultSettings();
  
  if (!userId) {
    // Not authenticated, use localStorage only
    return getSettings();
  }

  try {
    // Try to get settings from Supabase first
    const { data: supabaseSettings, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();

    if (!error && supabaseSettings?.settings) {
      // Merge Supabase settings with defaults and save to localStorage for offline access
      const mergedSettings = {
        ...defaultSettings,
        ...supabaseSettings.settings
      };
      saveLocalData(SETTINGS_KEY, mergedSettings);
      return mergedSettings;
    }
  } catch (error) {
    console.warn('Failed to load settings from Supabase, using localStorage:', error);
  }

  // Fallback to localStorage
  return getSettings();
};

export const updateSettingsWithSync = async (settings: AppSettings, userId?: string): Promise<AppSettings> => {
  // Always save to localStorage first for immediate UI update
  const updatedSettings = updateSettings(settings);
  
  if (!userId) {
    // Not authenticated, localStorage only
    return updatedSettings;
  }

  try {
    // First, try to update existing record
    const { data: existingData, error: selectError } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.warn('Error checking existing settings:', selectError);
      return updatedSettings;
    }

    if (existingData) {
      // Record exists, update it
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.warn('Failed to update settings in Supabase:', updateError);
      }
    } else {
      // No record exists, insert new one
      const { error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          settings: updatedSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.warn('Failed to insert settings into Supabase:', insertError);
      }
    }
  } catch (error) {
    console.warn('Error syncing settings to Supabase:', error);
    // Still return the local settings since local update succeeded
  }

  return updatedSettings;
};

/**
 * Sync navigation order specifically
 */
export const updateNavigationOrder = async (order: string[], userId?: string): Promise<void> => {
  const currentSettings = await getSettingsWithSync(userId);
  const updatedSettings = {
    ...currentSettings,
    navigationOrder: order
  };
  await updateSettingsWithSync(updatedSettings, userId);
};

/**
 * Sync selected view specifically
 */
export const updateSelectedView = async (view: 'dashboard' | 'tasks' | 'calendar' | 'grades', userId?: string): Promise<void> => {
  const currentSettings = await getSettingsWithSync(userId);
  const updatedSettings = {
    ...currentSettings,
    selectedView: view
  };
  await updateSettingsWithSync(updatedSettings, userId);
};

/**
 * Check if Canvas integration is properly configured
 */
export const isCanvasConfigured = (): boolean => {
  const canvasUrl = localStorage.getItem('canvas_calendar_url');
  return canvasUrl !== null && canvasUrl.trim() !== '';
};

/**
 * Check if study scheduler prerequisites are met
 */
export const isStudySchedulerReady = (user: any, classes: any[]): boolean => {
  // User must be logged in
  if (!user) return false;
  
  // Must have synced classes from Canvas
  if (!classes || classes.length === 0) return false;
  
  // Canvas URL should be configured (optional but recommended)
  const hasCanvasUrl = isCanvasConfigured();
  
  // For now, just require user + classes. Canvas URL is optional but helpful
  return true;
};