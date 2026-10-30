import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Manages Supabase auth session with automatic refresh and persistence.
 *
 * Returns null while loading, undefined when no session exists, or the session
 * object when signed in. The session is automatically refreshed by Supabase.
 */
export function useAuthSession() {
  const [session, setSession] = useState<Session | null | undefined>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user: session?.user,
    loading,
    signOut,
  };
}
