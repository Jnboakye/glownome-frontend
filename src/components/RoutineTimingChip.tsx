import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RoutineTiming } from '../data/onboardingScan';
import { palette } from '../theme';

const LABEL: Record<RoutineTiming, string> = {
  morning: 'Use in the morning',
  night: 'Use at night',
  both: 'Use morning and night',
};

/**
 * Sun / moon instead of "AM & PM".
 *
 * A product used twice a day shows both icons and they trade brightness on a
 * slow loop — sun, then moon, then sun — so "twice daily" reads as a rhythm
 * rather than as two static glyphs. Single-timing chips stay still; a lone
 * pulsing icon would suggest something is happening that isn't.
 */
export function RoutineTimingChip({ timing }: { timing: RoutineTiming }) {
  const showSun = timing === 'morning' || timing === 'both';
  const showMoon = timing === 'night' || timing === 'both';
  const alternate = timing === 'both';

  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!alternate) return undefined;
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled || reduced) return;
        Animated.loop(
          Animated.sequence([
            Animated.delay(700),
            Animated.timing(beat, {
              toValue: 1,
              duration: 650,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(700),
            Animated.timing(beat, {
              toValue: 0,
              duration: 650,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ).start();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [alternate, beat]);

  const sunOpacity = alternate
    ? beat.interpolate({ inputRange: [0, 1], outputRange: [1, 0.22] })
    : 1;
  const moonOpacity = alternate
    ? beat.interpolate({ inputRange: [0, 1], outputRange: [0.22, 1] })
    : 1;

  return (
    <View
      accessible
      accessibilityLabel={LABEL[timing]}
      className="flex-row items-center gap-xs border-hairline border-outline rounded-pill px-md py-[4px]"
    >
      {showSun ? (
        <Animated.View style={{ opacity: sunOpacity }}>
          <MaterialCommunityIcons name="weather-sunny" size={14} color={palette.inkSoft} />
        </Animated.View>
      ) : null}
      {showMoon ? (
        <Animated.View style={{ opacity: moonOpacity }}>
          <MaterialCommunityIcons name="weather-night" size={14} color={palette.inkSoft} />
        </Animated.View>
      ) : null}
    </View>
  );
}
