import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      
      // Handle legacy values
      if (savedTheme === 'system') {
        localStorage.setItem('theme', 'auto');
        return 'auto';
      }
      
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        return savedTheme as ThemeMode;
      }
      
      return 'auto';
    } catch {
      return 'auto';
    }
  });

  const [isDark, setIsDark] = useState(false);

  const setMode = useCallback((newMode: ThemeMode) => {
    try {
      localStorage.setItem('theme', newMode);
      setModeState(newMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = () => {
      const shouldBeDark = 
        mode === 'dark' ||
        (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      setIsDark(shouldBeDark);
      
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Initial theme application
    updateTheme();

    // Listen for system theme changes when using auto preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (mode === 'auto') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [mode]);

  const value = {
    mode,
    setMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;