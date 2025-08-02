import React from 'react';

interface SidebarControlsProps {
  isSidebarCollapsed: boolean;
  isCanvasSyncing: boolean;
  onShowChatbot: () => void;
  onShowSettings: () => void;
  onShowStudyAnalytics: () => void;
}

const SidebarControls: React.FC<SidebarControlsProps> = ({
  isSidebarCollapsed,
  isCanvasSyncing,
  onShowChatbot,
  onShowSettings,
  onShowStudyAnalytics,
}) => {
  return (
    <>
      {/* Chatbot Button */}
      <div className="px-2 mt-auto border-t pt-6 flex-shrink-0 max-h-96 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="mb-3">
            <button
              onClick={onShowChatbot}
              className="w-full flex items-center p-2 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] rounded-md transition-all duration-150 group"
              type="button"
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-base transition-transform duration-150 group-hover:scale-105">🤖</span>
                <span className="text-gray-700 text-sm font-normal transition-colors duration-150 group-hover:text-gray-800">
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
              className="w-10 h-10 hover:bg-gray-100 hover:scale-105 active:scale-95 rounded-full flex items-center justify-center transition-all duration-150"
              title="Class Chatbot"
              type="button"
            >
              <span className="text-gray-600 text-lg transition-transform duration-150 hover:scale-105">🤖</span>
            </button>
          </div>
        )}
      </div>

      {/* Study Analytics Button */}
      <div className="px-2 mb-2">
        {!isSidebarCollapsed ? (
          <div>
            <button
              onClick={onShowStudyAnalytics}
              className="w-full flex items-center p-2 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] rounded-md transition-all duration-150 group"
              type="button"
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-base transition-transform duration-150 group-hover:scale-105">📊</span>
                <span className="text-gray-700 text-sm font-normal transition-colors duration-150 group-hover:text-gray-800">
                  Study Analytics
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onShowStudyAnalytics}
              className="w-10 h-10 hover:bg-gray-100 hover:scale-105 active:scale-95 rounded-full flex items-center justify-center transition-all duration-150"
              title="Study Analytics"
              type="button"
            >
              <span className="text-gray-600 text-lg transition-transform duration-150 hover:scale-105">📊</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div className="px-2 mb-2">
        {!isSidebarCollapsed ? (
          <div>
            <button
              onClick={onShowSettings}
              className="w-full flex items-center p-2 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] rounded-md transition-all duration-150 group"
              type="button"
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-base transition-transform duration-150 group-hover:scale-105">⚙️</span>
                <span className="text-gray-700 text-sm font-normal transition-colors duration-150 group-hover:text-gray-800">
                  Settings
                </span>
                {isCanvasSyncing && (
                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onShowSettings}
              className="w-10 h-10 hover:bg-gray-100 hover:scale-105 active:scale-95 rounded-full flex items-center justify-center transition-all duration-150 relative"
              title="Settings"
              type="button"
            >
              <span className="text-gray-600 text-lg transition-transform duration-150 hover:scale-105">⚙️</span>
              {isCanvasSyncing && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarControls;