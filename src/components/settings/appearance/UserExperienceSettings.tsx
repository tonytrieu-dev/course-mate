import React from 'react';
import type { GeneralSettingsState } from '../types';

interface UserExperienceSettingsProps {
  settings: GeneralSettingsState;
  onSettingChange: (key: string, value: any) => void;
  onNavigationToggle: (value: boolean) => void;
}

const UserExperienceSettings: React.FC<UserExperienceSettingsProps> = ({
  settings,
  onSettingChange,
  onNavigationToggle
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">✨ User Experience</h3>
      <div className="space-y-4">
        {/* Task Completion Sound */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Task Completion Sound</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Play sound when marking tasks complete</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.taskCompletionSound}
              onChange={(e) => onSettingChange('taskCompletionSound', e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Show Week Numbers */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Show Week Numbers</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Display week numbers in calendar view</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.showWeekNumbers}
              onChange={(e) => onSettingChange('showWeekNumbers', e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Show Navigation Bar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Show Navigation Bar</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Display the top navigation bar with Calendar, Dashboard, Tasks, and Grades buttons</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.showNavigationBar}
              onChange={(e) => onNavigationToggle(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserExperienceSettings;