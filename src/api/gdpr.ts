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
  consentedAt: string;
  ipAddress?: string;
}

export interface ConsentListResponse {
  consents: ConsentRecord[];
}

export interface ConsentGrantResponse {
  consentType: string;
  policyVersion: string;
  consentedAt: string;
  ipAddress?: string;
}

/**
 * Check what consents the user has granted.
 * Returns an empty array when no consents exist yet.
 */
export async function getConsents(): Promise<ConsentRecord[]> {
  const response = await request<ConsentListResponse>('/consent', { method: 'GET' });
  return response.consents;
}

/**
 * Grant a specific consent.
 * Returns 201 with the granted consent record including timestamp and IP.
 * @param consentType - e.g. 'photo-analysis'
 * @param policyVersion - e.g. '1.0'
 */
export async function grantConsent(
  consentType: string,
  policyVersion: string,
): Promise<ConsentGrantResponse> {
  return await request<ConsentGrantResponse>('/consent', {
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

export interface ExportDataResponse {
  userId: string;
  exportedAt: string;
  profile: Record<string, unknown>;
  scans: unknown[];
  routinePlans?: unknown[];
  consents: ConsentRecord[];
}

/**
 * Export all user data as a JSON object.
 * Includes profile, scans, analyses, routine plans, and consent records.
 * Returns GDPR Art. 15 compliant data export.
 */
export async function exportData(): Promise<ExportDataResponse> {
  return await request<ExportDataResponse>('/profile/export', { method: 'GET' });
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
