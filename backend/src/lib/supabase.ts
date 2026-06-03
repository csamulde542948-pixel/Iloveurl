import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || (process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env'),
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found in environment variables.');
}

// Server-side operations prefer the service role key when available so background
// workers can write tasks, private storage objects, and profile records safely.
export const supabase = createClient(supabaseUrl, supabaseKey);
