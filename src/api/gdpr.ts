import { request } from './client';

/**
 * GDPR consent and data privacy endpoints.
 *
 * Germany treats face photos as special-category biometric/health data under
 * GDPR Article 9. Explicit consent is required before scanning.
 */

export interface ConsentRecord {
  consentType: string;
  policyVersion: string;
  grantedAt: string;
}

export interface ConsentResponse {
  consents: ConsentRecord[];
}

/**
 * Check what consents the user has granted.
 * Returns an empty array when no consents exist yet.
 */
export async function getConsents(): Promise<ConsentRecord[]> {
  const response = await request<ConsentResponse>('/consent', { method: 'GET' });
  return response.consents;
}

/**
 * Grant a specific consent.
 * @param consentType - e.g. 'photo-analysis'
 * @param policyVersion - e.g. '1.0'
 */
export async function grantConsent(
  consentType: string,
  policyVersion: string,
): Promise<void> {
  await request('/consent', {
    method: 'POST',
    body: JSON.stringify({ consentType, policyVersion }),
  });
}

/**
 * Delete the user's account and all associated data.
 * Returns 204 on success; throws ApiError on failure.
 */
export async function deleteAccount(): Promise<void> {
  await request<void>('/profile', { method: 'DELETE' });
}

/**
 * Export all user data as a JSON object.
 * Includes profile, scans, analyses, and consent records.
 */
export async function exportData(): Promise<Record<string, unknown>> {
  return await request<Record<string, unknown>>('/profile/export', { method: 'GET' });
}

/**
 * Custom error class for consent-required failures.
 * Thrown when a 403 with code 'consent_required' is detected.
 */
export class ConsentRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConsentRequiredError';
  }
}

/**
 * Check if an error is a consent-required error.
 * Use this to catch 403 consent_required failures and redirect to the consent screen.
 */
export function isConsentRequiredError(error: unknown): boolean {
  return error instanceof ConsentRequiredError;
}
