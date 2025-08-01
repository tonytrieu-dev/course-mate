import React from 'react';

interface SidebarToggleButtonProps {
  isSidebarCollapsed: boolean;
  onToggle: () => void;
}

const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({
  isSidebarCollapsed,
  onToggle,
}) => {
  return (
    <button
      onClick={onToggle}
      className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 hover:bg-white hover:scale-105 active:scale-95 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/60 hover:border-gray-300 backdrop-blur-sm group"
      title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      type="button"
      style={{ willChange: 'transform' }}
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