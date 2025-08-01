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
      className="absolute top-3 right-3 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200"
      title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      type="button"
    >
      <span className={`text-gray-600 text-sm transform transition-transform duration-200 ${
        isSidebarCollapsed ? 'rotate-180' : ''
      }`}>
        ◀
      </span>
    </button>
  );
};

export default SidebarToggleButton;