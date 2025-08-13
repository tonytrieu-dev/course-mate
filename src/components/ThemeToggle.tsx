import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useTheme();

  const handleThemeChange = async (newMode: 'light' | 'dark') => {
    await setMode(newMode);
  };

  return (
    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Light theme button */}
      <button
        onClick={() => handleThemeChange('light')}
        className={`p-2 rounded-lg text-lg transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center ${
          mode === 'light'
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        type="button"
        aria-label="Switch to light theme"
      >
        ☀️
      </button>

      {/* Dark theme button */}
      <button
        onClick={() => handleThemeChange('dark')}
        className={`p-2 rounded-lg text-lg transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center ${
          mode === 'dark'
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-700'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        type="button"
        aria-label="Switch to dark theme"
      >
        🌙
      </button>
    </div>
  );
};

export default ThemeToggle;