import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { toneForScore } from '../theme';

type Props = { score: number; caption?: string };

/**
 * A calm, ring-free score readout — a large number over a thin progress track.
 * Avoids pulling in an SVG dependency while still reading as a "score".
 */
export function ScoreDial({ score, caption }: Props) {
  const tone = toneForScore(score);

  return (
    <View className={`rounded-xl p-2xl ${tone.soft}`}>
      <View className="flex-row items-end">
        <Text
          className="font-display text-[56px] leading-[62px] tracking-[-2px]"
          style={{ color: tone.color }}
        >
          {score}
        </Text>
        <Text className="font-ui text-label text-ink-faint mb-md ml-xs">/100</Text>
      </View>
      <Text className="font-ui text-caption" style={{ color: tone.color }}>
        {tone.label.toUpperCase()}
      </Text>
      <View className="h-[6px] rounded-pill bg-ink/10 overflow-hidden mt-lg">
        <View className={`h-full rounded-pill ${tone.bar}`} style={{ width: `${score}%` }} />
      </View>
      {caption ? (
        <Text className="font-body text-body-sm text-ink-soft mt-md">{caption}</Text>
      ) : null}
    </View>
  );
}
