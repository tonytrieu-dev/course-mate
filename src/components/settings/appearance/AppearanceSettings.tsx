import React from 'react';
import type { GeneralSettingsState } from '../types';

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
  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    // Only update local settings state for preview - actual theme application happens on save
    onSettingChange('theme', theme);
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
        
        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
          <select 
            value={settings.fontSize}
            onChange={(e) => onSettingChange('fontSize', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Adjust text size for better readability</p>
        </div>

        {/* Default View */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default View</label>
          <select 
            value={settings.defaultView}
            onChange={(e) => onSettingChange('defaultView', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
          >
            <option value="calendar">Calendar View</option>
            <option value="tasks">Task List</option>
            <option value="dashboard">Dashboard</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose which view opens by default</p>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;