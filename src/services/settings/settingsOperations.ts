import type { AppSettings } from '../../types/database';
import { getLocalData, saveLocalData } from "../../utils/storageHelpers";
import { STORAGE_KEYS } from '../../types/database';

const SETTINGS_KEY = STORAGE_KEYS.SETTINGS;

export const getSettings = (): AppSettings => {
  return getLocalData<AppSettings>(SETTINGS_KEY, { title: "UCR" });
};

export const updateSettings = (settings: AppSettings): AppSettings => {
  saveLocalData(SETTINGS_KEY, settings);
  return settings;
};