import { UserProfile } from '../api/types';

/**
 * Demo profile stats. The NAME is no longer here — it comes from what the user
 * typed during onboarding, via `useUser()`. Everything below is still fixture
 * data and should come from the backend once accounts exist.
 */
export const CURRENT_USER: Omit<UserProfile, 'name' | 'email'> = {
  id: 'u-1',
  skinType: 'Combination, dehydrated',
  memberSince: 'August 2026',
  scanCount: 5,
};
