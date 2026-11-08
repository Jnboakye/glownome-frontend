import { useCallback, useEffect, useState } from 'react';
import { getConsents, isLiveBackend } from '../api';

/**
 * Check if the user has granted photo-analysis consent.
 * Returns null while loading, true if consent exists, false if not.
 */
export function useConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkConsent = useCallback(async () => {
    // If there's no backend, assume consent is not needed
    if (!isLiveBackend()) {
      setHasConsent(true);
      setLoading(false);
      return;
    }

    try {
      const consents = await getConsents();
      const photoConsent = consents.find((c) => c.consentType === 'photo-analysis');
      setHasConsent(!!photoConsent);
    } catch {
      setHasConsent(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConsent();
  }, [checkConsent]);

  return { hasConsent, loading, refresh: checkConsent };
}
