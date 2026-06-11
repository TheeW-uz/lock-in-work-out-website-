import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  }
  return createClient(supabaseUrl, supabaseServiceKey || 'placeholder', {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
