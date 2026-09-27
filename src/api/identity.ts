/**
 * Who the user is, as far as the server is concerned.
 *
 * There is no auth. `POST /profile` mints a row and returns an id; that id is
 * the whole identity model for now. It is kept on the device and sent with
 * every scan — without it the server has no concerns to match products
 * against, so an analysis can never recommend anything.
 *
 * Three ways in:
 *   syncProfile()   the wizard saved answers — create the profile, or update it
 *   ensureUserId()  about to upload a scan — use the stored id, or create one
 *   renewUserId()   the server said `user_not_found` — replace the stale id
 *
 * Creating a profile ("minting") goes through `mintOnce()`, so two callers at
 * the same moment share one POST /profile instead of making two profiles.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SkinProfile } from '../data/onboardingQuestions';
import { ApiError, isLiveBackend, request } from './client';

const KEY = 'glownome.profile.userId.v1';

/**
 * Where the wizard's answers live on the device. Owned here so this file can
 * read them when it has to create a profile outside the wizard;
 * `useStoredProfile` imports it rather than keeping its own copy.
 */
export const PROFILE_ANSWERS_KEY = 'glownome.profile.answers.v1';

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

/** The saved wizard answers, or null if the wizard was skipped. */
async function readStoredAnswers(): Promise<SkinProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_ANSWERS_KEY);
    return raw ? (JSON.parse(raw) as SkinProfile) : null;
  } catch {
    return null;
  }
}

async function putProfile(id: string, profile: SkinProfile): Promise<void> {
  await request<void>(`/profile/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(toPayload(profile)),
  });
}

/** The POST /profile currently in flight, if any. */
let minting: Promise<string> | null = null;

/**
 * Create a profile — unless one is already being created, in which case join
 * that request. `mine` says whether this call started it (and so whether the
 * profile holds *these* answers).
 *
 * Why: the wizard's last save and the first scan upload can both find "no id
 * yet" at the same moment. Without this, one person gets two profiles.
 */
function mintOnce(profile: SkinProfile | null): { promise: Promise<string>; mine: boolean } {
  if (minting) return { promise: minting, mine: false };

  const promise = (async () => {
    const created = await request<{ userId: string }>('/profile', {
      method: 'POST',
      // A skipped wizard sends {} — every field is optional server-side.
      body: JSON.stringify(toPayload(profile ?? {})),
    });
    await storeUserId(created.userId);
    return created.userId;
  })();

  minting = promise;
  const clear = () => {
    if (minting === promise) minting = null;
  };
  promise.then(clear, clear);
  return { promise, mine: true };
}

/**
 * Push the answers to the server, creating the profile the first time.
 *
 * Returns the user id, or null when there is no backend configured. Safe to
 * call on every save — it updates in place once a profile exists.
 */
export async function syncProfile(profile: SkinProfile): Promise<string | null> {
  if (!isLiveBackend()) return null;

  const existing = await getUserId();

  if (existing) {
    try {
      await putProfile(existing, profile);
      return existing;
    } catch (error) {
      // A 404 means the stored id no longer exists server-side — routine in
      // local development, where the database gets reset. Fall through and
      // mint a new one rather than failing forever.
      if (!(error instanceof ApiError && error.status === 404)) throw error;
      await clearUserId();
    }
  }

  const { promise, mine } = mintOnce(profile);
  const id = await promise;
  // Joined someone else's mint (e.g. a scan upload that started first): that
  // profile may have been created before these answers existed. Send them.
  if (!mine) await putProfile(id, profile);
  return id;
}

/**
 * The id to send with a scan: the stored one, or a new profile made from the
 * saved answers (an empty profile if the wizard was skipped).
 *
 * Returns null only when no backend is configured. Throws if the server can't
 * be reached — the caller keeps the scan as `synced: false`.
 */
export async function ensureUserId(): Promise<string | null> {
  if (!isLiveBackend()) return null;
  const existing = await getUserId();
  if (existing) return existing;
  return mintOnce(await readStoredAnswers()).promise;
}

/**
 * Contract (fix 1, 27 Sep): POST /scans answers 404 + `user_not_found` when
 * the userId has no profile behind it (e.g. the database was reset).
 */
export function isUnknownUser(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404 && error.code === 'user_not_found';
}

/**
 * Replace a userId the server no longer knows with a fresh profile.
 *
 * Only clears the id if it is still the stale one — if another call already
 * replaced it, that new id is used instead of minting a third profile.
 */
export async function renewUserId(staleId: string): Promise<string> {
  const current = await getUserId();
  if (current && current !== staleId) return current;
  await clearUserId();
  return mintOnce(await readStoredAnswers()).promise;
}
