import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://adkrfpcmfvqhctlvizxw.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);