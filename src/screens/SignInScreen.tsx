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
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Debug: Confirm this screen is mounted
  console.log('[SignInScreen] Mounted/Rendered', { isSignUp, email, loading });

  // Log the redirect URI for development - owner needs to add this to Supabase
  useEffect(() => {
    const redirectUri = makeRedirectUri({
      path: 'auth/callback',
    });
    console.log('[SignInScreen] OAuth Redirect URI:', redirectUri);
    console.log('[SignInScreen] Add this to Supabase Dashboard -> Authentication -> Redirect URLs');
    
    // Show on screen for easy copying
    if (__DEV__) {
      setDebugInfo(`Redirect URI:\n${redirectUri}\n\nAdd to Supabase:\nexp://**\nglownome://**`);
    }
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
    
    // Diagnostic info to show on screen
    let diagnostic = '';
    
    try {
      // Step 1: Get redirect URI
      const redirectTo = makeRedirectUri({
        path: 'auth/callback',
      });
      
      diagnostic += `Step 1: Redirect URI\n${redirectTo}\n\n`;
      console.log('[SignInScreen] Step 1 - Redirect URI:', redirectTo);
      setDebugInfo(diagnostic);

      // Step 2: Request OAuth URL from Supabase
      diagnostic += 'Step 2: Requesting OAuth URL from Supabase...\n';
      setDebugInfo(diagnostic);
      console.log('[SignInScreen] Step 2 - Calling signInWithOAuth');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        diagnostic += `❌ Supabase error: ${error.message}\n`;
        setDebugInfo(diagnostic);
        throw error;
      }

      if (!data?.url) {
        diagnostic += '❌ No OAuth URL returned\n';
        setDebugInfo(diagnostic);
        throw new Error('No OAuth URL returned from Supabase');
      }

      // Show OAuth URL host (not full URL with keys)
      const oauthHost = new URL(data.url).host;
      diagnostic += `✅ Got OAuth URL from: ${oauthHost}\n\n`;
      diagnostic += 'Step 3: Opening browser...\n';
      setDebugInfo(diagnostic);
      console.log('[SignInScreen] Step 3 - Opening browser, OAuth host:', oauthHost);

      // Step 3: Warm up browser for iOS (helps prevent immediate dismissal)
      await WebBrowser.warmUpAsync();
      
      // Open the OAuth URL in an in-app browser
      console.log('[SignInScreen] Calling openAuthSessionAsync');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
        preferEphemeralSession: true, // Don't persist cookies across sessions
      });

      console.log('[SignInScreen] Browser result:', JSON.stringify(result, null, 2));
      diagnostic += `Browser result type: ${result.type}\n`;
      
      if ('url' in result && result.url) {
        diagnostic += `Result URL: ${result.url.substring(0, 50)}...\n`;
      }
      
      setDebugInfo(diagnostic);

      if (result.type === 'success' && 'url' in result) {
        diagnostic += '\nStep 4: Parsing callback URL...\n';
        setDebugInfo(diagnostic);
        console.log('[SignInScreen] Step 4 - Parsing result URL:', result.url);
        
        // Parse URL carefully - new URL() can be problematic in React Native
        const url = result.url;
        let code: string | null = null;
        
        // Try to extract code from query string
        const queryMatch = url.match(/[?&]code=([^&#]+)/);
        if (queryMatch) {
          code = queryMatch[1];
          console.log('[SignInScreen] Extracted code from query string');
        }
        
        if (code) {
          diagnostic += `✅ Got auth code: ${code.substring(0, 10)}...\n\n`;
          diagnostic += 'Step 5: Exchanging code for session...\n';
          setDebugInfo(diagnostic);
          console.log('[SignInScreen] Step 5 - Exchanging code for session');
          
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) {
            diagnostic += `❌ Session error: ${sessionError.message}\n`;
            setDebugInfo(diagnostic);
            throw sessionError;
          }
          
          diagnostic += '✅ Sign-in successful!\n';
          setDebugInfo(diagnostic);
          console.log('[SignInScreen] Google Sign-In successful');
          
          // Show success briefly
          Alert.alert('Success', 'Signed in with Google!');
        } else {
          // Try fragment parsing (implicit flow)
          const fragmentMatch = url.match(/#(.+)/);
          if (fragmentMatch) {
            const fragment = fragmentMatch[1];
            const params = new URLSearchParams(fragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken) {
              diagnostic += '✅ Got access token (implicit flow)\n';
              setDebugInfo(diagnostic);
              console.log('[SignInScreen] Using implicit flow tokens');
              
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              });
              
              if (sessionError) throw sessionError;
              
              Alert.alert('Success', 'Signed in with Google!');
            } else {
              diagnostic += '❌ No code or tokens in URL\n';
              setDebugInfo(diagnostic);
              throw new Error('No authentication code or tokens found in redirect URL');
            }
          } else {
            diagnostic += '❌ No code or tokens found\n';
            setDebugInfo(diagnostic);
            throw new Error('Could not parse authentication response');
          }
        }
      } else if (result.type === 'cancel') {
        diagnostic += '⚠️ User cancelled\n';
        setDebugInfo(diagnostic);
        console.log('[SignInScreen] User cancelled');
        Alert.alert('Cancelled', 'Google Sign-In was cancelled');
      } else if (result.type === 'dismiss') {
        diagnostic += '⚠️ Browser dismissed\n';
        setDebugInfo(diagnostic);
        console.log('[SignInScreen] Browser dismissed');
        Alert.alert('Dismissed', 'Sign-in browser was dismissed');
      } else if (result.type === 'locked') {
        diagnostic += '⚠️ Browser locked\n';
        setDebugInfo(diagnostic);
        console.log('[SignInScreen] Browser locked');
        Alert.alert('Error', 'Another browser is already open');
      } else {
        diagnostic += `❌ Unexpected result: ${result.type}\n`;
        setDebugInfo(diagnostic);
        throw new Error(`Unexpected browser result: ${result.type}`);
      }
    } catch (error: unknown) {
      console.error('[SignInScreen] Google Sign-In error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      diagnostic += `\n❌ ERROR: ${errorMsg}\n`;
      setDebugInfo(diagnostic);
      
      Alert.alert(
        'Google Sign-In Failed',
        `${errorMsg}\n\nCheck debug info below for details.`,
      );
    } finally {
      setLoading(false);
      // Cool down browser
      WebBrowser.coolDownAsync();
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

              {/* Debug info display - only in dev mode */}
              {__DEV__ && debugInfo && (
                <View className="mt-lg bg-surface border border-outline rounded-lg p-md">
                  <Text className="font-mono text-[10px] text-ink" style={{ fontFamily: 'Courier' }}>
                    {debugInfo}
                  </Text>
                </View>
              )}

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
