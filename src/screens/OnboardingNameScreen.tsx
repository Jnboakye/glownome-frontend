import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
} from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GlowBackground, PrimaryButton, TextLink } from '../components';
import { RootStackParamList } from '../navigation/types';
import { useUser } from '../hooks/userContext';
import { fonts, palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingName'>;

const TITLE = 'what should we call you?';
const SUBTITLE = 'a first name is plenty';

export function OnboardingNameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { setName } = useUser();

  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const headIn = useRef(new Animated.Value(0)).current;
  const fieldIn = useRef(new Animated.Value(0)).current;
  // The accent underline grows out from the left when the field takes focus.
  const underline = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const settle = () => {
      headIn.setValue(1);
      fieldIn.setValue(1);
    };

    const play = () => {
      Animated.stagger(160, [
        Animated.timing(headIn, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fieldIn, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (cancelled) return;
        if (enabled) settle();
        else play();
      })
      .catch(() => {
        if (!cancelled) play();
      });

    // Opening the keyboard straight away saves a tap on the one field here.
    const focus = setTimeout(() => inputRef.current?.focus(), 620);

    return () => {
      cancelled = true;
      clearTimeout(focus);
    };
  }, [fieldIn, headIn]);

  useEffect(() => {
    Animated.timing(underline, {
      toValue: focused ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focused, underline]);

  const ready = value.trim().length > 0;

  // Onboarding completes at the end of the profile wizard, not here.
  const next = useCallback(
    async (withName: boolean) => {
      if (withName) await setName(value);
      navigation.navigate('OnboardingProfile');
    },
    [navigation, setName, value],
  );

  return (
    <GlowBackground>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="px-gutter pt-sm">
            <IconButton
              icon="chevron-left"
              size={26}
              iconColor={palette.ink}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Back"
              style={{ marginLeft: -10 }}
            />
          </View>

          <View className="flex-1 justify-center px-gutter">
            <Animated.View
              style={{
                opacity: headIn,
                transform: [
                  { translateY: headIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                ],
              }}
            >
              <Text className="font-display text-display text-ink">{TITLE}</Text>
              <Text className="font-ui text-subheading text-ink-soft mt-xs">{SUBTITLE}</Text>
            </Animated.View>

            <Animated.View
              className="mt-3xl"
              style={{
                opacity: fieldIn,
                transform: [
                  { translateY: fieldIn.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                ],
              }}
            >
              {/*
                React Native's own TextInput rather than Paper's: Paper's carries
                an MD3 filled background and floating label, and stripping those
                back to a bare rule fights the component instead of using it.
              */}
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={setValue}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={() => ready && void next(true)}
                placeholder="Your name"
                placeholderTextColor={palette.inkFaint}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                textContentType="givenName"
                returnKeyType="done"
                maxLength={40}
                accessibilityLabel="Your name"
                style={{
                  fontFamily: fonts.title,
                  fontSize: 28,
                  lineHeight: 34,
                  letterSpacing: -0.4,
                  color: palette.ink,
                  paddingVertical: 10,
                }}
              />
              <View className="h-[1px] bg-outline-strong" />
              <Animated.View
                className="h-[2px] bg-accent -mt-[1px]"
                style={{ opacity: underline, transform: [{ scaleX: underline }] }}
              />
            </Animated.View>
          </View>

          <View className="px-gutter" style={{ paddingBottom: insets.bottom + 20 }}>
            <PrimaryButton
              label="Continue"
              onPress={() => void next(true)}
              disabled={!ready}
            />
            <View className="h-[44px] justify-center">
              <TextLink label="Skip for now" tone="muted" onPress={() => void next(false)} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GlowBackground>
  );
}
