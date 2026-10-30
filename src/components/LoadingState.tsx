import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Text } from 'react-native-paper';
import { palette } from '../theme';

type Props = {
  /** Short status line. Prefer present continuous ("Reading your skin…"). */
  title?: string;
  body?: string;
  /** Fill the screen (default) or sit inline inside a scroll area. */
  fill?: boolean;
};

/**
 * Shared loading chrome — same spinner, same type, same quiet copy.
 * Empty screens use EmptyState; this is the "we're working" twin.
 */
export function LoadingState({ title, body, fill = true }: Props) {
  return (
    <View className={`items-center justify-center px-gutter ${fill ? 'flex-1' : 'py-3xl'}`}>
      <ActivityIndicator color={palette.ink} />
      {title ? (
        <Text className="font-ui text-subheading text-ink mt-lg text-center">{title}</Text>
      ) : null}
      {body ? (
        <Text className="font-body text-body-sm text-ink-faint mt-xs text-center max-w-[280px]">
          {body}
        </Text>
      ) : null}
    </View>
  );
}
