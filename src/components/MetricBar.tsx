import React from 'react';
import { DimensionValue, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SkinMetric } from '../api/types';
import { toneForScore } from '../theme';

export function MetricBar({ metric }: { metric: SkinMetric }) {
  const tone = toneForScore(metric.score);
  const width: DimensionValue = `${Math.max(4, Math.min(100, metric.score))}%`;

  return (
    <View className="mb-xl">
      <View className="flex-row justify-between mb-sm">
        <Text className="font-ui text-label text-ink">{metric.label}</Text>
        <Text className="font-ui text-label" style={{ color: tone.color }}>
          {metric.score}
        </Text>
      </View>
      <View className="h-[7px] rounded-pill bg-sunk overflow-hidden">
        {/* Width is data-driven, so it stays an inline style; the colour is a token class. */}
        <View className={`h-full rounded-pill ${tone.bar}`} style={{ width }} />
      </View>
      <Text className="font-body text-body-sm text-ink-faint mt-sm">{metric.note}</Text>
    </View>
  );
}
