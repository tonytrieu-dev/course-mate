import React, { useState, useEffect } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch devices for mobile optimization
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  }, []);

  if (isSidebarCollapsed) return null;

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Could trigger a preset resize or toggle behavior
    }
  };

  return (
    <>
      {/* Main interaction area with enhanced touch support */}
      <div
        className={`fixed top-0 h-full z-50 cursor-ew-resize touch-manipulation
                   ${isTouchDevice ? 'w-6' : 'w-4'} transition-all duration-200
                   ${isHovered || isResizing ? 'bg-blue-500/5' : 'bg-transparent'}
                   hover:bg-blue-500/10 active:bg-blue-500/15`}
        style={{ 
          left: `${sidebarWidth - (isTouchDevice ? 3 : 2)}px`
        }}
        onMouseDown={onStartResize}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Resize sidebar width"
        aria-orientation="horizontal"
        aria-valuemin={200}
        aria-valuemax={600}
        aria-valuenow={sidebarWidth}
        title={`Resize sidebar (current width: ${sidebarWidth}px). Drag to adjust.`}
      >
        {/* Enhanced hover area for visual feedback */}
        <div className={`absolute inset-y-0 w-full transition-all duration-200
                        ${isHovered || isResizing ? 'bg-gradient-to-r from-blue-400/10 to-indigo-400/10' : ''}
                        border-l-2 ${isResizing ? 'border-blue-500' : 'border-transparent hover:border-blue-300'}`} 
        />
        
        {/* Visual grip indicator with enhanced states */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        pointer-events-none">
          <div className={`flex flex-col space-y-1.5 transition-all duration-300
                          ${isHovered || isResizing || isTouchDevice ? 'opacity-70 scale-110' : 'opacity-0'}
                          ${isResizing ? 'opacity-100 scale-125' : ''}`}>
            {[1, 2, 3].map((index) => (
              <div 
                key={index}
                className={`w-1 h-4 rounded-full transition-all duration-200
                           ${isResizing 
                             ? 'bg-blue-600 shadow-lg' 
                             : isHovered 
                               ? 'bg-blue-500' 
                               : 'bg-gray-400'
                           }`}
                style={{
                  animationDelay: isResizing ? `${index * 0.1}s` : '0s',
                  animation: isResizing ? 'pulse 1.5s ease-in-out infinite' : 'none'
                }}
              />
            ))}
          </div>
        </div>

        {/* Touch-friendly resize instructions for mobile */}
        {isTouchDevice && (isHovered || isResizing) && (
          <div className="absolute top-4 left-full ml-3 bg-gray-900 text-white text-xs 
                         rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap z-60
                         opacity-90 animate-fadeIn">
            Drag to resize sidebar
            <div className="absolute right-full top-1/2 -translate-y-1/2">
              <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 
                             border-transparent border-r-gray-900"></div>
            </div>
          </div>
        )}

        {/* Focus indicator for keyboard navigation */}
        <div className={`absolute inset-0 rounded-sm transition-all duration-200
                        ${isResizing ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1`} 
        />
      </div>
      
      {/* Enhanced resize indicator with gradient */}
      <div
        className={`fixed top-0 h-full z-40 w-1 transition-all duration-300 ease-out
                   ${isResizing 
                     ? 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-500 shadow-lg opacity-100 scale-x-150' 
                     : 'bg-blue-400 opacity-0 scale-x-100'
                   }`}
        style={{ 
          left: `${sidebarWidth - 1}px`,
          boxShadow: isResizing ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
        }}
      />

    </>
  );
};

export default SidebarResizeHandle;