/**
 * Thin service layer.
 *
 * Every function in this folder returns real data from the Glownome API when
 * one is configured, and an honest empty value when there isn't. No screen
 * imports mock data, and nothing here invents a reading.
 *
 * POINTING THIS AT A BACKEND
 *   Create `.env` at the project root:
 *     EXPO_PUBLIC_API_URL=http://192.168.1.42:8000
 *   then restart Metro with `npx expo start -c`.
 *
 *   NOT `localhost`. On a phone running Expo Go, localhost is the phone.
 *   Use your Mac's LAN IP (`ipconfig getifaddr en0`), or `10.0.2.2` for the
 *   Android emulator. The iOS simulator is the one case where localhost works.
 */

// Expo inlines EXPO_PUBLIC_* variables at build time, so reading them needs no
// extra dependency. Declared locally because this project has no expo-env.d.ts.
declare const process: { env: Record<string, string | undefined> };

/** Trailing slashes stripped so `${API_BASE_URL}${path}` never doubles up. */
export const API_BASE_URL: string | null =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') || null;

export function isLiveBackend(): boolean {
  return typeof API_BASE_URL === 'string' && API_BASE_URL.length > 0;
}

/**
 * A failed request, carrying the status so callers can branch on it.
 *
 * The API returns `{ error, statusCode }` for every failure, so `message` is
 * the server's own wording where there is one.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Simulates network latency so loading states are exercised in development. */
export function delay<T>(value: T, ms = 900): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Get the Supabase access token for authenticated requests.
 *
 * Imported dynamically to avoid circular dependencies with the auth system.
 * Returns null when not signed in.
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const { supabase } = await import('../lib/supabase');
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isLiveBackend()) {
    throw new ApiError('No EXPO_PUBLIC_API_URL configured.', 0);
  }

  // Attach Supabase access token for authenticated endpoints
  const token = await getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    // Wrong LAN IP, Mac asleep, container down — all land here.
    throw new ApiError(`Could not reach the server at ${API_BASE_URL}.`, 0);
  }

  // 401 means the token is invalid or expired — sign the user out
  if (response.status === 401) {
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
    } catch {
      // Non-fatal: the auth state will be cleared anyway.
    }
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}) for ${path}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // Not every failure has a JSON body — keep the generic message.
    }
    throw new ApiError(message, response.status);
  }

  // 204 No Content (PUT /profile) has no body to parse.
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
