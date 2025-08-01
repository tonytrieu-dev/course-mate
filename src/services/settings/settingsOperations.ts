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