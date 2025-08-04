import React from 'react';
import type { SaveStatus } from '../types';

interface SettingsSaveControlsProps {
  hasChanges: boolean;
  saveStatus: SaveStatus;
  onSave: () => void;
  onReset: () => void;
}

const SettingsSaveControls: React.FC<SettingsSaveControlsProps> = ({
  hasChanges,
  saveStatus,
  onSave,
  onReset
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onSave}
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
            onClick={onReset}
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
  );
};

export default SettingsSaveControls;