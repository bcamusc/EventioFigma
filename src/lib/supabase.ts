import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file or Railway variables.');
}

// Bypass navigator.locks which Scrapfly/ad blockers break
if (typeof globalThis.navigator !== 'undefined' && globalThis.navigator.locks) {
  const originalRequest = globalThis.navigator.locks.request.bind(globalThis.navigator.locks);
  globalThis.navigator.locks.request = async (name: string, optionsOrCb: any, maybeCb?: any) => {
    const cb = maybeCb || optionsOrCb;
    if (typeof cb === 'function') {
      try {
        return await originalRequest(name, optionsOrCb, maybeCb);
      } catch {
        return await cb({ name, mode: 'exclusive' });
      }
    }
    return await originalRequest(name, optionsOrCb, maybeCb);
  };
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
