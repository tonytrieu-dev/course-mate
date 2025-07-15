import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../services/supabaseClient";
import {
  getCurrentUser,
  signIn,
  signUp,
  signOut,
} from "../services/authService";
import { syncData, downloadDataFromSupabase } from "../services/syncService";
import { initializeDefaultData } from "../services/dataService";
import { errorHandler } from "../utils/errorHandler";
import { logger } from "../utils/logger";

// Create the auth context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [lastCalendarSyncTimestamp, setLastCalendarSyncTimestamp] = useState(null);
  const [initialUserLoadProcessed, setInitialUserLoadProcessed] = useState(false);

  useEffect(() => {
    let mounted = true;
    console.log("AuthProvider useEffect started");

    const initializeApp = async () => {
      try {
        console.log("Starting initialization...");
        await initializeDefaultData();
        console.log("Default data initialized");

        const currentUser = await getCurrentUser();
        console.log("Current user check result:", currentUser);

        if (mounted) {
          setUser(currentUser);
          if (currentUser) {
            console.log("User found, starting sync...");
            setSyncing(true);
            try {
              await syncData(currentUser.id);
              console.log("Sync completed successfully");
            } catch (syncError) {
              console.error("Sync failed:", syncError);
            } finally {
              setSyncing(false);
            }
          } else {
            logger.debug('No authenticated user, proceeding without sync');
          }
        }
      } catch (error) {
        const errorMessage = errorHandler.handle(error, 'auth initialization');
        logger.error('Auth initialization failed', { error: errorMessage });
        if (mounted) {
          setAuthError(errorMessage);
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

  const login = async (email, password) => {
    setAuthError(null);
    setSyncing(true);

    try {
      const { user: authUser } = await signIn(email, password);
      setUser(authUser);
      if (authUser) {
        await downloadDataFromSupabase(authUser.id);
        setLastCalendarSyncTimestamp(Date.now());
      }
      return true;
    } catch (error) {
      const errorMessage = errorHandler.handle(error, 'user login');
      setAuthError(errorMessage);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const register = async (email, password) => {
    setAuthError(null);
    setSyncing(true);

    try {
      const { user: authUser } = await signUp(email, password);
      setUser(authUser);
      if (authUser) {
        await syncData(authUser.id);
        setLastCalendarSyncTimestamp(Date.now());
      }
      return true;
    } catch (error) {
      const errorMessage = errorHandler.handle(error, 'user registration');
      setAuthError(errorMessage);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut();
      logger.auth('User logged out successfully');
      setUser(null);
      return true;
    } catch (error) {
      const errorMessage = errorHandler.handle(error, 'user logout');
      setAuthError(errorMessage);
      return false;
    }
  };

  const loginWithProvider = async (provider) => {
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
      const errorMessage = errorHandler.handle(error, 'OAuth login');
      setAuthError(errorMessage);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = {
    user,
    loading,
    syncing,
    authError,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginWithProvider, // ✅ OAuth method added
    clearAuthError,
    lastCalendarSyncTimestamp,
    setLastCalendarSyncTimestamp,
    triggerSync: async () => {
      if (user) {
        setSyncing(true);
        await syncData(user.id);
        setLastCalendarSyncTimestamp(Date.now());
        setSyncing(false);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
