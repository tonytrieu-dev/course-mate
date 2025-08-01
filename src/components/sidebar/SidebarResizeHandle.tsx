import React from 'react';

interface SidebarResizeHandleProps {
  isSidebarCollapsed: boolean;
  sidebarWidth: number;
  isResizing: boolean;
  onStartResize: (e: React.MouseEvent) => void;
}

const SidebarResizeHandle: React.FC<SidebarResizeHandleProps> = ({
  isSidebarCollapsed,
  sidebarWidth,
  isResizing,
  onStartResize,
}) => {
  if (isSidebarCollapsed) return null;

  return (
    <>
      {/* Invisible interaction area */}
      <div
        className="fixed top-0 h-full w-3 cursor-ew-resize z-50"
        style={{ 
          left: `${sidebarWidth - 1}px`
        }}
        onMouseDown={onStartResize}
        title="Drag to resize sidebar"
      >
        {/* Hover area for visual feedback */}
        <div className="absolute inset-y-0 -left-1 w-5 hover:bg-blue-500/3 transition-colors duration-150" />
        
        {/* Visual grip indicator - only show on hover when not resizing */}
        {!isResizing && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col space-y-1 opacity-0 hover:opacity-30 transition-opacity duration-200">
              <div className="w-0.5 h-3 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-3 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-3 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Blue resize indicator - follows the gray border exactly */}
      <div
        className={`resize-indicator fixed top-0 h-full z-40 ${
          isResizing ? 'visible' : ''
        }`}
        style={{ 
          left: `${sidebarWidth - 1}px`
        }}
      />
    </>
  );
};

export default SidebarResizeHandle;