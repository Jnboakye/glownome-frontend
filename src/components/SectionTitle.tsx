import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

type Props = { title: string; trailing?: React.ReactNode };

export function SectionTitle({ title, trailing }: Props) {
  return (
    <View className="flex-row items-center justify-between mb-lg">
      <Text className="font-title text-heading text-ink">{title}</Text>
      {trailing}
    </View>
  );
}
