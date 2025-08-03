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
  const controlButtons = [
    {
      id: 'chatbot',
      label: 'Class Chatbot',
      icon: '🤖',
      onClick: onShowChatbot,
      description: 'Get AI assistance with your coursework and study questions',
      ariaLabel: 'Open AI class chatbot for study assistance'
    },
    {
      id: 'analytics',
      label: 'Study Analytics',
      icon: '📊',
      onClick: onShowStudyAnalytics,
      description: 'View your study patterns and academic progress',
      ariaLabel: 'Open study analytics dashboard'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: onShowSettings,
      description: 'Configure app preferences and Canvas integration',
      ariaLabel: 'Open application settings',
      isLoading: isCanvasSyncing
    }
  ];

  return (
    <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50/50 to-white">
      {/* Expanded sidebar controls */}
      {!isSidebarCollapsed && (
        <div className="px-3 pt-6 pb-3 space-y-2">
          {controlButtons.map((button) => (
            <button
              key={button.id}
              onClick={button.onClick}
              className="w-full flex items-center p-3 rounded-xl transition-all duration-200 group
                         hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 
                         hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         border border-transparent hover:border-blue-100
                         min-h-[54px] touch-manipulation"
              type="button"
              aria-label={button.ariaLabel}
              title={button.description}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 
                               rounded-lg flex items-center justify-center group-hover:from-blue-100 
                               group-hover:to-indigo-100 transition-all duration-200 group-hover:scale-110">
                  <span className="text-lg transition-transform duration-200 group-hover:scale-110">
                    {button.icon}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-900 
                                  transition-colors duration-200">
                    {button.label}
                  </div>
                </div>
                {button.isLoading && (
                  <div className="flex-shrink-0 ml-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent 
                                    rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Collapsed sidebar controls */}
      {isSidebarCollapsed && (
        <div className="py-4 space-y-3">
          {controlButtons.map((button) => (
            <div key={button.id} className="flex justify-center">
              <button
                onClick={button.onClick}
                className="relative w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 
                           hover:from-blue-100 hover:to-indigo-100 rounded-xl
                           flex items-center justify-center transition-all duration-200 
                           hover:scale-110 active:scale-95 shadow-sm hover:shadow-md
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           border border-transparent hover:border-blue-200
                           touch-manipulation group"
                title={`${button.label}: ${button.description}`}
                aria-label={button.ariaLabel}
                type="button"
              >
                <span className="text-lg transition-transform duration-200 group-hover:scale-110">
                  {button.icon}
                </span>
                {button.isLoading && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full 
                                  animate-pulse shadow-sm border-2 border-white">
                  </div>
                )}
                
                {/* Hover tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 
                               bg-gray-900 text-white text-xs rounded-lg px-3 py-2 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                               pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {button.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2">
                    <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 
                                    border-transparent border-r-gray-900"></div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarControls;