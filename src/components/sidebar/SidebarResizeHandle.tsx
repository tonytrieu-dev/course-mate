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
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch devices for mobile optimization
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  }, []);

  if (isSidebarCollapsed) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Could trigger a preset resize or toggle behavior
    }
  };

  return (
    <>
      {/* Main interaction area - invisible for clean look */}
      <div
        className={`fixed top-0 h-full z-50 cursor-ew-resize touch-manipulation bg-transparent
                   ${isTouchDevice ? 'w-6' : 'w-4'}`}
        style={{ 
          left: `${sidebarWidth - (isTouchDevice ? 3 : 2)}px`
        }}
        onMouseDown={onStartResize}
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
        {/* Minimal hover area - no visual feedback for clean look */}
        <div className="absolute inset-y-0 w-full" />
        
        {/* Visual grip indicator removed for cleaner look */}

        {/* Touch instructions removed for clean look */}

        {/* Focus indicator removed for clean look */}
      </div>
      
      {/* Resize indicator removed for cleaner look */}

    </>
  );
};

export default SidebarResizeHandle;