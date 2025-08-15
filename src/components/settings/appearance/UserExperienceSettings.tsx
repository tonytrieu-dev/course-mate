import React from 'react';
import type { GeneralSettingsState } from '../types';
import { features } from '../../../utils/buildConfig';

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
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">User Experience</h3>
      <div className="space-y-4">

        {/* Academic System - Only show when grade analytics are enabled */}
        {features.showGradeAnalytics && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Academic System</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose between semester or quarter system for grades and scheduling</p>
            </div>
            <select
              value={settings.academicSystem}
              onChange={(e) => onSettingChange('academicSystem', e.target.value)}
              className="appearance-none px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="semester">Semester System</option>
              <option value="quarter">Quarter System</option>
            </select>
          </div>
        )}

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