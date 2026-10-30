import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type AuthValue = {
  /** null while loading, undefined when loaded and no session exists. */
  session: Session | null | undefined;
  user: User | null | undefined;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthContext.Provider');
  }
  return value;
}
