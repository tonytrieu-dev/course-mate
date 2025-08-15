import React, { useState } from 'react';
import NotificationSettings from './NotificationSettings';
import CanvasSettings from './CanvasSettings';
import StudyScheduleOptimizer from './StudyScheduleOptimizer';
import ExportImportPanel from './ExportImportPanel';
import { StudyScheduleProvider } from '../contexts/StudyScheduleContext';
import { features } from '../utils/buildConfig';
import {
  SettingsTabNavigation,
  GeneralSettingsTab,
  SubscriptionSettingsTab,
  StudyScheduleSettingsTab,
  type SettingsModalProps,
  type SettingsTab
} from './settings/index';

const Settings: React.FC<SettingsModalProps> = ({ 
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettingsTab
            isNavCollapsed={isNavCollapsed}
            setIsNavCollapsed={setIsNavCollapsed}
          />
        );
      case 'subscription':
        return features.subscriptions ? <SubscriptionSettingsTab /> : null;
      case 'canvas':
        return <CanvasSettings />;
      case 'notifications':
        return features.showEmailNotifications ? <NotificationSettings /> : null;
      case 'study-schedule':
        return null;
      case 'export-import':
        return <ExportImportPanel />;
      default:
        return (
          <GeneralSettingsTab
            isNavCollapsed={isNavCollapsed}
            setIsNavCollapsed={setIsNavCollapsed}
          />
        );
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
          <SettingsTabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

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

export default Settings;