import type { AppSettings } from '../../types/database';
import { getLocalData, saveLocalData } from "../../utils/storageHelpers";
import { STORAGE_KEYS } from '../../types/database';

const SETTINGS_KEY = STORAGE_KEYS.SETTINGS;

export const getSettings = (): AppSettings => {
  const defaultSettings: AppSettings = { 
    title: "UCR", 
    classNamingStyle: 'technical' 
  };
  
  const storedSettings = getLocalData<AppSettings>(SETTINGS_KEY, defaultSettings);
  
  // Ensure all required fields are present (for existing users who might not have classNamingStyle)
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