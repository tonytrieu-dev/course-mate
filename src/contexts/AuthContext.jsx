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
            console.log("No user found, proceeding without sync");
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setAuthError("Failed to initialize application: " + error.message);
        }
      } finally {
        if (mounted) {
          console.log("AuthContext initializeApp finished. Setting timestamp and loading state.");
          setLastCalendarSyncTimestamp(Date.now());
          setLoading(false);
        }
      }
    };

    initializeApp();

    console.log("Setting up auth state listener...");
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session ? session.user?.id || 'session exists but no user id' : "no session");
        if (mounted) {
          const authUser = session?.user || null;
          setUser(authUser);

          if (event === "SIGNED_OUT") {
            console.log("[AuthContext] onAuthStateChange SIGNED_OUT: Clearing timestamp.");
            setLastCalendarSyncTimestamp(null);
          } else if (event === "SIGNED_IN" && authUser) {
            console.log("[AuthContext] onAuthStateChange SIGNED_IN: User session active, setting timestamp.");
            setLastCalendarSyncTimestamp(Date.now());
          }
        }
      }
    );

    return () => {
      console.log("Cleaning up auth listener");
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
      setAuthError(error.message);
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
      setAuthError(error.message);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut();
      setUser(null);
      return true;
    } catch (error) {
      setAuthError(error.message);
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
      console.error("OAuth login failed:", error);
      setAuthError(error.message);
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
