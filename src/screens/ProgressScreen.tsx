import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BackBar,
  EmptyState,
  GlowBackground,
  LoadingState,
  PrimaryButton,
  ScreenHeader,
  SectionTitle,
} from '../components';
import { RootStackParamList } from '../navigation/types';
import { listScans } from '../api';
import { ScanRecord } from '../api/scans';
import { shadow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const [scans, setScans] = useState<ScanRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Re-read on focus so a scan taken moments ago is already here.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setFailed(false);
      listScans()
        .then((result) => {
          if (!cancelled) setScans(result);
        })
        .catch(() => {
          if (!cancelled) {
            setScans([]);
            setFailed(true);
          }
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const oldest = scans?.[scans.length - 1];
  const newest = scans?.[0];

  return (
    <GlowBackground variant="mist">
      <SafeAreaView className="flex-1" edges={['top']}>
        <BackBar />
        <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
          <ScreenHeader
            title="Your progress"
            subtitle="Scan on the same day each week — consistent lighting is what makes the comparison honest."
          />

          {scans === null ? (
            <LoadingState fill={false} title="Loading your scans…" />
          ) : failed ? (
            <EmptyState
              icon="wifi-off"
              title="Could not load scans"
              body="Check your connection, then pull this screen open again."
              action={
                <PrimaryButton
                  label="Try again"
                  onPress={() => {
                    setScans(null);
                    setFailed(false);
                    void listScans()
                      .then(setScans)
                      .catch(() => {
                        setScans([]);
                        setFailed(true);
                      });
                  }}
                />
              }
            />
          ) : scans.length === 0 ? (
            <EmptyState
              icon="chart-timeline-variant"
              title="No scans yet"
              body="Take your first scan and it will appear here. Weekly comparisons start from your second."
              action={
                <PrimaryButton
                  label="Take a scan"
                  onPress={() => navigation.navigate('ScanCapture')}
                />
              }
            />
          ) : (
            <>
              {scans.length > 1 && oldest && newest ? (
                <View className="px-gutter mb-2xl">
                  <SectionTitle title="Then and now" />
                  <View className="flex-row gap-lg">
                    {[
                      { label: 'First', record: oldest },
                      { label: 'Latest', record: newest },
                    ].map(({ label, record }) => (
                      <Pressable
                        key={label}
                        className="flex-1"
                        accessibilityRole="button"
                        accessibilityLabel={`${label} scan, ${formatDate(record.capturedAt)}`}
                        onPress={() => navigation.navigate('Results', { scanId: record.id })}
                      >
                        <Image
                          source={{ uri: record.photoUri }}
                          className="aspect-[3/4] rounded-lg bg-sunk"
                          resizeMode="cover"
                        />
                        <Text className="font-ui text-label text-ink mt-md">{label}</Text>
                        <Text className="font-body text-body-sm text-ink-faint">
                          {formatDate(record.capturedAt)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              <View className="px-gutter mb-2xl">
                <SectionTitle title={`${scans.length} ${scans.length === 1 ? 'scan' : 'scans'}`} />
                {scans.map((scan) => (
                  <Card
                    key={scan.id}
                    mode="contained"
                    onPress={() => navigation.navigate('Results', { scanId: scan.id })}
                    className="bg-surface rounded-lg mb-md"
                    style={shadow.card}
                    accessibilityLabel={`Scan from ${formatDate(scan.capturedAt)}`}
                  >
                    <Card.Content className="flex-row items-center py-md">
                      <Image
                        source={{ uri: scan.photoUri }}
                        className="w-[54px] h-[66px] rounded-md bg-sunk mr-lg"
                        resizeMode="cover"
                      />
                      <View className="flex-1">
                        <Text className="font-ui text-label text-ink">
                          {formatDate(scan.capturedAt)}
                        </Text>
                        <Text className="font-body text-body-sm text-ink-faint mt-px">
                          {scan.analysis ? scan.analysis.headline : 'Not analysed yet'}
                        </Text>
                      </View>
                      <Text className="font-ui text-caption text-accent">Open</Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>

              <View className="px-gutter">
                <PrimaryButton
                  label="Take another scan"
                  variant="outline"
                  onPress={() => navigation.navigate('ScanCapture')}
                />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
