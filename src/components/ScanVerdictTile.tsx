import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScanDemoCard } from '../data/onboardingScan';
import { RoutineTimingChip } from './RoutineTimingChip';
import { shadow, toneForScore } from '../theme';

/** Uniform, so the two columns stay in step with each other. */
export const TILE_HEIGHT = 128;

type Props = {
  card: ScanDemoCard;
  /** Native-driven 0→1: slide out from the centre line, fade and settle. */
  enter: Animated.Value;
  /**
   * JS-driven twin of `enter`. The score counts up and the bar grows from the
   * same number, so they can never disagree — and neither a counting label nor
   * a percentage width can be driven from the native thread.
   */
  count: Animated.Value;
  /** Signed distance the tile travels from the centre line, in points. */
  from: number;
};

export function ScanVerdictTile({ card, enter, count, from }: Props) {
  const tone = toneForScore(card.match);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    // Only re-render when the whole number changes — roughly `match` times over
    // the tile's entrance, not once per frame.
    const id = count.addListener(({ value }) => {
      setShown((current) => {
        const next = Math.round(value * card.match);
        return next === current ? current : next;
      });
    });
    return () => count.removeListener(id);
  }, [card.match, count]);

  return (
    <Animated.View
      className="bg-surface rounded-lg px-md py-md mb-sm"
      style={[
        shadow.card,
        {
          height: TILE_HEIGHT,
          opacity: enter,
          transform: [
            { translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
          ],
        },
      ]}
    >
      <Text className="font-ui text-caption text-ink-faint" numberOfLines={1}>
        {card.brand.toUpperCase()}
      </Text>
      <Text className="font-ui text-label text-ink mt-[2px]" numberOfLines={2}>
        {card.product}
      </Text>

      <View className="flex-1 justify-end">
        <View className="flex-row items-center justify-between mb-[6px]">
          <Text
            className="font-title text-subheading"
            style={{ color: tone.color }}
            // The number is mid-count while animating; announce the final value.
            accessibilityLabel={`${card.match} percent match`}
          >
            {shown}%
          </Text>
          <RoutineTimingChip timing={card.timing} />
        </View>
        <View className="h-[5px] rounded-pill bg-sunk overflow-hidden">
          <View className={`h-full rounded-pill ${tone.bar}`} style={{ width: `${shown}%` }} />
        </View>
      </View>
    </Animated.View>
  );
}
