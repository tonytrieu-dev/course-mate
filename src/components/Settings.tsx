import React, { useState, useEffect } from 'react';
import NotificationSettings from './NotificationSettings';
import CanvasSettings from './CanvasSettings';
import StudyScheduleOptimizer from './StudyScheduleOptimizer';
import { StudyScheduleProvider } from '../contexts/StudyScheduleContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { updateTheme, getThemeFromSettings, syncThemeFromContext } from '../services/settings/settingsOperations';
import type { User } from '@supabase/supabase-js';
import type { ClassWithRelations } from '../types/database';

interface SettingsProps {
  onClose: () => void;
  initialTab?: 'general' | 'canvas' | 'notifications' | 'study-schedule';
  user?: User | null;
  classes?: ClassWithRelations[];
  useSupabase?: boolean;
  isNavCollapsed?: boolean;
  setIsNavCollapsed?: (collapsed: boolean) => void;
}

type SettingsTab = 'general' | 'canvas' | 'notifications' | 'study-schedule';

const Settings: React.FC<SettingsProps> = ({ 
  onClose, 
  initialTab = 'general',
  user = null,
  classes = [],
  useSupabase = false,
  isNavCollapsed = false,
  setIsNavCollapsed = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [showStudySchedule, setShowStudySchedule] = useState(false);

  const tabs = [
    {
      id: 'general' as const,
      label: 'General',
      icon: '⚙️',
      description: 'App settings and preferences'
    },
    {
      id: 'canvas' as const,
      label: 'Canvas Sync',
      icon: '🔄',
      description: 'Canvas LMS integration'
    },
    {
      id: 'notifications' as const,
      label: 'Notifications',
      icon: '📧',
      description: 'Email reminders and alerts'
    },
    {
      id: 'study-schedule' as const,
      label: 'Study Schedule',
      icon: '📅',
      description: 'AI-powered study optimization'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings 
          isNavCollapsed={isNavCollapsed}
          setIsNavCollapsed={setIsNavCollapsed}
        />;
      case 'canvas':
        return <CanvasSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'study-schedule':
        return (
          <StudyScheduleSettings 
            onOpenOptimizer={() => setShowStudySchedule(true)}
            user={user}
            classes={classes}
          />
        );
      default:
        return <GeneralSettings 
          isNavCollapsed={isNavCollapsed}
          setIsNavCollapsed={setIsNavCollapsed}
        />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800/95 dark:backdrop-blur-md rounded-xl shadow-2xl dark:shadow-slate-900/40 border border-gray-100 dark:border-slate-700/50 max-w-sm sm:max-w-2xl lg:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-xl sm:text-2xl">⚙️</span>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-slate-100">Settings</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 hidden sm:block">Customize your ScheduleBud experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-xl sm:text-2xl font-bold transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col sm:flex-row h-[calc(95vh-80px)] sm:h-[calc(90vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-full sm:w-48 lg:w-64 bg-gray-50 dark:bg-slate-800/50 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-slate-700/50 p-2 sm:p-4">
            <nav className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 overflow-x-auto sm:overflow-x-visible">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full sm:w-auto text-left p-2 sm:p-3 rounded-lg transition-all duration-200 group whitespace-nowrap sm:whitespace-normal min-w-[120px] sm:min-w-0 touch-manipulation ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-base sm:text-lg">{tab.icon}</span>
                    <div className="hidden sm:block">
                      <div className="font-medium text-sm sm:text-base">{tab.label}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-300 hidden lg:block">
                        {tab.description}
                      </div>
                    </div>
                    <div className="sm:hidden">
                      <div className="font-medium text-sm">{tab.label}</div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>

          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900/95">
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>

      </div>
      
      {/* Study Schedule Optimizer Modal */}
      {showStudySchedule && user && (
        <StudyScheduleProvider user={user} classes={classes} useSupabase={useSupabase}>
          <StudyScheduleOptimizer
            user={user}
            classes={classes}
            useSupabase={useSupabase}
            isVisible={showStudySchedule}
            onClose={() => setShowStudySchedule(false)}
          />
        </StudyScheduleProvider>
      )}
    </div>
  );
};

// General Settings Component
interface GeneralSettingsProps {
  isNavCollapsed?: boolean;
  setIsNavCollapsed?: (collapsed: boolean) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
  isNavCollapsed = false, 
  setIsNavCollapsed = () => {} 
}) => {
  const { mode, isDark, setMode } = useTheme();
  const { user } = useAuth();
  
  const [settings, setSettings] = useState(() => {
    // Sync theme from context on initialization
    const syncedTheme = syncThemeFromContext();
    return {
      fontSize: localStorage.getItem('fontSize') || 'medium',
      defaultView: localStorage.getItem('defaultView') || 'calendar',
      taskCompletionSound: localStorage.getItem('taskCompletionSound') !== 'false',
      showWeekNumbers: localStorage.getItem('showWeekNumbers') === 'true',
      showNavigationBar: !isNavCollapsed, // Track navigation bar state
      theme: mode // Track theme in local settings state
    };
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync settings.theme with current ThemeContext mode on component mount only
  useEffect(() => {
    // Only sync on initial mount, don't track changes after that
    setSettings(prev => ({ ...prev, theme: mode }));
  }, []); // Empty dependency array - only run on mount


  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Special handler for navigation bar toggle - only updates local state, doesn't apply immediately
  const handleNavigationToggle = (value: boolean) => {
    setSettings(prev => ({
      ...prev,
      showNavigationBar: value
    }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Save non-theme and non-navigation settings to localStorage
      Object.entries(settings).forEach(([key, value]) => {
        if (key !== 'theme' && key !== 'showNavigationBar') { // Theme and navigation handled separately
          localStorage.setItem(key, String(value));
        }
      });

      // Save theme through settings service and update ThemeContext
      if (settings.theme) {
        await updateTheme(settings.theme as 'light' | 'dark' | 'auto', user?.id);
        setMode(settings.theme as 'light' | 'dark' | 'auto'); // Apply theme change to ThemeContext
      }

      // Apply navigation bar setting only when saving
      setIsNavCollapsed(!settings.showNavigationBar);

      setHasChanges(false);
      setSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      fontSize: 'medium',
      defaultView: 'calendar',
      taskCompletionSound: true,
      showWeekNumbers: false,
      showNavigationBar: true, // Default to showing navigation bar
      theme: 'auto' as 'light' | 'dark' | 'auto'
    };
    setSettings(defaultSettings);
    // Don't apply theme change immediately - let user save first
    // Don't apply navigation change immediately - let user save first
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Theme change handler that only updates local state (preview only)
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setSettings(prev => ({ ...prev, theme: newTheme }));
    setHasChanges(true);
    setSaveStatus('idle');
    // Don't call setMode here - only update local state for preview
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">⚙️ General Settings</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-6">
          Configure your app preferences and general settings.
        </p>
      </div>

      {/* App Theme */}
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">🎨 Appearance</h3>
        <div className="space-y-4">
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
              {hasChanges && settings.theme !== mode && (
                <span className="block text-orange-600 dark:text-orange-400 text-xs mt-1">
                  Preview only - click "Save Changes" to apply
                </span>
              )}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
            <select 
              value={settings.fontSize}
              onChange={(e) => handleSettingChange('fontSize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Adjust text size for better readability</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default View</label>
            <select 
              value={settings.defaultView}
              onChange={(e) => handleSettingChange('defaultView', e.target.value)}
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

      {/* User Experience */}
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">✨ User Experience</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Task Completion Sound</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Play sound when marking tasks complete</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.taskCompletionSound}
                onChange={(e) => handleSettingChange('taskCompletionSound', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Show Week Numbers</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Display week numbers in calendar view</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.showWeekNumbers}
                onChange={(e) => handleSettingChange('showWeekNumbers', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Show Navigation Bar</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Display the top navigation bar with Calendar, Dashboard, Tasks, and Grades buttons</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.showNavigationBar}
                onChange={(e) => handleNavigationToggle(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>


      {/* Action Buttons */}
      <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saveStatus === 'saving'}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                hasChanges && saveStatus !== 'saving'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm dark:bg-blue-700 dark:hover:bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {saveStatus === 'saving' ? (
                <span className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="text-sm">
            {saveStatus === 'saved' && (
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <span className="mr-2">✅</span>
                Settings saved successfully!
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <span className="mr-2">❌</span>
                Failed to save settings
              </span>
            )}
            {hasChanges && saveStatus === 'idle' && (
              <span className="text-orange-600 dark:text-orange-400 flex items-center">
                <span className="mr-2">⚠️</span>
                You have unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">ℹ️ About</h3>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p><strong>ScheduleBud</strong> - Built for students, by a student</p>
          <p>Version: 1.0.0</p>
          <p>A Notion-inspired productivity app with Canvas integration</p>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Made with ❤️ to help students stay organized and succeed in their academic journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Study Schedule Settings Component
interface StudyScheduleSettingsProps {
  onOpenOptimizer: () => void;
  user: User | null;
  classes: ClassWithRelations[];
}

const StudyScheduleSettings: React.FC<StudyScheduleSettingsProps> = ({
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

export default Settings;