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

  // Initialize - check current user and set up auth state listener
  useEffect(() => {
    let mounted = true;
    console.log("AuthProvider useEffect started");

    const initializeApp = async () => {
      try {
        console.log("Starting initialization...");
        // Initialize default data in local storage if needed
        await initializeDefaultData();
        console.log("Default data initialized");

        // Check for current user
        console.log("Checking for current user...");
        const currentUser = await getCurrentUser();
        console.log("Current user check result:", currentUser);
        
        if (mounted) {
          setUser(currentUser);

          // If user is logged in, sync data
          if (currentUser) {
            console.log("User found, starting sync...");
            setSyncing(true);
            try {
              await syncData(currentUser.id);
              console.log("Sync completed successfully");
            } catch (syncError) {
              console.error("Sync failed:", syncError);
              // Don't throw here, we want to continue even if sync fails
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

    // Set up listener for auth state changes
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
            console.log("[AuthContext] onAuthStateChange SIGNED_IN: User session active, setting timestamp to reflect potential new data state.");
            setLastCalendarSyncTimestamp(Date.now());
          }
        }
      }
    );

    // Clean up listener when component unmounts
    return () => {
      console.log("Cleaning up auth listener");
      mounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []); // Only run once on mount

  // Handle login
  const login = async (email, password) => {
    setAuthError(null);
    setSyncing(true);

    try {
      const { user: authUser } = await signIn(email, password);
      setUser(authUser);

      // Download data from Supabase
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

  // Handle registration
  const register = async (email, password) => {
    setAuthError(null);
    setSyncing(true);

    try {
      const { user: authUser } = await signUp(email, password);
      setUser(authUser);

      // Upload local data to Supabase
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

  // Handle logout
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

  // Clear any auth errors
  const clearAuthError = () => {
    setAuthError(null);
  };

  // Context value
  const value = {
    user,
    loading,
    syncing,
    authError,
    isAuthenticated: !!user,
    login,
    register,
    logout,
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

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
