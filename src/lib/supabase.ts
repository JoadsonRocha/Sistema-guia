import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LOCAL_STORAGE_URL_KEY = 'nexus_supabase_url';
const LOCAL_STORAGE_KEY_KEY = 'nexus_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || localStorage.getItem(LOCAL_STORAGE_URL_KEY) || '';
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem(LOCAL_STORAGE_KEY_KEY) || '';
  return { url, anonKey };
}

export function setSupabaseCredentials(url: string, anonKey: string): void {
  if (url) localStorage.setItem(LOCAL_STORAGE_URL_KEY, url.trim());
  else localStorage.removeItem(LOCAL_STORAGE_URL_KEY);

  if (anonKey) localStorage.setItem(LOCAL_STORAGE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(LOCAL_STORAGE_KEY_KEY);

  // Force re-initialization
  supabaseInstance = null;
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}
