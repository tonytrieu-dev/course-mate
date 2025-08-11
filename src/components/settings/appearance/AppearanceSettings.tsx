import React, { useState, useEffect } from 'react';
import type { GeneralSettingsState } from '../types';
import { getSettingsWithSync, updateSelectedView } from '../../../services/settings/settingsOperations';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';

interface AppearanceSettingsProps {
  settings: GeneralSettingsState;
  onSettingChange: (key: string, value: any) => void;
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
  isDark: boolean;
  hasChanges: boolean;
  contextMode: 'light' | 'dark' | 'auto';
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  settings,
  onSettingChange,
  onThemeChange,
  isDark,
  hasChanges,
  contextMode
}) => {
  const { user } = useAuth();
  const [selectedView, setSelectedView] = useState<'dashboard' | 'tasks' | 'calendar' | 'grades'>('dashboard');
  const [viewLoading, setViewLoading] = useState(true);

  // Load current selectedView from settings
  useEffect(() => {
    const loadSelectedView = async () => {
      try {
        const appSettings = await getSettingsWithSync(user?.id);
        setSelectedView(appSettings.selectedView || 'dashboard');
      } catch (error) {
        logger.warn('Failed to load selected view', { error });
        setSelectedView('dashboard'); // fallback
      } finally {
        setViewLoading(false);
      }
    };

    loadSelectedView();
  }, [user?.id]);

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    // Only update local settings state for preview - actual theme application happens on save
    onSettingChange('theme', theme);
  };

  const handleViewChange = async (view: 'dashboard' | 'tasks' | 'calendar' | 'grades') => {
    try {
      setSelectedView(view);
      await updateSelectedView(view, user?.id);
    } catch (error) {
      logger.error('Failed to update selected view', { error });
      // Revert on error
      const appSettings = await getSettingsWithSync(user?.id);
      setSelectedView(appSettings.selectedView || 'dashboard');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">🎨 Appearance</h3>
      <div className="space-y-4">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Theme</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                settings.theme === 'light'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                settings.theme === 'dark'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => handleThemeChange('auto')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                settings.theme === 'auto'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              🔄 Auto
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {settings.theme === 'auto' 
              ? `Currently: ${isDark ? 'Dark' : 'Light'} (follows system preference)`
              : `Always ${settings.theme} mode`
            }
            {hasChanges && settings.theme !== contextMode && (
              <span className="block text-orange-600 dark:text-orange-400 text-xs mt-1">
                Preview only - click "Save Changes" to apply
              </span>
            )}
          </p>
        </div>
        

        {/* Default View */}
        <div className="border border-blue-200 dark:border-blue-700/50 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/20">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Default View
          </label>
          <select 
            value={selectedView}
            onChange={(e) => handleViewChange(e.target.value as 'dashboard' | 'tasks' | 'calendar' | 'grades')}
            disabled={viewLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 disabled:opacity-50"
          >
            <option value="dashboard">Dashboard</option>
            <option value="calendar">Calendar View</option>
            <option value="tasks">Task List</option>
            <option value="grades">Grades</option>
          </select>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
            {viewLoading ? 'Loading...' : 'This setting saves automatically and changes immediately'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose which view opens when you first load the app
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;