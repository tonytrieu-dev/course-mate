import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const handleRef = useRef<HTMLDivElement>(null);

  // Detect touch devices for mobile optimization
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  }, []);

  // Isolated event handler that prevents ALL propagation
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Completely isolate this event
    e.preventDefault();
    e.stopPropagation();
    
    // Only proceed if this is exactly the handle element
    if (e.target !== e.currentTarget) {
      return;
    }
    
    // Call the original handler
    onStartResize(e);
  }, [onStartResize]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // Don't render if collapsed
  if (isSidebarCollapsed) return null;

  return (
    <div
      ref={handleRef}
      className="absolute top-0 right-0 h-full w-1 cursor-ew-resize bg-transparent hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-150"
      style={{
        // Position exactly at the right edge, no overflow
        right: 0,
        width: '4px',
        // Ensure it stays within bounds
        zIndex: 1,
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={-1} // Remove from tab order to avoid focus issues
      role="separator"
      aria-label="Resize sidebar"
      title="Drag to resize sidebar"
      // Prevent any other interactions
      onContextMenu={(e) => e.preventDefault()}
      onDoubleClick={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
};

export default SidebarResizeHandle;