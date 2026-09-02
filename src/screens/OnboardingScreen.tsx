import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GlowBackground, GlowBloom, PrimaryButton, TextLink } from '../components';
import { RootStackParamList } from '../navigation/types';
import { fonts, palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const WORDMARK = 'Glownome';
const TAGLINE = 'scan, track, glow';

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // One driver per element so they can be staggered independently. All of these
  // animate opacity or transform only, so every one runs on the native thread.
  const bloom = useRef(new Animated.Value(0)).current;
  const markIn = useRef(new Animated.Value(0)).current;
  const ruleIn = useRef(new Animated.Value(0)).current;
  const taglineIn = useRef(new Animated.Value(0)).current;
  const footerIn = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const settle = () => {
      // Skip straight to the resting state — the screen must never sit blank
      // for someone who has asked the system to reduce motion.
      [bloom, markIn, ruleIn, taglineIn, footerIn].forEach((v) => v.setValue(1));
    };

    const play = () => {
      Animated.parallel([
        Animated.timing(bloom, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(markIn, {
          toValue: 1,
          duration: 700,
          delay: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ruleIn, {
          toValue: 1,
          duration: 600,
          delay: 760,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(taglineIn, {
          toValue: 1,
          duration: 600,
          delay: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(footerIn, {
          toValue: 1,
          duration: 600,
          delay: 1250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (cancelled) return;
        // The bloom keeps breathing once everything has landed.
        Animated.loop(
          Animated.sequence([
            Animated.timing(breath, {
              toValue: 1,
              duration: 2800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(breath, {
              toValue: 0,
              duration: 2800,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ).start();
      });
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
  }, [bloom, breath, footerIn, markIn, ruleIn, taglineIn]);

  // "Get started" walks into the feature demo; "Skip" ends onboarding outright.
  const onStart = useCallback(() => {
    navigation.navigate('OnboardingScan');
  }, [navigation]);

  // Skipping the demo still has to pass through the promises screen — that is
  // where the terms are agreed to, so nothing may route around it.
  const skip = useCallback(() => {
    navigation.navigate('OnboardingPromise');
  }, [navigation]);

  // Intro and breathing multiply together so the bloom never jumps between them.
  const bloomScale = Animated.multiply(
    bloom.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }),
    reduceMotion ? 1 : breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }),
  );
  const bloomOpacity = Animated.multiply(
    bloom,
    reduceMotion ? 1 : breath.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
  );

  const rise = (driver: Animated.Value, distance: number) => ({
    opacity: driver,
    transform: [
      { translateY: driver.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
    ],
  });

  return (
    <GlowBackground>
      <StatusBar style="dark" />
      <View className="flex-1">
        {/* The logotype sits in the optical centre of the screen. */}
        <View className="flex-1 items-center justify-center px-gutter">
          <GlowBloom scale={bloomScale} opacity={bloomOpacity} />

          <Animated.Text
            accessibilityRole="header"
            style={[
              {
                fontFamily: fonts.wordmark,
                fontSize: 46,
                lineHeight: 56,
                letterSpacing: -1.6,
                color: palette.ink,
              },
              rise(markIn, 14),
            ]}
          >
            {WORDMARK}
          </Animated.Text>

          <Animated.View
            className="rounded-pill bg-accent"
            style={{
              width: 44,
              height: 1.5,
              marginTop: 18,
              marginBottom: 18,
              opacity: ruleIn,
              transform: [{ scaleX: ruleIn }],
            }}
          />

          <Animated.Text
            style={[
              {
                fontFamily: fonts.ui,
                fontSize: 15,
                lineHeight: 22,
                letterSpacing: 2.2,
                color: palette.inkSoft,
              },
              rise(taglineIn, 8),
            ]}
          >
            {TAGLINE}
          </Animated.Text>
        </View>

        <Animated.View
          className="px-gutter"
          style={[{ paddingBottom: insets.bottom + 28 }, { opacity: footerIn }]}
        >
          <PrimaryButton label="Get started" onPress={onStart} />
          <View className="h-[44px] justify-center">
            <TextLink label="Skip" onPress={skip} />
          </View>
        </Animated.View>
      </View>
    </GlowBackground>
  );
}
