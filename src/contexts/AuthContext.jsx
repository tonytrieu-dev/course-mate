import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';
import { getCurrentUser, signIn, signUp, signOut } from '../services/authService';
import { syncData, downloadDataFromSupabase } from '../services/syncService';
import { initializeDefaultData } from '../services/dataService';

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
    // Initialize default data in local storage if needed
    initializeDefaultData();
    
    // Check for current user
    const checkUser = async () => {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // If user is logged in, sync data
        if (currentUser) {
          setSyncing(true);
          await syncData(currentUser.id);
          setSyncing(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
    
    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
          
          // Sync data when user signs in
          setSyncing(true);
          await syncData(session.user.id);
          setSyncing(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    // Clean up listener when component unmounts
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
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
        setSyncing(false);
      }
    }
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
