import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { DayColumn, GlowBackground, PrimaryButton } from '../components';
import { RootStackParamList } from '../navigation/types';
import { ROUTINE_RULE, morningSteps, nightSteps } from '../data/onboardingRoutine';
import { palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingRoutine'>;

const TITLE = 'build a routine';
const SUBTITLE = 'four steps, split across your day';

const MORNING = morningSteps();
const NIGHT = nightSteps();

/**
 * One 0→1 clock; every element reads a window of it. The clock is LINEAR on
 * purpose — with this many beats, an eased clock would stretch the late ones
 * unpredictably, and each window is short enough that linear motion reads fine.
 *
 * The sequence walks through a day: morning fills, the divider draws, morning
 * recedes while night fills, then both come back up together and the rule lands.
 */
const CLOCK = 3200;

const W = {
  morningHeader: [0, 0.1],
  morningStep: (i: number) => [0.04 + i * 0.05, 0.2 + i * 0.05],
  divider: [0.3, 0.42],
  nightHeader: [0.38, 0.48],
  nightStep: (i: number) => [0.42 + i * 0.05, 0.58 + i * 0.05],
  rule: [0.86, 1],
} as const;

/** Morning holds, recedes while night is filling, then returns for the finale. */
const MORNING_DIM = {
  inputRange: [0, 0.34, 0.46, 0.72, 0.84],
  outputRange: [1, 1, 0.32, 0.32, 1],
} as const;

/** Night starts absent, arrives with its steps, and stays up. */
const NIGHT_DIM = {
  inputRange: [0, 0.36, 0.48],
  outputRange: [0.32, 0.32, 1],
} as const;

export function OnboardingRoutineScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [, setReduceMotion] = useState(false);

  const headIn = useRef(new Animated.Value(0)).current;
  const day = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const settle = () => {
      headIn.setValue(1);
      day.setValue(1);
    };

    const play = () => {
      Animated.parallel([
        Animated.timing(headIn, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(day, {
          toValue: 1,
          duration: CLOCK,
          delay: 320,
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
  }, [day, headIn]);

  const onNext = useCallback(() => {
    navigation.navigate('OnboardingPromise');
  }, [navigation]);

  const win = (range: readonly [number, number]) =>
    day.interpolate({ inputRange: [range[0], range[1]], outputRange: [0, 1], extrapolate: 'clamp' });

  const morningDim = day.interpolate({
    inputRange: [...MORNING_DIM.inputRange],
    outputRange: [...MORNING_DIM.outputRange],
    extrapolate: 'clamp',
  });
  const nightDim = day.interpolate({
    inputRange: [...NIGHT_DIM.inputRange],
    outputRange: [...NIGHT_DIM.outputRange],
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
          <View className="flex-row">
            <DayColumn
              heading="MORNING"
              icon="weather-sunny"
              steps={MORNING}
              headerIn={win(W.morningHeader)}
              entries={MORNING.map((_, i) => win(W.morningStep(i) as [number, number]))}
              dim={morningDim}
            />

            {/* The divider draws downward between the two halves of the day. */}
            <Animated.View
              className="w-[1px] bg-outline mx-lg"
              style={{
                opacity: win(W.divider),
                transform: [{ scaleY: win(W.divider) }],
              }}
            />

            <DayColumn
              heading="NIGHT"
              icon="weather-night"
              steps={NIGHT}
              headerIn={win(W.nightHeader)}
              entries={NIGHT.map((_, i) => win(W.nightStep(i) as [number, number]))}
              dim={nightDim}
            />
          </View>

          <Animated.View
            className="mt-2xl border-t-hairline border-outline pt-lg"
            style={{ opacity: win(W.rule) }}
          >
            <Text className="font-body text-body-sm text-ink-soft text-center">
              {ROUTINE_RULE}
            </Text>
          </Animated.View>
        </View>

        <View className="px-gutter" style={{ paddingBottom: insets.bottom + 20 }}>
          {/* Last demo screen — there is nothing left to skip past. */}
          <PrimaryButton label="Next" onPress={onNext} />
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}
