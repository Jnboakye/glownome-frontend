import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { palette } from '../theme';

type Props = {
  icon: string;
  title: string;
  body: string;
  action?: React.ReactNode;
};

/**
 * The honest state. Used wherever a screen has nothing real to show yet —
 * better than sample data, which teaches the user something untrue about
 * their own skin.
 */
export function EmptyState({ icon, title, body, action }: Props) {
  return (
    <View className="items-center px-gutter py-3xl">
      <View className="w-[52px] h-[52px] rounded-pill bg-accent-soft items-center justify-center">
        <MaterialCommunityIcons name={icon as never} size={24} color={palette.accent} />
      </View>
      <Text className="font-title text-heading text-ink mt-lg text-center">{title}</Text>
      <Text className="font-body text-body-sm text-ink-faint mt-xs text-center max-w-[300px]">
        {body}
      </Text>
      {action ? <View className="mt-xl w-full max-w-[300px]">{action}</View> : null}
    </View>
  );
}
