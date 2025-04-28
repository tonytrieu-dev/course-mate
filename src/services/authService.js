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
    
    // Then sign out from Supabase
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error fetching user:', error.message);
      return null;
    }
};

export const isAuthenticated = async () => {
    const user = await getCurrentUser();
    return !!user;
};
