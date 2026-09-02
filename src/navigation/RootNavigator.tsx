import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { OnboardingScanScreen } from '../screens/OnboardingScanScreen';
import { OnboardingRoutineScreen } from '../screens/OnboardingRoutineScreen';
import { OnboardingPromiseScreen } from '../screens/OnboardingPromiseScreen';
import { OnboardingNameScreen } from '../screens/OnboardingNameScreen';
import { OnboardingProfileScreen } from '../screens/OnboardingProfileScreen';
import { ScanCaptureScreen } from '../screens/ScanCaptureScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingContext } from '../hooks/onboardingContext';
import { UserContext } from '../hooks/userContext';
import { useStoredName } from '../hooks/useStoredName';
import { useStoredProfile } from '../hooks/useStoredProfile';
import { fonts, palette } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.ink,
    background: palette.canvas,
    card: palette.surface,
    text: palette.ink,
    border: palette.outline,
  },
};

export function RootNavigator() {
  const onboarding = useOnboarding();
  const storedName = useStoredName();
  const storedProfile = useStoredProfile();

  // One context for the whole user record — name and answers travel together.
  const user = useMemo(
    () => ({
      loading: storedName.loading || storedProfile.loading,
      name: storedName.name,
      setName: storedName.setName,
      profile: storedProfile.profile,
      setProfile: storedProfile.setProfile,
      clear: async () => {
        await storedName.clear();
        await storedProfile.clearProfile();
      },
    }),
    [storedName, storedProfile],
  );

  if (onboarding.loading || user.loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <OnboardingContext.Provider value={onboarding}>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          initialRouteName={onboarding.hasOnboarded ? 'Main' : 'Onboarding'}
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: palette.canvas },
            headerTitleStyle: { fontFamily: fonts.title, fontSize: 17 },
            headerTintColor: palette.ink,
            contentStyle: { backgroundColor: palette.canvas },
          }}
        >
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingScan"
            component={OnboardingScanScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingRoutine"
            component={OnboardingRoutineScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingPromise"
            component={OnboardingPromiseScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingName"
            component={OnboardingNameScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OnboardingProfile"
            component={OnboardingProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="ScanCapture"
            component={ScanCaptureScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{ title: 'Your skin analysis' }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: '' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </OnboardingContext.Provider>
    </UserContext.Provider>
  );
}
