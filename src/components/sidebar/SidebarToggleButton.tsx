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
                 ${isSidebarCollapsed 
                   ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 hover:border-blue-600 text-white shadow-lg hover:shadow-xl' 
                   : 'bg-white/90 hover:bg-white border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 shadow-md hover:shadow-lg'
                 }
                 hover:scale-110 active:scale-95
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
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
      <div className={`absolute inset-0 rounded-xl transition-all duration-300
                      ${isSidebarCollapsed 
                        ? 'bg-gradient-to-r from-blue-400/0 via-blue-300/20 to-blue-400/0' 
                        : 'bg-gradient-to-r from-gray-200/0 via-gray-100/30 to-gray-200/0'
                      }
                      opacity-0 group-hover:opacity-100`} 
      />


      {/* Mobile touch feedback */}
      {isTouchDevice && (
        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 
                       group-active:opacity-100 transition-opacity duration-150" />
      )}
    </button>
  );
};

export default SidebarToggleButton;