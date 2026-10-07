import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Routine: undefined;
  Assistant: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  OnboardingScan: undefined;
  OnboardingRoutine: undefined;
  OnboardingPromise: undefined;
  OnboardingName: undefined;
  OnboardingProfile: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ScanCapture: undefined;
  /** Library upload (the old Scan tab), opened from the Home scan card. */
  ScanLibrary: undefined;
  /** Scan history, opened from Home. Redesigned in R3. */
  Progress: undefined;
  Results: { scanId: string };
  ProductDetail: { productId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
