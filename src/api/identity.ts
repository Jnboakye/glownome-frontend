/**
 * Who the user is, as far as the server is concerned.
 *
 * There is no auth. `POST /profile` mints a row and returns an id; that id is
 * the whole identity model for now. It is kept on the device and sent with
 * every scan — without it the server has no concerns to match products
 * against, so an analysis can never recommend anything.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkinProfile } from '../data/onboardingQuestions';
import { ApiError, isLiveBackend, request } from './client';

const KEY = 'glownome.profile.userId.v1';

let cached: string | null | undefined;

export async function getUserId(): Promise<string | null> {
  if (cached !== undefined) return cached;
  try {
    cached = await AsyncStorage.getItem(KEY);
  } catch {
    cached = null;
  }
  return cached;
}

async function storeUserId(id: string): Promise<void> {
  cached = id;
  try {
    await AsyncStorage.setItem(KEY, id);
  } catch {
    // Non-fatal: a new profile is created on the next launch.
  }
}

export async function clearUserId(): Promise<void> {
  cached = null;
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Non-fatal.
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
 * Returns the user id, or null when there is no backend configured. Safe to
 * call on every save — it updates in place once a profile exists.
 */
export async function syncProfile(profile: SkinProfile): Promise<string | null> {
  if (!isLiveBackend()) return null;

  const body = JSON.stringify(toPayload(profile));
  const existing = await getUserId();

  if (existing) {
    try {
      await request<void>(`/profile/${encodeURIComponent(existing)}`, { method: 'PUT', body });
      return existing;
    } catch (error) {
      // A 404 means the stored id no longer exists server-side — routine in
      // local development, where the database gets reset. Fall through and
      // mint a new one rather than failing forever.
      if (!(error instanceof ApiError && error.status === 404)) throw error;
      await clearUserId();
    }
  }

  const created = await request<{ userId: string }>('/profile', { method: 'POST', body });
  await storeUserId(created.userId);
  return created.userId;
}
