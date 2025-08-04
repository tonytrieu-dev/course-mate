import React from 'react';
import type { SettingsTabNavigationProps, SettingsTabInfo } from './types';

const tabs: SettingsTabInfo[] = [
  {
    id: 'general',
    label: 'General',
    icon: '⚙️',
    description: 'App settings and preferences'
  },
  {
    id: 'canvas',
    label: 'Canvas Sync',
    icon: '🔄',
    description: 'Canvas LMS integration'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: '📧',
    description: 'Email reminders and alerts'
  },
  {
    id: 'study-schedule',
    label: 'Study Schedule',
    icon: '📅',
    description: 'AI-powered study optimization'
  },
  {
    id: 'export-import',
    label: 'Data Export/Import',
    icon: '💾',
    description: 'Backup and restore your data'
  }
];

const SettingsTabNavigation: React.FC<SettingsTabNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className="w-full sm:w-48 lg:w-64 bg-gray-50 dark:bg-slate-800/50 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-slate-700/50 p-2 sm:p-4">
      <nav className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 overflow-x-auto sm:overflow-x-visible">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
  );
};

export default SettingsTabNavigation;