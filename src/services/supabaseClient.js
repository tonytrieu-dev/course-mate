import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../../config.js';

export const supabase = createClient(supabaseConfig.url, supabaseConfig.key);