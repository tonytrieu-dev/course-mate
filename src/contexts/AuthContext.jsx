import React, { createContext, useState, useEffect, useContext } from "react";
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
    logger.debug("AuthProvider useEffect started");

    const initializeApp = async () => {
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
    
    return withSyncOperation(async () => {
      try {
        const { user: authUser } = await signIn(email, password);
        setUser(authUser);
        if (authUser) {
          await downloadDataFromSupabase(authUser.id);
          return true;
        }
        return false;
      } catch (error) {
        handleAuthError(error, 'user login', setAuthError);
        return false;
      }
    }, setSyncing, setLastCalendarSyncTimestamp);
  };

  const register = async (email, password) => {
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
        handleAuthError(error, 'user registration', setAuthError);
        return false;
      }
    }, setSyncing, setLastCalendarSyncTimestamp);
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut();
      logger.auth('User logged out successfully');
      setUser(null);
      return true;
    } catch (error) {
      handleAuthError(error, 'user logout', setAuthError);
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
      handleAuthError(error, 'OAuth login', setAuthError);
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
        await withSyncOperation(
          () => syncData(user.id),
          setSyncing,
          setLastCalendarSyncTimestamp
        );
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
