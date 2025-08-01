import React from 'react';

interface SidebarControlsProps {
  isSidebarCollapsed: boolean;
  isCanvasSyncing: boolean;
  onShowChatbot: () => void;
  onShowSettings: () => void;
}

const SidebarControls: React.FC<SidebarControlsProps> = ({
  isSidebarCollapsed,
  isCanvasSyncing,
  onShowChatbot,
  onShowSettings,
}) => {
  return (
    <>
      {/* Chatbot Button */}
      <div className="px-2 mt-auto border-t pt-6 flex-shrink-0 max-h-96 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="mb-3">
            <button
              onClick={onShowChatbot}
              className="w-full flex items-center p-2 hover:bg-gray-100 rounded-md transition-all duration-200 group"
              type="button"
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-base">🤖</span>
                <span className="text-gray-700 text-sm font-normal">
                  Class Chatbot
                </span>
              </div>
            </button>
          </div>
        )}
        
        {/* Collapsed chatbot icon */}
        {isSidebarCollapsed && (
          <div className="mb-3 flex justify-center">
            <button
              onClick={onShowChatbot}
              className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200"
              title="Class Chatbot"
              type="button"
            >
              <span className="text-gray-600 text-lg">🤖</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div className="px-2 mb-2">
        {!isSidebarCollapsed ? (
          <button
            onClick={onShowSettings}
            className="w-full flex items-center p-2 hover:bg-gray-100 rounded-md transition-all duration-200 group"
            type="button"
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-base">⚙️</span>
              <span className="text-gray-700 text-sm font-normal">
                Settings
              </span>
              {isCanvasSyncing && (
                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </button>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onShowSettings}
              className="w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all duration-200"
              title="Settings"
              type="button"
            >
              <span className="text-gray-600 text-lg">⚙️</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarControls;