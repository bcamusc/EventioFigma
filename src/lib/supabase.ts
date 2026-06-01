import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file or Railway variables.');
}

// Remove navigator.locks so Supabase uses its internal fallback
// (Scrapfly extension corrupts navigator.locks, breaking all queries)
if (typeof globalThis.navigator !== 'undefined') {
  (globalThis.navigator as any).locks = undefined;
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
