import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Manages Supabase auth session with automatic refresh and persistence.
 *
 * Returns null while loading, undefined when no session exists, or the session
 * object when signed in. The session is automatically refreshed by Supabase.
 *
 * If Supabase is not configured (missing env vars), returns undefined session
 * immediately (not authenticated).
 */
export function useAuthSession() {
  const [session, setSession] = useState<Session | null | undefined>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, treat as not authenticated
    if (!isSupabaseConfigured() || !supabase) {
      setSession(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setSession(session ?? undefined);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setSession(session ?? undefined);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  }, []);

  return {
    session,
    user: session?.user,
    loading,
    signOut,
  };
}
