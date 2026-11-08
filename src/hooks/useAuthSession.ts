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
      console.log('[useAuthSession] Supabase not configured, treating as not authenticated');
      setSession(undefined);
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Load initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (cancelled) return;
        
        if (error) {
          console.log('[useAuthSession] Error loading session:', error.message);
          setSession(undefined);
          setLoading(false);
          return;
        }

        // Check if session is expired
        if (session && session.expires_at) {
          const expiresAt = session.expires_at * 1000; // Convert to ms
          const now = Date.now();
          if (expiresAt < now) {
            console.log('[useAuthSession] Session expired, treating as not authenticated');
            setSession(undefined);
            setLoading(false);
            // Clear expired session
            if (supabase) {
              supabase.auth.signOut().catch(() => {});
            }
            return;
          }
        }

        console.log('[useAuthSession] Initial session loaded:', {
          hasSession: !!session,
          userId: session?.user?.id,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        });

        setSession(session ?? undefined);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.log('[useAuthSession] Unexpected error:', error);
        setSession(undefined);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled) {
        console.log('[useAuthSession] Auth state changed:', event, {
          hasSession: !!session,
          userId: session?.user?.id,
        });
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
