import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GlowBackground, PrimaryButton, ScanVerdictTile, TextLink } from '../components';
import { RootStackParamList } from '../navigation/types';
import { useTypewriter } from '../hooks/useTypewriter';
import { SCAN_DEMO_CARDS } from '../data/onboardingScan';
import { palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingScan'>;

const TITLE = 'scan products';
const SUBTITLE = 'find which ones actually suit you';

/**
 * Each tile gets its own pair of drivers rather than a window on one shared
 * clock, so every entrance can carry its own easing instead of inheriting a
 * slice of someone else's curve.
 */
const FIRST_DELAY = 1400;
const STAGGER = 300;
const ENTER = 760;
/** How far a tile travels from the centre line into its column. */
const TRAVEL = 78;

export function OnboardingScanScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [reduceMotion, setReduceMotion] = useState(false);

  const { visible: subtitle, typing } = useTypewriter(SUBTITLE, 38, 620, reduceMotion);

  const headIn = useRef(new Animated.Value(0)).current;
  const summaryIn = useRef(new Animated.Value(0)).current;
  // Per tile: a native driver for the slide, and a JS twin for the counting
  // score. Neither a counting label nor a percentage width can run natively.
  const enters = useRef(SCAN_DEMO_CARDS.map(() => new Animated.Value(0))).current;
  const counts = useRef(SCAN_DEMO_CARDS.map(() => new Animated.Value(0))).current;

  // Products arrive in scan order, but each lands in its own column. Keeping
  // the original order as the animation order is what makes it read as sorting.
  const ordered = useMemo(
    () =>
      SCAN_DEMO_CARDS.map((card, order) => ({
        card,
        order,
        keep: card.shelf === 'keep',
      })),
    [],
  );
  const keepers = ordered.filter((entry) => entry.keep);
  const rethinks = ordered.filter((entry) => !entry.keep);

  useEffect(() => {
    let cancelled = false;

    const settle = () => {
      headIn.setValue(1);
      summaryIn.setValue(1);
      [...enters, ...counts].forEach((v) => v.setValue(1));
    };

    const play = () => {
      Animated.timing(headIn, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const step = (driver: Animated.Value, index: number, useNativeDriver: boolean) =>
        Animated.timing(driver, {
          toValue: 1,
          duration: ENTER,
          delay: FIRST_DELAY + index * STAGGER,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        });

      counts.forEach((driver, i) => step(driver, i, false).start());
      enters.forEach((driver, i) => {
        const anim = step(driver, i, true);
        if (i < enters.length - 1) {
          anim.start();
          return;
        }
        // The tally waits for the last tile to land.
        anim.start(() => {
          if (cancelled) return;
          Animated.timing(summaryIn, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        });
      });
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (cancelled) return;
        setReduceMotion(enabled);
        if (enabled) settle();
        else play();
      })
      .catch(() => {
        if (!cancelled) play();
      });

    return () => {
      cancelled = true;
    };
  }, [counts, enters, headIn, summaryIn]);

  const onNext = useCallback(() => {
    navigation.navigate('OnboardingRoutine');
  }, [navigation]);

  const skip = useCallback(() => {
    navigation.navigate('OnboardingPromise');
  }, [navigation]);

  const renderColumn = (
    entries: typeof ordered,
    heading: string,
    icon: 'check' | 'autorenew',
    colour: string,
    travel: number,
  ) => (
    <View className="flex-1">
      <View className="flex-row items-center gap-xs mb-md">
        <MaterialCommunityIcons name={icon} size={14} color={colour} />
        <Text className="font-ui text-caption" style={{ color: colour }}>
          {heading}
        </Text>
      </View>
      {entries.map((entry) => (
        <ScanVerdictTile
          key={entry.card.id}
          card={entry.card}
          from={travel}
          enter={enters[entry.order]}
          count={counts[entry.order]}
        />
      ))}
    </View>
  );

  return (
    <GlowBackground>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-gutter pt-sm">
          <IconButton
            icon="chevron-left"
            size={26}
            iconColor={palette.ink}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back"
            style={{ marginLeft: -10 }}
          />
        </View>

        <Animated.View
          className="px-gutter mt-lg"
          style={{
            opacity: headIn,
            transform: [
              { translateY: headIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            ],
          }}
        >
          <Text className="font-display text-display text-ink">{TITLE}</Text>
          <Text className="font-ui text-subheading text-ink-soft mt-xs">
            {subtitle}
            {typing ? <Text style={{ color: palette.accent }}>|</Text> : null}
          </Text>
        </Animated.View>

        <View className="flex-1 justify-center px-gutter">
          <View className="flex-row gap-md">
            {renderColumn(keepers, 'KEEP', 'check', palette.sage, TRAVEL)}
            {renderColumn(rethinks, 'RETHINK', 'autorenew', palette.inkFaint, -TRAVEL)}
          </View>

          <Animated.Text
            className="font-body text-body-sm text-ink-faint text-center mt-md"
            style={{ opacity: summaryIn }}
          >
            {`${SCAN_DEMO_CARDS.length} products scanned · ${rethinks.length} worth replacing`}
          </Animated.Text>
        </View>

        <View className="px-gutter" style={{ paddingBottom: insets.bottom + 20 }}>
          <PrimaryButton label="Next" onPress={onNext} />
          <View className="h-[44px] justify-center">
            <TextLink label="Skip feature demo" onPress={skip} />
          </View>
        </View>
      </SafeAreaView>
    </GlowBackground>
  );
}
