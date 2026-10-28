import React from 'react';
import { View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { palette } from '../theme';

type Props = {
  title?: string;
  /** Override the default goBack — useful when replace() is the right exit. */
  onPress?: () => void;
};

/** The back row for stack screens that draw their own header (no native bar). */
export function BackBar({ title, onPress }: Props) {
  const navigation = useNavigation();
  return (
    <View className="flex-row items-center px-md pt-sm min-h-[48px]">
      <IconButton
        icon="chevron-left"
        size={26}
        iconColor={palette.ink}
        onPress={onPress ?? (() => navigation.goBack())}
        accessibilityLabel="Back"
        // Pull the hit target flush with the 26pt gutter used by screen titles.
        style={{ marginLeft: -4 }}
      />
      {title ? (
        <Text className="font-title text-heading text-ink flex-1 pr-md" numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}
