import React, { useState, useEffect } from 'react';

interface SidebarToggleButtonProps {
  isSidebarCollapsed: boolean;
  onToggle: () => void;
  sidebarWidth?: number;
}

const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({
  isSidebarCollapsed,
  onToggle,
  sidebarWidth = 256,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch devices for mobile optimization
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  }, []);

  // Show button on hover near sidebar edge or always on touch devices
  useEffect(() => {
    if (isTouchDevice) {
      setIsVisible(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const threshold = isSidebarCollapsed ? 50 : sidebarWidth + 50;
      setIsVisible(e.clientX < threshold);
    };

    const handleMouseLeave = () => {
      if (!isTouchDevice) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isSidebarCollapsed, sidebarWidth, isTouchDevice]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <button
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={`absolute rounded-lg flex items-center justify-center transition-all duration-300 
                 touch-manipulation group border backdrop-blur-sm
                 ${isTouchDevice ? 'w-9 h-9' : 'w-8 h-8'}
                 ${isVisible 
                   ? 'opacity-90 scale-100' 
                   : 'opacity-0 scale-75 pointer-events-none'
                 }
                 bg-white/80 dark:bg-slate-800/60 hover:bg-white/90 dark:hover:bg-slate-700/70 border-gray-300 dark:border-slate-600/50 hover:border-gray-400 dark:hover:border-slate-500/50 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-300 shadow-md hover:shadow-lg
                 hover:scale-110 active:scale-95
                 focus:outline-none`}
      title={isSidebarCollapsed ? "Expand sidebar (⌘⇧E)" : "Collapse sidebar (⌘⇧E)"}
      aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      type="button"
      style={{ 
        willChange: 'transform, opacity',
        top: isTouchDevice ? '20px' : '24px',
        left: isSidebarCollapsed ? '50%' : 'auto',
        right: isSidebarCollapsed ? 'auto' : '12px',
        transform: isSidebarCollapsed ? 'translateX(-50%)' : 'none',
        zIndex: 150
      }}
    >
      {/* Enhanced icon with animation states */}
      <svg
        width={isTouchDevice ? "16" : "14"}
        height={isTouchDevice ? "16" : "14"}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-all duration-300 ease-out transform
                   ${isSidebarCollapsed ? 'rotate-180' : 'rotate-0'}
                   group-hover:scale-110`}
        style={{ willChange: 'transform' }}
      >
        {/* Animated chevron with enhanced styling */}
        <path
          d="M9.5 4L6 8L9.5 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        
        {/* Secondary chevron for depth effect */}
        <path
          d="M11.5 4L8 8L11.5 12"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50"
        />
      </svg>

      {/* Interactive state indicators */}
      <div className="absolute inset-0 rounded-xl transition-all duration-300
                      bg-gradient-to-r from-gray-200/0 via-gray-100/30 to-gray-200/0 dark:from-slate-600/0 dark:via-slate-500/20 dark:to-slate-600/0
                      opacity-0 group-hover:opacity-100" />


      {/* Mobile touch feedback */}
      {isTouchDevice && (
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 
                       group-active:opacity-100 transition-opacity duration-150" />
      )}
    </button>
  );
};

export default SidebarToggleButton;