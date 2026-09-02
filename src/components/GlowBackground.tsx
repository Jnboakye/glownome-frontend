import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { glowGradient, glowLocations, mistGradient, mistLocations } from '../theme';

type Props = {
  children?: React.ReactNode;
  /** 'glow' is the full signature gradient (onboarding, scan). 'mist' is the quieter content variant. */
  variant?: 'glow' | 'mist';
};

export function GlowBackground({ children, variant = 'glow' }: Props) {
  const isGlow = variant === 'glow';
  return (
    <View className="flex-1">
      <LinearGradient
        colors={isGlow ? glowGradient : mistGradient}
        locations={isGlow ? glowLocations : mistLocations}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
