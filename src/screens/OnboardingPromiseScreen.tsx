import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Linking, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GlowBackground, PrimaryButton, PromiseRow } from '../components';
import { RootStackParamList } from '../navigation/types';
import { LEGAL_LINKS, PROMISES } from '../data/onboardingPromises';
import { palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingPromise'>;

const TITLE = 'three promises';
const SUBTITLE = 'before your first scan';

const CLOCK = 2200;

/** Each row's window on the shared clock, plus the rule that draws under it. */
const W = {
  row: (i: number) => [0.04 + i * 0.16, 0.28 + i * 0.16],
  rule: (i: number) => [0.2 + i * 0.16, 0.36 + i * 0.16],
  footer: [0.74, 0.94],
} as const;

export function OnboardingPromiseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [, setReduceMotion] = useState(false);

  const headIn = useRef(new Animated.Value(0)).current;
  const clock = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const settle = () => {
      headIn.setValue(1);
      clock.setValue(1);
    };

    const play = () => {
      Animated.parallel([
        Animated.timing(headIn, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(clock, {
          toValue: 1,
          duration: CLOCK,
          delay: 280,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (cancelled) return;
        setReduceMotion(enabled);
        if (enabled) settle();
        else play();
      })
      .catch(() => {
        if (!cancelled) play();
      });

    return () => {
      cancelled = true;
    };
  }, [clock, headIn]);

  // Agreeing to the terms carries on to the name; onboarding completes there.
  const start = useCallback(() => {
    navigation.navigate('OnboardingName');
  }, [navigation]);

  const win = (range: readonly [number, number]) =>
    clock.interpolate({
      inputRange: [range[0], range[1]],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

  return (
    <GlowBackground>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={['top']}>
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

        <Animated.View
          className="px-gutter mt-lg"
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

        <View className="flex-1 justify-center px-gutter">
          {PROMISES.map((promise, i) => (
            <PromiseRow
              key={promise.id}
              promise={promise}
              enter={win(W.row(i) as [number, number])}
              rule={i < PROMISES.length - 1 ? win(W.rule(i) as [number, number]) : undefined}
            />
          ))}
        </View>

        <Animated.View
          className="px-gutter"
          style={{ paddingBottom: insets.bottom + 20, opacity: win(W.footer) }}
        >
          <Text className="font-body text-body-sm text-ink-faint text-center mb-md">
            By continuing you agree to our{' '}
            <Text
              className="underline text-ink-soft"
              accessibilityRole="link"
              onPress={() => void Linking.openURL(LEGAL_LINKS.terms)}
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              className="underline text-ink-soft"
              accessibilityRole="link"
              onPress={() => void Linking.openURL(LEGAL_LINKS.privacy)}
            >
              Privacy Policy
            </Text>
            .
          </Text>
          <PrimaryButton label="Continue" onPress={start} />
        </Animated.View>
      </SafeAreaView>
    </GlowBackground>
  );
}
