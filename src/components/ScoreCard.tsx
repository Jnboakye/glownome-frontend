import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { interpretationForScore, toneForScore } from '../theme';

type Props = { score: number };

/**
 * The score, its band colour and its sentence, all derived from one number so
 * they cannot drift apart. Colour is never the only signal — the words carry
 * the same meaning for anyone who cannot distinguish the bands.
 */
export function ScoreCard({ score }: Props) {
  const tone = toneForScore(score);

  return (
    <View className={`rounded-xl p-2xl ${tone.soft}`}>
      <Text className="font-ui text-caption text-ink-faint">SKIN SCORE</Text>

      <View className="flex-row items-end mt-sm">
        <Text
          className="font-display text-[56px] leading-[62px] tracking-[-2px]"
          style={{ color: tone.color }}
        >
          {score}
        </Text>
        <Text className="font-ui text-label text-ink-faint mb-md ml-xs">/100</Text>
      </View>

      <Text className="font-title text-subheading mt-xs" style={{ color: tone.color }}>
        {interpretationForScore(score)}
      </Text>

      <View className="h-[6px] rounded-pill bg-ink/10 overflow-hidden mt-lg">
        <View className={`h-full rounded-pill ${tone.bar}`} style={{ width: `${score}%` }} />
      </View>
    </View>
  );
}
