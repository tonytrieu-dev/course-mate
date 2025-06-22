import { supabase } from './supabaseClient';

export const signUp = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error signing up:', error.message);
        throw error;
    }
};

export const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error signing in:', error.message);
      throw error;
    }
};

export const signOut = async () => {
  try {
    // First clear any local storage items that might be related to auth
    localStorage.removeItem('supabase.auth.token');
    
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Auth service: signOut error", error);
      throw error;
    }
    console.log("Auth service: signOut successful");
    return true;
  } catch (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
};

export const getCurrentUser = async () => {
    console.log('[getCurrentUser] Entered function.');
    try {
      console.log('[getCurrentUser] About to call supabase.auth.getUser().');
      const { data: { user }, error } = await supabase.auth.getUser(); // Also capture error here for logging
      
      if (error) {
        // This error object might be different from a thrown error caught by the catch block
        console.error('[getCurrentUser] supabase.auth.getUser() returned an error property:', error);
        // We still want to fall through to the return user (which might be null if error is present)
        // or let the catch block handle it if it throws.
      }
      
      console.log('[getCurrentUser] supabase.auth.getUser() call completed. User from data:', user ? user.id : 'No user in data');
      return user;
    } catch (error) {
      console.error('[getCurrentUser] Error caught during supabase.auth.getUser():', error.message);
      console.error('[getCurrentUser] Full error object:', error);
      return null;
    }
};

export const isAuthenticated = async () => {
    const user = await getCurrentUser();
    return !!user;
};
