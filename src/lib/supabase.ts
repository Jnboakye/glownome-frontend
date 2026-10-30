/**
 * Supabase client configured for Expo with secure session persistence.
 *
 * Session tokens are stored in SecureStore (encrypted hardware-backed keychain
 * on iOS, EncryptedSharedPreferences on Android) and automatically refreshed.
 *
 * The publishable anon key is safe to commit — it only grants the access your
 * RLS policies allow. Never ship the service_role key in the app bundle.
 */

import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

declare const process: { env: Record<string, string | undefined> };

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Check if Supabase is properly configured.
 * Used by the app to show a helpful error screen instead of crashing.
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

/**
 * Get a human-readable error message for missing configuration.
 */
export function getSupabaseConfigError(): string | null {
  if (!supabaseUrl && !supabaseAnonKey) {
    return 'Missing EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env';
  }
  if (!supabaseUrl) {
    return 'Missing EXPO_PUBLIC_SUPABASE_URL in .env';
  }
  if (!supabaseAnonKey) {
    return 'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env';
  }
  return null;
}

/**
 * Custom storage adapter using SecureStore for encrypted session persistence.
 *
 * Supabase expects a synchronous storage interface, but SecureStore is async.
 * The session manager handles the async reads internally, so this adapter only
 * needs to store and remove — both of which can be fire-and-forget.
 */
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Non-fatal: session simply won't survive a restart.
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Non-fatal.
    }
  },
};

/**
 * Supabase client instance.
 * Only created if env vars are present; null otherwise.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Not needed in React Native
        flowType: 'pkce', // Use PKCE flow for OAuth (more secure, required for mobile)
      },
    })
  : null;
