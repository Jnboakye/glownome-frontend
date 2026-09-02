import { createContext, useContext } from 'react';
import { SkinProfile } from '../data/onboardingQuestions';

export type UserValue = {
  loading: boolean;
  /** null until the user gives one — every consumer must handle that. */
  name: string | null;
  setName: (value: string) => Promise<void>;
  /** The four onboarding answers. null until the wizard is completed. */
  profile: SkinProfile | null;
  setProfile: (value: SkinProfile) => Promise<void>;
  /** Clears the name and the answers together. */
  clear: () => Promise<void>;
};

export const UserContext = createContext<UserValue | null>(null);

export function useUser(): UserValue {
  const value = useContext(UserContext);
  if (!value) {
    throw new Error('useUser must be used inside UserContext.Provider');
  }
  return value;
}

/** First word only — what a greeting should use. */
export function firstNameOf(name: string | null): string | null {
  if (!name) return null;
  const [first] = name.trim().split(/\s+/);
  return first || null;
}

/** Up to two initials for the profile avatar, or a fallback glyph. */
export function initialsOf(name: string | null): string {
  if (!name) return '·';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}
