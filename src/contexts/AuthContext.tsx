import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, ReactNode } from "react";
import type { User } from '@supabase/supabase-js';
import { supabase } from "../services/supabaseClient";
import {
  getCurrentUser,
  signIn,
  signUp,
  signOut,
} from "../services/authService";
import { syncData, downloadDataFromSupabase } from "../services/syncService";
import { errorHandler } from "../utils/errorHandler";
import { logger } from "../utils/logger";
import { handleAuthError, withSyncOperation } from "../utils/authHelpers";
import { syncThemeFromSupabase } from "../services/settings/settingsOperations";

// OAuth provider type
type AuthProvider = 'google' | 'github' | 'discord';

// Auth context type definition
interface AuthContextType {
  user: User | null;
  loading: boolean;
  syncing: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  loginWithProvider: (provider: AuthProvider) => Promise<void>;
  clearAuthError: () => void;
  lastCalendarSyncTimestamp: number | null;
  setLastCalendarSyncTimestamp: (timestamp: number | null) => void;
  triggerSync: () => Promise<void>;
}

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastCalendarSyncTimestamp, setLastCalendarSyncTimestamp] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    logger.debug("AuthProvider useEffect started");

    const initializeApp = async (): Promise<void> => {
      try {
        logger.debug("Starting initialization...");
        const currentUser = await getCurrentUser();
        logger.debug("Current user check result:", currentUser);

        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            logger.debug("User found, starting sync...");
            setSyncing(true);
            try {
              // Sync theme from Supabase first (non-blocking)
              try {
                await syncThemeFromSupabase(currentUser.id);
                logger.debug("Theme sync completed");
              } catch (themeError) {
                logger.warn("Theme sync failed, continuing with data sync:", themeError);
              }
              
              await syncData(currentUser.id);
              logger.debug("Sync completed successfully");
            } catch (syncError) {
              logger.error("Sync failed:", syncError);
            } finally {
              setSyncing(false);
            }
          } else {
            logger.debug('No authenticated user, proceeding without sync');
          }
        }
      } catch (error) {
        const handled = errorHandler.handle(error instanceof Error ? error : new Error('Unknown error'), 'auth initialization');
        logger.error('Auth initialization failed', { error: handled });
        if (mounted) {
          setAuthError(handled.userMessage || 'Authentication initialization failed');
        }
      } finally {
        if (mounted) {
          logger.debug('AuthContext initialization finished');
          setLastCalendarSyncTimestamp(Date.now());
          setLoading(false);
        }
      }
    };

    initializeApp();

    logger.debug('Setting up auth state listener');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth('Auth state changed', { event, hasSession: !!session, userId: session?.user?.id });
        if (mounted) {
          const authUser = session?.user || null;
          setUser(authUser);

          if (event === "SIGNED_OUT") {
            logger.auth('User signed out, clearing sync timestamp');
            setLastCalendarSyncTimestamp(null);
          } else if (event === "SIGNED_IN" && authUser) {
            logger.auth('User signed in, setting sync timestamp');
            setLastCalendarSyncTimestamp(Date.now());
          }
        }
      }
    );

    return () => {
      logger.debug('Cleaning up auth listener');
      mounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    
    return withSyncOperation(async () => {
      try {
        const { user: authUser } = await signIn(email, password);
        setUser(authUser);
        if (authUser) {
          // Sync theme from Supabase on login (non-blocking)
          try {
            await syncThemeFromSupabase(authUser.id);
            logger.debug("Theme synced on login");
          } catch (themeError) {
            logger.warn("Theme sync failed on login:", themeError);
          }
          
          await downloadDataFromSupabase(authUser.id);
          return true;
        }
        return false;
      } catch (error) {
        const errorMessage = handleAuthError(error instanceof Error ? error : new Error('Login failed'), 'user login');
        setAuthError(errorMessage);
        return false;
      }
    }, setSyncing, setLastCalendarSyncTimestamp);
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    
    return withSyncOperation(async () => {
      try {
        const { user: authUser } = await signUp(email, password);
        setUser(authUser);
        if (authUser) {
          await syncData(authUser.id);
          return true;
        }
        return false;
      } catch (error) {
        const errorMessage = handleAuthError(error instanceof Error ? error : new Error('Registration failed'), 'user registration');
        setAuthError(errorMessage);
        return false;
      }
    }, setSyncing, setLastCalendarSyncTimestamp);
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    try {
      await signOut();
      logger.auth('User logged out successfully');
      setUser(null);
      return true;
    } catch (error) {
      const errorMessage = handleAuthError(error instanceof Error ? error : new Error('Logout failed'), 'user logout');
      setAuthError(errorMessage);
      return false;
    }
  }, []);

  const loginWithProvider = useCallback(async (provider: AuthProvider): Promise<void> => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      const errorMessage = handleAuthError(error instanceof Error ? error : new Error('OAuth login failed'), 'OAuth login');
      setAuthError(errorMessage);
    }
  }, []);

  const clearAuthError = useCallback((): void => {
    setAuthError(null);
  }, []);

  const triggerSync = useCallback(async (): Promise<void> => {
    if (user) {
      await withSyncOperation(
        () => syncData(user.id),
        setSyncing,
        setLastCalendarSyncTimestamp
      );
    }
  }, [user]);

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    syncing,
    authError,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginWithProvider,
    clearAuthError,
    lastCalendarSyncTimestamp,
    setLastCalendarSyncTimestamp,
    triggerSync,
  }), [
    user,
    loading,
    syncing,
    authError,
    login,
    register,
    logout,
    loginWithProvider,
    clearAuthError,
    lastCalendarSyncTimestamp,
    setLastCalendarSyncTimestamp,
    triggerSync,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};