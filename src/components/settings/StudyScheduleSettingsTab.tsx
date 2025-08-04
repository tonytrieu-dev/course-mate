import React, { useState } from 'react';
import type { StudyScheduleSettingsTabProps } from './types';

const StudyScheduleSettingsTab: React.FC<StudyScheduleSettingsTabProps> = ({
  onOpenOptimizer,
  user,
  classes
}) => {
  const [studyScheduleEnabled, setStudyScheduleEnabled] = useState(
    localStorage.getItem('studyScheduleEnabled') !== 'false'
  );
  const [autoSync, setAutoSync] = useState(
    localStorage.getItem('autoSyncStudySchedule') === 'true'
  );
  const [reminderNotifications, setReminderNotifications] = useState(
    localStorage.getItem('studyScheduleReminders') !== 'false'
  );

  const handleSettingChange = (key: string, value: boolean) => {
    localStorage.setItem(key, String(value));
    switch (key) {
      case 'studyScheduleEnabled':
        setStudyScheduleEnabled(value);
        break;
      case 'autoSyncStudySchedule':
        setAutoSync(value);
        break;
      case 'studyScheduleReminders':
        setReminderNotifications(value);
        break;
    }
  };

  const isReady = user && classes.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">📅 Study Schedule Optimizer</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-6">
          AI-powered study scheduling that optimizes your learning based on Canvas workload and personal preferences.
        </p>
      </div>

      {/* Status Card */}
      <div className={`border rounded-lg p-6 ${
        isReady 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50' 
          : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/50'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isReady ? 'bg-green-100 dark:bg-green-800/50' : 'bg-orange-100 dark:bg-orange-800/50'
          }`}>
            {isReady ? '✅' : '⚠️'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">
              {isReady ? 'Ready to Optimize' : 'Setup Required'}
            </h3>
            <p className={`text-sm ${
              isReady 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {isReady 
                ? `${classes.length} classes detected. You can start generating study schedules.`
                : 'Please log in and sync with Canvas to use study schedule optimization.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Action */}
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">🚀 Get Started</h3>
        <p className="text-gray-600 dark:text-slate-400 mb-4">
          Generate an AI-optimized study schedule based on your Canvas assignments and learning preferences.
        </p>
        <button
          onClick={onOpenOptimizer}
          disabled={!isReady}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            isReady
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isReady ? 'Open Study Schedule Optimizer' : 'Setup Required'}
        </button>
      </div>

      {/* Features Overview */}
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">✨ Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🧠</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-slate-100">AI-Powered Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Analyzes your Canvas workload and generates personalized study schedules
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⏰</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-slate-100">Smart Time Allocation</h4>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Balances subjects and deadlines for optimal learning outcomes
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📊</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-slate-100">Progress Tracking</h4>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Monitor your study sessions and retention rates over time
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-slate-100">Spaced Repetition</h4>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Uses scientifically-proven techniques for better retention
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">⚙️ Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-100">Enable Study Schedule Optimizer</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">Allow AI-powered study scheduling features</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={studyScheduleEnabled}
                onChange={(e) => handleSettingChange('studyScheduleEnabled', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-100">Auto-sync with Canvas</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">Automatically update schedule when Canvas tasks change</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoSync}
                onChange={(e) => handleSettingChange('autoSyncStudySchedule', e.target.checked)}
                disabled={!studyScheduleEnabled}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-slate-100">Study Reminders</p>
              <p className="text-sm text-gray-600 dark:text-slate-400">Get notifications for upcoming study sessions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={reminderNotifications}
                onChange={(e) => handleSettingChange('studyScheduleReminders', e.target.checked)}
                disabled={!studyScheduleEnabled}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      {isReady && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">📈 Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Classes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Sessions Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">0h</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Study Hours</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">0%</div>
              <div className="text-sm text-gray-600 dark:text-slate-400">Retention Rate</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-4 text-center">
            Stats will update as you use the study schedule optimizer
          </p>
        </div>
      )}
    </div>
  );
};

export default StudyScheduleSettingsTab;