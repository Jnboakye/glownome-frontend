import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { SignInScreen } from '../screens/SignInScreen';
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
import { AuthContext } from '../hooks/authContext';
import { useAuthSession } from '../hooks/useAuthSession';
import { useStoredName } from '../hooks/useStoredName';
import { useStoredProfile } from '../hooks/useStoredProfile';
import { isSupabaseConfigured, getSupabaseConfigError } from '../lib/supabase';
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
  // Check Supabase configuration first, before any hooks that might use it
  if (!isSupabaseConfigured()) {
    const errorMessage = getSupabaseConfigError();
    return (
      <SafeAreaView className="flex-1 bg-canvas">
        <ScrollView
          contentContainerClassName="flex-1 px-gutter justify-center"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center">
            <Text className="font-title text-[48px] text-accent mb-sm" style={{ fontFamily: fonts.title }}>
              ⚠️
            </Text>
            <Text className="font-title text-[24px] text-ink text-center mb-md">
              Configuration Required
            </Text>
            <Text className="font-body text-body text-ink-faint text-center mb-lg">
              {errorMessage}
            </Text>
            <View className="bg-surface rounded-lg p-lg border border-outline">
              <Text className="font-ui text-caption text-ink-faint mb-xs">SETUP STEPS:</Text>
              <Text className="font-body text-body-sm text-ink mb-sm">
                1. Create a .env file in the project root
              </Text>
              <Text className="font-body text-body-sm text-ink mb-sm">
                2. Add your Supabase credentials:
              </Text>
              <View className="bg-canvas rounded px-sm py-xs mb-sm">
                <Text className="font-mono text-[11px] text-ink" style={{ fontFamily: 'Courier' }}>
                  EXPO_PUBLIC_SUPABASE_URL=...{'\n'}
                  EXPO_PUBLIC_SUPABASE_ANON_KEY=...
                </Text>
              </View>
              <Text className="font-body text-body-sm text-ink mb-sm">
                3. Restart Metro: npx expo start -c
              </Text>
              <Text className="font-body text-body-sm text-ink-faint mt-md">
                See .env.example for the full template.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const auth = useAuthSession();
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

  if (auth.loading || onboarding.loading || user.loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }

  // Auth gate: show sign-in when not authenticated
  // session is undefined when no session exists (signed out)
  // session is Session object when authenticated
  const isAuthenticated = auth.session !== undefined;

  return (
    <AuthContext.Provider value={auth}>
      <UserContext.Provider value={user}>
        <OnboardingContext.Provider value={onboarding}>
          <NavigationContainer theme={navTheme}>
            <Stack.Navigator
              initialRouteName={
                !isAuthenticated ? 'SignIn' : onboarding.hasOnboarded ? 'Main' : 'Onboarding'
              }
              screenOptions={{
                headerShadowVisible: false,
                headerStyle: { backgroundColor: palette.canvas },
                headerTitleStyle: { fontFamily: fonts.title, fontSize: 17 },
                headerTintColor: palette.ink,
                contentStyle: { backgroundColor: palette.canvas },
              }}
            >
              <Stack.Screen
                name="SignIn"
                component={SignInScreen}
                options={{ headerShown: false }}
              />
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
                options={{ headerShown: false }}
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
    </AuthContext.Provider>
  );
}
