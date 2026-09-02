import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'glownome.profile.name.v1';

/**
 * The user's name, kept on the device.
 *
 * There is no auth yet, so this is the whole of the user record. When accounts
 * arrive this hook becomes the local cache in front of the server value — the
 * screens read through `useUser()` either way and will not need to change.
 */
export function useStoredName() {
  const [loading, setLoading] = useState(true);
  const [name, setNameState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((value) => {
        if (!cancelled) setNameState(value && value.trim() ? value : null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setName = useCallback(async (value: string) => {
    const trimmed = value.trim();
    setNameState(trimmed || null);
    try {
      if (trimmed) await AsyncStorage.setItem(KEY, trimmed);
      else await AsyncStorage.removeItem(KEY);
    } catch {
      // Non-fatal: the name simply won't survive a restart.
    }
  }, []);

  const clear = useCallback(() => setName(''), [setName]);

  return { loading, name, setName, clear };
}
