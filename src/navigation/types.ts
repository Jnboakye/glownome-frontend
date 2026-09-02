import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Scan: undefined;
  Progress: undefined;
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
  Results: { analysisId: string };
  ProductDetail: { productId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
