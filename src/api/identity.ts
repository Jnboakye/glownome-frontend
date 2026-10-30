/**
 * Who the user is, as far as the server is concerned.
 *
 * With Supabase Auth, the profile id equals the authenticated user's id.
 * The server derives the user id from the JWT access token, so userId is no
 * longer sent in request bodies or query params.
 */

import { SkinProfile } from '../data/onboardingQuestions';
import { ApiError, isLiveBackend, request } from './client';
import { supabase } from '../lib/supabase';

/**
 * Returns the current Supabase user id, or null when not signed in or not configured.
 */
export async function getUserId(): Promise<string | null> {
  try {
    if (!supabase) return null;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * The wizard's answers in the shape the API expects.
 *
 * `age` is the only real conversion: the wizard keeps it as a string because
 * it comes from a text input, and the API wants an int (or null).
 */
function toPayload(profile: SkinProfile) {
  const age = profile.age ? Number.parseInt(profile.age, 10) : Number.NaN;
  return {
    gender: profile.gender ?? null,
    age: Number.isFinite(age) ? age : null,
    concerns: profile.concern ?? [],
    routine: profile.routine ?? null,
  };
}

/**
 * Push the answers to the server, creating the profile the first time.
 *
 * Returns the user id, or null when there is no backend configured or not
 * signed in. Safe to call on every save — the backend updates in place when
 * a profile exists, using the user id from the JWT.
 *
 * The new backend contract:
 * - PUT /profile (no id in path) updates the current user's profile
 * - POST /profile creates a profile for the current user
 * - The profile id equals the Supabase user id (derived from the JWT)
 */
export async function syncProfile(profile: SkinProfile): Promise<string | null> {
  if (!isLiveBackend()) return null;

  const userId = await getUserId();
  if (!userId) return null; // Not signed in

  const body = JSON.stringify(toPayload(profile));

  try {
    // Try updating first — most calls are saves after the profile exists
    await request<void>('/profile', { method: 'PUT', body });
    return userId;
  } catch (error) {
    // 404 means no profile exists yet for this user — create it
    if (error instanceof ApiError && error.status === 404) {
      await request<{ userId: string }>('/profile', { method: 'POST', body });
      return userId;
    }
    throw error;
  }
}
