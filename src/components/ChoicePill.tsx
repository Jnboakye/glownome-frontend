import React from 'react';
import { View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 'stack' fills the row; 'wrap' hugs its label. */
  full?: boolean;
  /** Set when a multi-select has hit its cap and this one is not chosen. */
  disabled?: boolean;
};

export function ChoicePill({ label, selected, onPress, full, disabled }: Props) {
  return (
    <TouchableRipple
      onPress={disabled ? undefined : onPress}
      borderless
      rippleColor="rgba(124,92,255,0.12)"
      accessibilityRole="checkbox"
      accessibilityState={{ selected, disabled }}
      className={`rounded-pill ${full ? 'w-full' : ''}`}
    >
      <View
        className={`rounded-pill border-thick px-lg py-md ${
          selected ? 'bg-accent-soft border-accent' : 'bg-surface border-outline'
        } ${full ? 'w-full' : ''}`}
        style={disabled ? { opacity: 0.38 } : undefined}
      >
        <Text
          className={`font-ui text-label ${selected ? 'text-accent' : 'text-ink'}`}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableRipple>
  );
}
