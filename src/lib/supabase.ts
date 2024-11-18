import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

// Ensure URL is valid before creating client
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error('Invalid Supabase URL');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);