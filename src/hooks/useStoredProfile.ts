import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkinProfile } from '../data/onboardingQuestions';
import { syncProfile } from '../api/identity';

const KEY = 'glownome.profile.answers.v1';

/**
 * The four onboarding answers, kept on the device next to the name.
 *
 * Same shape as `useStoredName`: when accounts arrive this becomes the local
 * cache in front of the server record and no screen changes.
 */
export function useStoredProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfileState] = useState<SkinProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          setProfileState(JSON.parse(raw) as SkinProfile);
        } catch {
          // Corrupt value — treat as absent rather than crashing on launch.
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setProfile = useCallback(async (value: SkinProfile) => {
    setProfileState(value);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      // Non-fatal: the answers simply won't survive a restart.
    }
    try {
      // Creates the server-side profile the first time, updates it after.
      // Without this the server has no concerns for the user, and an analysis
      // can never recommend anything.
      await syncProfile(value);
    } catch {
      // Non-fatal and deliberately quiet: the wizard must not fail because the
      // backend is unreachable. The next save retries.
    }
  }, []);

  const clearProfile = useCallback(async () => {
    setProfileState(null);
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // Non-fatal.
    }
    // With Supabase Auth, the user's identity is tied to their auth session.
    // Clearing the profile locally is sufficient; sign-out handles the rest.
  }, []);

  return { loading, profile, setProfile, clearProfile };
}
