import React from 'react';
import { Animated, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { RoutineStepCard } from '../data/onboardingRoutine';
import { palette } from '../theme';

type Props = {
  heading: string;
  icon: 'weather-sunny' | 'weather-night';
  steps: RoutineStepCard[];
  /** One driver per step, already windowed by the screen. */
  entries: Animated.AnimatedInterpolation<number>[];
  headerIn: Animated.AnimatedInterpolation<number> | Animated.Value;
  /** Whole-column opacity, so the half of the day not being shown can recede. */
  dim?: Animated.AnimatedInterpolation<number> | Animated.Value | number;
};

export function DayColumn({ heading, icon, steps, entries, headerIn, dim = 1 }: Props) {
  return (
    <Animated.View className="flex-1" style={{ opacity: dim }}>
      <Animated.View className="flex-row items-center gap-xs mb-lg" style={{ opacity: headerIn }}>
        <MaterialCommunityIcons name={icon} size={16} color={palette.accent} />
        <Text className="font-ui text-caption text-accent">{heading}</Text>
      </Animated.View>

      {steps.map((step, i) => (
        <Animated.View
          key={step.id}
          className="mb-xl"
          style={{
            opacity: entries[i],
            transform: [
              { translateY: entries[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
            ],
          }}
        >
          {/* No card, no border — the columns carry the structure, so the rows
              stay as plain type with a single accent tick. */}
          <View className="flex-row items-start">
            <View className="w-[5px] h-[5px] rounded-pill bg-accent mt-[8px] mr-sm" />
            <View className="flex-1">
              <Text className="font-ui text-label text-ink" numberOfLines={2}>
                {step.name}
              </Text>
              <Text className="font-body text-caption text-ink-faint mt-[2px]" numberOfLines={2}>
                {step.why}
              </Text>
            </View>
          </View>
        </Animated.View>
      ))}
    </Animated.View>
  );
}
