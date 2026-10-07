import React from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { palette } from '../theme';

/** The back row for stack screens that draw their own header (no native bar). */
export function BackBar({ title }: { title?: string }) {
  const navigation = useNavigation();
  return (
    <View className="flex-row items-center px-md pt-sm">
      <IconButton
        icon="chevron-left"
        size={26}
        iconColor={palette.ink}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Back"
      />
      {title ? <Text className="font-title text-heading text-ink">{title}</Text> : null}
    </View>
  );
}
