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
              window.dispatchEvent(new CustomEvent("calendar-update"));
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
          console.log("Setting loading to false");
          setLoading(false);
        }
      }
    };

    initializeApp();

    // Set up listener for auth state changes
    console.log("Setting up auth state listener...");
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        if (mounted) {
          if (event === "SIGNED_IN" && session) {
            setUser(session.user);
            setSyncing(true);
            try {
              await syncData(session.user.id);
              window.dispatchEvent(new CustomEvent("calendar-update"));
            } catch (syncError) {
              console.error("Sync after sign in failed:", syncError);
            } finally {
              setSyncing(false);
            }
          } else if (event === "SIGNED_OUT") {
            setUser(null);
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
        window.dispatchEvent(new CustomEvent("calendar-update"));
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
        window.dispatchEvent(new CustomEvent("calendar-update"));
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
    triggerSync: async () => {
      if (user) {
        setSyncing(true);
        await syncData(user.id);
        window.dispatchEvent(new CustomEvent("calendar-update"));
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
