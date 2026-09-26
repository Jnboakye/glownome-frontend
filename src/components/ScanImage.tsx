import React from 'react';
import { Image, View } from 'react-native';
import { Text } from 'react-native-paper';
import { shadow } from '../theme';

type Props = {
  uri: string;
  capturedAt: string;
};

/** Scans are 2D only, so the capture label is fixed. */
export function ScanImage({ uri, capturedAt }: Props) {
  const when = new Date(capturedAt);
  return (
    <View>
      <View className="rounded-xl overflow-hidden bg-sunk" style={shadow.card}>
        <Image source={{ uri }} className="w-full aspect-[3/4] max-h-[320px]" resizeMode="cover" />
      </View>
      <View className="flex-row items-center justify-between mt-md">
        <Text className="font-ui text-caption text-ink-faint">
          {`${when.toLocaleDateString()} · ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </Text>
        <Text className="font-ui text-caption text-ink-faint">2D SCAN</Text>
      </View>
    </View>
  );
}
