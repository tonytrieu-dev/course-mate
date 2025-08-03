import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const DarkModeDebug: React.FC = () => {
  const { mode, isDark, setMode } = useTheme();
  const [documentHasDarkClass, setDocumentHasDarkClass] = useState(false);
  const [localStorageTheme, setLocalStorageTheme] = useState<string | null>(null);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [tailwindTestColor, setTailwindTestColor] = useState('');

  useEffect(() => {
    const checkDarkMode = () => {
      // Check if documentElement has dark class
      const hasDark = document.documentElement.classList.contains('dark');
      setDocumentHasDarkClass(hasDark);

      // Check localStorage
      const theme = localStorage.getItem('theme');
      setLocalStorageTheme(theme);

      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSystemPrefersDark(prefersDark);

      // Test if Tailwind is working
      const testEl = document.createElement('div');
      testEl.className = 'bg-gray-900 dark:bg-white';
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const bgColor = computed.backgroundColor;
      setTailwindTestColor(bgColor);
      document.body.removeChild(testEl);
    };

    checkDarkMode();

    // Check every second for debugging
    const interval = setInterval(checkDarkMode, 1000);
    return () => clearInterval(interval);
  }, [mode, isDark]);

  const forceAddDarkClass = () => {
    document.documentElement.classList.add('dark');
    window.location.reload();
  };

  const forceRemoveDarkClass = () => {
    document.documentElement.classList.remove('dark');
    window.location.reload();
  };

  return (
    <div className="fixed top-20 right-4 z-[50000] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border-2 border-blue-500 max-w-sm">
      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
        🔍 Dark Mode Debug Panel
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">ThemeContext mode:</span>
          <span className="font-mono text-gray-900 dark:text-white">{mode}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">ThemeContext isDark:</span>
          <span className={`font-mono ${isDark ? 'text-green-600' : 'text-red-600'}`}>
            {String(isDark)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Document has 'dark':</span>
          <span className={`font-mono ${documentHasDarkClass ? 'text-green-600' : 'text-red-600'}`}>
            {String(documentHasDarkClass)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">localStorage:</span>
          <span className="font-mono text-gray-900 dark:text-white">{localStorageTheme || 'null'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">System dark:</span>
          <span className={`font-mono ${systemPrefersDark ? 'text-green-600' : 'text-red-600'}`}>
            {String(systemPrefersDark)}
          </span>
        </div>

        <div className="border-t pt-2 mt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tailwind test color:</div>
          <div className="font-mono text-xs text-gray-900 dark:text-white break-all">
            {tailwindTestColor}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Theme Controls:</h4>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('light')}
            className={`px-2 py-1 text-xs rounded ${
              mode === 'light' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`px-2 py-1 text-xs rounded ${
              mode === 'dark' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setMode('auto')}
            className={`px-2 py-1 text-xs rounded ${
              mode === 'auto' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Auto
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Force Actions:</h4>
        <div className="flex gap-1">
          <button
            onClick={forceAddDarkClass}
            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            Force Add Dark
          </button>
          <button
            onClick={forceRemoveDarkClass}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Force Remove Dark
          </button>
        </div>
      </div>

      <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          This box should be dark gray in dark mode
        </p>
      </div>
    </div>
  );
};

export default DarkModeDebug;