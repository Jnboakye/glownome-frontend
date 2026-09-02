/**
 * Thin service layer.
 *
 * Everything below returns mock data today. When the Claude-backed analysis
 * endpoint is ready, only the bodies in this folder change — no screen imports
 * mock data directly.
 *
 * Swapping in the real backend:
 *   1. Set API_BASE_URL (via app.json -> expo.extra, or an env var).
 *   2. Replace the mock branch inside each function with a request().
 */
export const API_BASE_URL: string | null = null;

export function isLiveBackend(): boolean {
  return typeof API_BASE_URL === 'string' && API_BASE_URL.length > 0;
}

/** Simulates network latency so loading states are exercised in development. */
export function delay<T>(value: T, ms = 900): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isLiveBackend()) {
    throw new Error('No API_BASE_URL configured — the app is running on mock data.');
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }
  return (await response.json()) as T;
}
