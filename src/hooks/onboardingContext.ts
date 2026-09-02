import { createContext, useContext } from 'react';

export type OnboardingValue = {
  loading: boolean;
  hasOnboarded: boolean;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
};

export const OnboardingContext = createContext<OnboardingValue | null>(null);

export function useOnboardingContext(): OnboardingValue {
  const value = useContext(OnboardingContext);
  if (!value) {
    throw new Error('useOnboardingContext must be used inside OnboardingContext.Provider');
  }
  return value;
}
