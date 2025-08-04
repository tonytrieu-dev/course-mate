import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { updateTheme } from '../services/settings/settingsOperations';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  syncToSupabase?: (userId: string) => Promise<void>;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  userId?: string; // Optional userId for real-time sync
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children, userId }: ThemeProviderProps) => {
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

  // Optional Supabase sync function for authenticated users
  const syncToSupabase = useCallback(async (userId: string) => {
    try {
      await updateTheme(mode, userId);
    } catch (error) {
      console.warn('Failed to sync theme to Supabase:', error);
    }
  }, [mode]);

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

  // Optional: Real-time sync from other devices
  useEffect(() => {
    if (!userId) return;

    const setupRealtimeSync = async () => {
      try {
        const channel = supabase
          .channel('theme_sync')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_settings',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              try {
                const newSettings = payload.new as { settings: { theme?: ThemeMode } };
                const newTheme = newSettings?.settings?.theme;
                
                if (newTheme && newTheme !== mode) {
                  logger.info('Theme updated from another device:', { newTheme });
                  localStorage.setItem('theme', newTheme);
                  setModeState(newTheme);
                }
              } catch (error) {
                logger.warn('Failed to process real-time theme update:', { error });
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.warn('Failed to setup real-time theme sync:', error);
        return () => {}; // Return empty cleanup function on error
      }
    };

    const cleanup = setupRealtimeSync();
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then(cleanupFn => cleanupFn?.());
      }
    };
  }, [userId, mode]);

  const value = {
    mode,
    setMode,
    isDark,
    syncToSupabase,
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

// Backward compatibility: ThemeProvider without userId
export const SimpleThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider userId={undefined} children={children} />
);

export default ThemeContext;