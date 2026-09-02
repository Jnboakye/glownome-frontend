import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <View className="px-gutter pt-sm pb-xl">
      {eyebrow ? (
        <Text className="font-ui text-caption text-accent mb-sm">{eyebrow.toUpperCase()}</Text>
      ) : null}
      <Text className="font-title text-title text-ink">{title}</Text>
      {subtitle ? (
        <Text className="font-body text-body text-ink-soft mt-sm max-w-[320px]">{subtitle}</Text>
      ) : null}
    </View>
  );
}
