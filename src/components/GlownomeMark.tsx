import React from 'react';
import { Animated, View } from 'react-native';
import { palette } from '../theme';

/**
 * The soft lilac bloom behind the logotype.
 *
 * React Native has no radial gradient, so this is four concentric circles with
 * decreasing size and increasing opacity — stacked, they read as a single soft
 * falloff. Cheap, no extra dependency, and it animates on the native thread
 * because only transform and opacity change.
 */
const RINGS = [
  { size: 340, opacity: 0.05 },
  { size: 260, opacity: 0.055 },
  { size: 180, opacity: 0.06 },
  { size: 110, opacity: 0.07 },
];

type Props = {
  /** Combined intro + breathing scale. */
  scale: Animated.AnimatedInterpolation<number> | Animated.Value;
  /** Combined intro + breathing opacity. */
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value;
};

export function GlowBloom({ scale, opacity }: Props) {
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute items-center justify-center"
      style={{ opacity, transform: [{ scale }] }}
    >
      {RINGS.map((ring) => (
        <View
          key={ring.size}
          className="absolute rounded-pill"
          style={{
            width: ring.size,
            height: ring.size,
            backgroundColor: palette.accent,
            opacity: ring.opacity,
          }}
        />
      ))}
    </Animated.View>
  );
}
