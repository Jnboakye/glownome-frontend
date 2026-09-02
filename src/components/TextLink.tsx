import React from 'react';
import { Text, TouchableRipple } from 'react-native-paper';

type Props = {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'muted' | 'accent';
};

const TONE = {
  default: 'text-ink-soft',
  muted: 'text-ink-faint',
  accent: 'text-accent',
} as const;

export function TextLink({ label, onPress, tone = 'default' }: Props) {
  return (
    <TouchableRipple
      onPress={onPress}
      borderless
      rippleColor="rgba(19,19,22,0.06)"
      className="self-center px-lg py-sm"
    >
      <Text className={`font-ui text-label text-center underline ${TONE[tone]}`}>{label}</Text>
    </TouchableRipple>
  );
}
