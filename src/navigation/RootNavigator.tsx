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
  // Always call hooks first - Rules of Hooks require consistent call order
  const auth = useAuthSession();
  const onboarding = useOnboarding();
  const storedName = useStoredName();
  const storedProfile = useStoredProfile();

  // Check Supabase configuration AFTER hooks
  const supabaseConfigured = isSupabaseConfigured();
  
  if (!supabaseConfigured) {
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

  // Debug: Log loading states
  console.log('[RootNavigator] Loading states:', {
    authLoading: auth.loading,
    onboardingLoading: onboarding.loading,
    userLoading: user.loading,
  });

  if (auth.loading || onboarding.loading || user.loading) {
    console.log('[RootNavigator] Still loading, showing spinner');
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={palette.ink} />
        {__DEV__ && (
          <Text style={{ marginTop: 10, fontSize: 11, color: palette.inkFaint }}>
            Loading auth state...
          </Text>
        )}
      </View>
    );
  }

  // Auth gate: show sign-in when not authenticated
  // session is null while loading
  // session is undefined when no session exists (signed out)
  // session is Session object when authenticated
  const isAuthenticated = auth.session !== undefined && auth.session !== null;

  // Debug logging for development
  console.log('[RootNavigator] Auth state:', {
    isAuthenticated,
    hasSession: !!auth.session,
    sessionType: typeof auth.session,
    sessionValue: auth.session === null ? 'null' : auth.session === undefined ? 'undefined' : 'object',
    hasOnboarded: onboarding.hasOnboarded,
    hasUserProfile: !!user.profile,
    userName: user.name,
  });

  return (
    <AuthContext.Provider value={auth}>
      <UserContext.Provider value={user}>
        <OnboardingContext.Provider value={onboarding}>
          {/* Dev-only debug indicator */}
          {__DEV__ && (
            <View
              style={{
                position: 'absolute',
                top: 50,
                left: 10,
                zIndex: 9999,
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 8,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: '#0f0', fontSize: 10, fontFamily: 'Courier' }}>
                Auth: {isAuthenticated ? 'YES' : 'NO'}
              </Text>
              <Text style={{ color: '#0f0', fontSize: 10, fontFamily: 'Courier' }}>
                Onboarded: {onboarding.hasOnboarded ? 'YES' : 'NO'}
              </Text>
            </View>
          )}
          <NavigationContainer theme={navTheme}>
            <Stack.Navigator
              screenOptions={{
                headerShadowVisible: false,
                headerStyle: { backgroundColor: palette.canvas },
                headerTitleStyle: { fontFamily: fonts.title, fontSize: 17 },
                headerTintColor: palette.ink,
                contentStyle: { backgroundColor: palette.canvas },
              }}
            >
              {!isAuthenticated ? (
                // Not authenticated: only show sign-in
                <Stack.Screen
                  name="SignIn"
                  component={SignInScreen}
                  options={{ headerShown: false }}
                />
              ) : !onboarding.hasOnboarded ? (
                // Authenticated but not onboarded: show onboarding flow
                <>
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
                </>
              ) : (
                // Authenticated and onboarded: show main app
                <>
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
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </OnboardingContext.Provider>
      </UserContext.Provider>
    </AuthContext.Provider>
  );
}
