import React from 'react';
import { Image, View } from 'react-native';
import { Text } from 'react-native-paper';
import { shadow } from '../theme';

type Props = {
  uri: string;
  capturedAt: string;
  /** '2d-guided' | '3d-depth' — shown so the user knows what was captured. */
  mode: string;
};

export function ScanImage({ uri, capturedAt, mode }: Props) {
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
        <Text className="font-ui text-caption text-ink-faint">
          {mode === '3d-depth' ? '3D DEPTH' : '2D SCAN'}
        </Text>
      </View>
    </View>
  );
}
