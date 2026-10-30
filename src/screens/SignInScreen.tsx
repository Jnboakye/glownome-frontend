import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { GlowBackground, PrimaryButton } from '../components';
import { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabase';
import { fonts, palette } from '../theme';

// Complete the OAuth session in Expo Go when the browser returns
WebBrowser.maybeCompleteAuthSession();

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Sign in with email + password or Google.
 *
 * Email + password works immediately in Expo Go with no extra setup. Google
 * Sign-In uses Supabase's OAuth flow, which works in Expo Go but requires
 * redirect URL configuration in the Supabase dashboard.
 *
 * Apple Sign-In is deferred until there's an Apple Developer account.
 */
export function SignInScreen() {
  const navigation = useNavigation<Nav>();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Debug: Confirm this screen is mounted
  console.log('[SignInScreen] Mounted/Rendered', { isSignUp, email, loading });

  // Log the redirect URI for development - owner needs to add this to Supabase
  useEffect(() => {
    const redirectUri = makeRedirectUri({
      path: 'auth/callback',
    });
    console.log('[SignInScreen] OAuth Redirect URI:', redirectUri);
    console.log('[SignInScreen] Add this to Supabase Dashboard -> Authentication -> Redirect URLs');
  }, []);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    if (supabase === null) {
      Alert.alert('Configuration Error', 'Supabase is not configured. Check your .env file.');
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (error) throw error;

      if (isSignUp) {
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Click it to verify your account, then sign in.',
        );
        setIsSignUp(false);
      }
    } catch (error: unknown) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (supabase === null) {
      Alert.alert('Configuration Error', 'Supabase is not configured. Check your .env file.');
      return;
    }

    setLoading(true);
    try {
      // Get the proper redirect URI (exp:// in Expo Go, glownome:// in builds)
      const redirectTo = makeRedirectUri({
        path: 'auth/callback',
      });

      console.log('[SignInScreen] Starting Google OAuth with redirect:', redirectTo);

      // Request OAuth URL from Supabase (doesn't open browser automatically in RN)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // We'll handle the browser ourselves
        },
      });

      if (error) throw error;

      if (!data?.url) {
        throw new Error('No OAuth URL returned from Supabase');
      }

      console.log('[SignInScreen] Opening OAuth URL in browser');

      // Open the OAuth URL in an in-app browser
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      console.log('[SignInScreen] Browser result:', result.type);

      if (result.type === 'success') {
        const url = result.url;
        
        // Parse the returned URL for auth data
        const urlParams = new URL(url);
        
        // Check for OAuth code (PKCE flow)
        const code = urlParams.searchParams.get('code');
        
        if (code) {
          console.log('[SignInScreen] Exchanging code for session');
          
          // Exchange the code for a session
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) throw sessionError;
          
          console.log('[SignInScreen] Google Sign-In successful (code flow)');
        } else {
          // Check for tokens in the fragment (implicit flow - deprecated but handle it)
          const params = new URLSearchParams(url.split('#')[1] || '');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken) {
            console.log('[SignInScreen] Setting session from tokens');
            
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (sessionError) throw sessionError;
            
            console.log('[SignInScreen] Google Sign-In successful (token flow)');
          } else {
            throw new Error('No authentication code or tokens found in redirect URL');
          }
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('[SignInScreen] User cancelled Google Sign-In');
        // User cancelled - don't show an error, just return
        return;
      } else {
        throw new Error(`Unexpected browser result: ${result.type}`);
      }
    } catch (error: unknown) {
      console.error('[SignInScreen] Google Sign-In error:', error);
      Alert.alert(
        'Google Sign-In failed',
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlowBackground variant="glow">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerClassName="flex-1 px-gutter justify-center"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center mb-2xl">
              <Text className="text-[48px] text-accent mb-sm" style={{ fontFamily: fonts.title }}>
                Glownome
              </Text>
              <Text className="font-title text-[28px] text-ink">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </Text>
              <Text className="font-body text-body text-ink-faint mt-xs text-center">
                {isSignUp
                  ? 'Sign up to track your skin journey'
                  : 'Sign in to continue your skin journey'}
              </Text>
            </View>

            <View className="mb-xl">
              <Text className="font-ui text-label text-ink mb-xs">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={palette.inkFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                className="font-body text-body text-ink bg-surface border border-outline rounded-lg px-md py-sm mb-lg"
              />

              <Text className="font-ui text-label text-ink mb-xs">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                placeholderTextColor={palette.inkFaint}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                className="font-body text-body text-ink bg-surface border border-outline rounded-lg px-md py-sm mb-lg"
              />

              <PrimaryButton
                label={isSignUp ? 'Create account' : 'Sign in'}
                onPress={() => void handleEmailAuth()}
                disabled={loading}
              />

              <TouchableOpacity
                onPress={() => setIsSignUp(!isSignUp)}
                disabled={loading}
                className="mt-md"
              >
                <Text className="font-body text-body text-ink-faint text-center">
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <Text className="text-accent">
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View className="items-center mb-xl">
              <View className="flex-row items-center w-full mb-lg">
                <View className="flex-1 h-[1px] bg-outline" />
                <Text className="font-body text-body-sm text-ink-faint mx-md">or</Text>
                <View className="flex-1 h-[1px] bg-outline" />
              </View>

              <TouchableOpacity
                onPress={() => void handleGoogleSignIn()}
                disabled={loading}
                className="flex-row items-center justify-center bg-surface border border-outline rounded-lg px-lg py-sm w-full"
              >
                <MaterialCommunityIcons name="google" size={20} color={palette.ink} />
                <Text className="font-ui text-label text-ink ml-sm">Continue with Google</Text>
              </TouchableOpacity>

              {/* Placeholder for Apple Sign-In, disabled for now */}
              <View className="mt-md w-full opacity-40">
                <View className="flex-row items-center justify-center bg-surface border border-outline rounded-lg px-lg py-sm">
                  <MaterialCommunityIcons name="apple" size={20} color={palette.ink} />
                  <Text className="font-ui text-label text-ink ml-sm">
                    Sign in with Apple (coming soon)
                  </Text>
                </View>
              </View>
            </View>

            {loading && (
              <View className="items-center mt-lg">
                <ActivityIndicator color={palette.ink} />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlowBackground>
  );
}
