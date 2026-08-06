import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LOCAL_STORAGE_URL_KEY = 'nexus_supabase_url';
const LOCAL_STORAGE_KEY_KEY = 'nexus_supabase_anon_key';

export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?.*$/i, '');
  cleaned = cleaned.replace(/\/auth\/v1\/?.*$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const runtimeEnv = (globalThis as any)?.process?.env ?? {};
  const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || runtimeEnv.VITE_SUPABASE_URL || localStorage.getItem(LOCAL_STORAGE_URL_KEY) || '';
  const url = sanitizeSupabaseUrl(rawUrl);
  const anonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || runtimeEnv.VITE_SUPABASE_ANON_KEY || localStorage.getItem(LOCAL_STORAGE_KEY_KEY) || '').trim();
  return { url, anonKey };
}

export function setSupabaseCredentials(url: string, anonKey: string): void {
  const cleanUrl = sanitizeSupabaseUrl(url);
  if (cleanUrl) localStorage.setItem(LOCAL_STORAGE_URL_KEY, cleanUrl);
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

// Force reset of the Supabase client instance. Useful when the page
// is suspended/restored (BFCache) so websockets/subscriptions are recreated.
export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
