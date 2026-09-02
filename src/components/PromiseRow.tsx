import React from 'react';
import { Animated, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { OnboardingPromise } from '../data/onboardingPromises';
import { palette } from '../theme';

type Props = {
  promise: OnboardingPromise;
  /** 0→1 entrance for the row's copy and mark. */
  enter: Animated.AnimatedInterpolation<number>;
  /** 0→1 for the hairline that draws in underneath. Omitted on the last row. */
  rule?: Animated.AnimatedInterpolation<number>;
};

export function PromiseRow({ promise, enter, rule }: Props) {
  return (
    <View>
      <Animated.View
        className="flex-row items-start py-lg"
        style={{
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          ],
        }}
      >
        {/* A tinted disc rather than an illustration — it keeps the row quiet
            and needs no image assets. */}
        <View className="w-[38px] h-[38px] rounded-pill bg-accent-soft items-center justify-center mr-lg">
          <MaterialCommunityIcons name={promise.icon as never} size={19} color={palette.accent} />
        </View>

        <View className="flex-1">
          <Text className="font-title text-subheading text-ink">{promise.claim}</Text>
          <Text className="font-body text-body-sm text-ink-faint mt-[3px]">{promise.proof}</Text>
        </View>
      </Animated.View>

      {rule ? (
        <Animated.View
          className="h-[1px] bg-outline"
          // Draws outward from the left as the row settles.
          style={{ opacity: rule, transform: [{ scaleX: rule }] }}
        />
      ) : null}
    </View>
  );
}
