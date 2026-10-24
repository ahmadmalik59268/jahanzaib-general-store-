import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite environment variables or local storage configuration
const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client: SupabaseClient | null = null;

if (envUrl && envKey && !envUrl.includes('your-project-id')) {
  try {
    client = createClient(envUrl, envKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export const supabase = client;

export function isSupabaseConfigured(): boolean {
  return !!client;
}

export function getSupabaseConfig(): { url: string; hasKey: boolean } {
  return {
    url: envUrl || '',
    hasKey: !!envKey && !envKey.includes('your-anon-public-key'),
  };
}
