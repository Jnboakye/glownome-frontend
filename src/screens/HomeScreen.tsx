import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  BarsShape,
  CardLine,
  CardLinks,
  DayNightShape,
  DropsShape,
  GlowBackground,
  HomeCard,
  LoadingState,
  ScanShape,
  useTabBarSpace,
} from '../components';
import { RootStackParamList } from '../navigation/types';
import { listScans, ScanRecord } from '../api/scans';
import {
  currentWeek,
  lastScan,
  latestIngredients,
  progressChange,
  progressTitle,
  shortDate,
  whenLabel,
} from '../lib/homeSummary';
import { fonts, palette, toneForScore } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Home — the user's own data in Noe-style cards (R1, 28 Sep).
 *
 * Everything is read from the scans saved on this phone, re-read every time
 * the tab gains focus. A card with nothing real to say hides, or says so.
 */
export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const bottomSpace = useTabBarSpace();
  const [scans, setScans] = useState<ScanRecord[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listScans()
        .then((result) => {
          if (!cancelled) setScans(result);
        })
        .catch(() => {
          if (!cancelled) setScans([]);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const week = useMemo(() => currentWeek(), []);
  const last = scans ? lastScan(scans) : null;
  const change = scans ? progressChange(scans) : null;
  const ingredients = scans ? latestIngredients(scans) : null;

  const openCamera = () => navigation.navigate('ScanCapture');
  const openLibrary = () => navigation.navigate('ScanLibrary');
  const openHistory = () => navigation.navigate('Progress');

  return (
    <GlowBackground variant="mist">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="px-gutter"
          contentContainerStyle={{ paddingBottom: bottomSpace }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── header ── */}
          <Text
            accessibilityRole="header"
            className="mt-lg"
            style={{ fontFamily: fonts.wordmark, fontSize: 32, lineHeight: 40, letterSpacing: -1, color: palette.ink }}
          >
            glownome
          </Text>

          {/* Week row. No streak number until routines exist (R2) — a
              counter with nothing behind it would be invented. */}
          <View className="flex-row justify-between mt-lg mb-2xl">
            {week.map((day, i) => (
              <View key={i} className="items-center">
                <View
                  className="w-[34px] h-[34px] rounded-pill bg-white/60"
                  style={{
                    borderWidth: day.isToday ? 1.6 : 1.2,
                    borderColor: day.isToday ? palette.accent : palette.outlineStrong,
                  }}
                />
                <Text
                  className={`font-ui text-caption mt-xs ${day.isToday ? 'text-ink' : 'text-ink-faint'}`}
                >
                  {day.letter}
                </Text>
              </View>
            ))}
          </View>

          {scans === null ? (
            <LoadingState fill={false} title="Loading your home…" />
          ) : (
            <>
              {/* ── skin scan ── */}
              {last ? (
                <HomeCard
                  tint="lilac"
                  label="Skin scan"
                  title={`last scan ${whenLabel(last.scan.capturedAt)}`}
                  line={
                    last.score !== null ? (
                      <View className="flex-row items-center gap-sm">
                        <CardLine>{`Score ${last.score}`}</CardLine>
                        <ScoreChip score={last.score} />
                      </View>
                    ) : (
                      <CardLine>Not analysed yet — tap to open</CardLine>
                    )
                  }
                  onPressBody={() => navigation.navigate('Results', { scanId: last.scan.id })}
                  bodyLabel="Open your last scan"
                  shape={(ink) => <ScanShape ink={ink} />}
                  action={{ label: 'Scan again', onPress: openCamera }}
                >
                  <CardLinks
                    links={[
                      { label: 'All scans', onPress: openHistory },
                      { label: 'Use a library photo', onPress: openLibrary },
                    ]}
                  />
                </HomeCard>
              ) : (
                <HomeCard
                  tint="lilac"
                  label="Skin scan"
                  title="take your first scan"
                  line={<CardLine>One clear photo in daylight, bare skin.</CardLine>}
                  shape={(ink) => <ScanShape ink={ink} />}
                  action={{ label: 'Open the camera', onPress: openCamera }}
                >
                  <CardLinks links={[{ label: 'Use a library photo', onPress: openLibrary }]} />
                </HomeCard>
              )}

              {/* ── progress: only with two analysed scans ── */}
              {change ? (
                <HomeCard
                  tint="blue"
                  label="Progress"
                  title={progressTitle(change)}
                  line={
                    <CardLine>
                      {change.delta !== 0 ? (
                        <Text
                          className="font-title text-body-sm"
                          style={{ color: change.delta > 0 ? palette.sage : palette.rose }}
                        >
                          {`${change.delta > 0 ? '+' : '−'}${Math.abs(change.delta)} `}
                        </Text>
                      ) : null}
                      {`since your scan on ${shortDate(change.sinceIso)}`}
                    </CardLine>
                  }
                  shape={(ink) => <BarsShape ink={ink} />}
                  action={{ label: 'See all scans', onPress: openHistory }}
                />
              ) : null}

              {/* ── routine: R2 ── */}
              <HomeCard
                tint="mint"
                label="Today's routine"
                title="coming soon"
                line={<CardLine>Morning and night check-offs arrive with the Routine tab.</CardLine>}
                shape={(ink) => <DayNightShape ink={ink} />}
              />

              {/* ── ingredients: hidden until the analysis carries them ── */}
              {ingredients ? (
                <HomeCard
                  tint="lilac"
                  label="Ingredients"
                  title="what suits your skin"
                  shape={(ink) => <DropsShape ink={ink} />}
                >
                  <View className="mt-sm">
                    {ingredients.slice(0, 3).map((pick) => (
                      <View key={pick.name} className="mt-sm">
                        <Text className="font-ui text-label text-ink">{pick.name}</Text>
                        <CardLine>{pick.why}</CardLine>
                      </View>
                    ))}
                  </View>
                </HomeCard>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}

function ScoreChip({ score }: { score: number }) {
  const tone = toneForScore(score);
  return (
    <View className={`rounded-pill px-sm py-[2px] ${tone.soft}`}>
      <Text className="font-title text-caption" style={{ color: tone.color }}>
        {tone.label}
      </Text>
    </View>
  );
}
