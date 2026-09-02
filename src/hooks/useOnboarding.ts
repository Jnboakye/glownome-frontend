import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'glownome.onboarded.v1';

export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (!cancelled) setHasOnboarded(value === 'true');
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const complete = useCallback(async () => {
    setHasOnboarded(true);
    try {
      await AsyncStorage.setItem(KEY, 'true');
    } catch {
      // Non-fatal: the user simply sees onboarding again next launch.
    }
  }, []);

  const reset = useCallback(async () => {
    setHasOnboarded(false);
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // Non-fatal.
    }
  }, []);

  return { loading, hasOnboarded, complete, reset };
}
