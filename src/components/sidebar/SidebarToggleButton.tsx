import React from 'react';

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
  return (
    <button
      onClick={onToggle}
      className="absolute w-8 h-8 bg-transparent hover:bg-gray-50 hover:scale-105 active:scale-95 rounded-md flex items-center justify-center transition-all duration-200 opacity-30 hover:opacity-70 border-0 hover:border hover:border-gray-200 group"
      title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      type="button"
      style={{ 
        willChange: 'transform',
        top: '24px',
        right: '8px',
        zIndex: 100
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`text-gray-500 group-hover:text-gray-700 transition-all duration-250 ease-out ${
          isSidebarCollapsed ? 'rotate-180' : ''
        }`}
        style={{ willChange: 'transform' }}
      >
        <path
          d="M8.5 3.5L5.5 7L8.5 10.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default SidebarToggleButton;