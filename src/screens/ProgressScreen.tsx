import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { GlowBackground, PrimaryButton, ScreenHeader, SectionTitle } from '../components';
import { getRoutineStreak, listProgress } from '../api';
import { ProgressEntry } from '../api/types';
import { shadow, toneForScore } from '../theme';

function PhotoTile({ label, uri, caption }: { label: string; uri?: string; caption: string }) {
  return (
    <View className="flex-1">
      <View className="aspect-[3/4] rounded-lg bg-sunk border-hairline border-outline overflow-hidden">
        {uri ? (
          <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="font-ui text-caption text-ink-faint">NO PHOTO</Text>
          </View>
        )}
      </View>
      <Text className="font-ui text-label text-ink mt-md">{label}</Text>
      <Text className="font-body text-body-sm text-ink-faint">{caption}</Text>
    </View>
  );
}

function TrendChart({ entries }: { entries: ProgressEntry[] }) {
  return (
    <View className="flex-row items-end h-[140px] gap-md">
      {entries.map((entry) => {
        const tone = toneForScore(entry.overallScore);
        return (
          <View key={entry.id} className="flex-1 items-center">
            <View className="w-full h-[96px] justify-end bg-sunk rounded-sm overflow-hidden">
              {/* Height is data-driven; the tone is a token class. */}
              <View
                className={`w-full rounded-sm ${tone.bar}`}
                style={{ height: `${entry.overallScore}%` }}
              />
            </View>
            <Text className="font-ui text-caption text-ink mt-sm">{entry.overallScore}</Text>
            <Text className="font-ui text-caption text-ink-faint">{entry.date}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ProgressScreen() {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [beforeUri, setBeforeUri] = useState<string | undefined>();
  const [afterUri, setAfterUri] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    listProgress().then((result) => {
      if (!cancelled) setEntries(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addWeeklyPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) return;
    const uri = result.assets[0].uri;
    setAfterUri((current) => {
      if (current) setBeforeUri(current);
      return uri;
    });
  }, []);

  const first = entries[0];
  const latest = entries[entries.length - 1];
  const delta = first && latest ? latest.overallScore - first.overallScore : 0;

  return (
    <GlowBackground variant="mist">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
          <ScreenHeader
            eyebrow={`${getRoutineStreak()}-day routine streak`}
            title="Your progress"
            subtitle="Scan on the same day each week — consistent lighting is what makes the comparison honest."
          />

          <View className="px-gutter mb-2xl">
            <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
              <Card.Content>
                <View className="flex-row items-end justify-between mb-xl">
                  <View>
                    <Text className="font-ui text-caption text-ink-faint mb-px">
                      SINCE BASELINE
                    </Text>
                    <Text className="font-title text-title text-sage">
                      {delta >= 0 ? `+${delta}` : delta} points
                    </Text>
                  </View>
                  <Text className="font-body text-body-sm text-ink-faint">
                    {entries.length} weekly scans
                  </Text>
                </View>
                <TrendChart entries={entries} />
              </Card.Content>
            </Card>
          </View>

          <View className="px-gutter mb-2xl">
            <SectionTitle title="Before and after" />
            <View className="flex-row gap-lg">
              <PhotoTile
                label="Before"
                uri={beforeUri}
                caption={first ? `${first.weekLabel} · ${first.date}` : 'Baseline scan'}
              />
              <PhotoTile
                label="Now"
                uri={afterUri}
                caption={latest ? `${latest.weekLabel} · ${latest.date}` : 'Latest scan'}
              />
            </View>
            <PrimaryButton
              label="Add this week's photo"
              icon="camera-plus-outline"
              variant="outline"
              onPress={() => void addWeeklyPhoto()}
              className="mt-xl"
            />
          </View>

          <View className="px-gutter mb-2xl">
            <SectionTitle title="Week by week" />
            {[...entries].reverse().map((entry) => {
              const tone = toneForScore(entry.overallScore);
              return (
                <Card
                  key={entry.id}
                  mode="contained"
                  className="bg-surface rounded-lg mb-md"
                  style={shadow.card}
                >
                  <Card.Content className="flex-row items-center py-md">
                    <View
                      className={`w-[54px] h-[54px] rounded-md items-center justify-center mr-lg ${tone.soft}`}
                    >
                      <Text className="font-title text-heading" style={{ color: tone.color }}>
                        {entry.overallScore}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-ui text-label text-ink">
                        {entry.weekLabel} · {entry.date}
                      </Text>
                      <Text className="font-body text-body-sm text-ink-soft mt-px">
                        {entry.note}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
