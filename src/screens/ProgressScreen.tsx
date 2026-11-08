import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState, GlowBackground, PrimaryButton, ScreenHeader, SectionTitle } from '../components';
import { RootStackParamList } from '../navigation/types';
import { listScans, listScansFromBackend } from '../api';
import { ScanRecord } from '../api/scans';
import { palette, shadow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

interface BackendScan {
  id: string;
  capturedAt: string;
  hasAnalysis: boolean;
  overallScore?: number;
  photoUrl?: string;
}

export function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const [scans, setScans] = useState<ScanRecord[] | null>(null);
  const [backendScans, setBackendScans] = useState<BackendScan[] | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      const load = async () => {
        const backendData = await listScansFromBackend(50, 0);
        if (backendData && !cancelled) {
          setBackendScans(backendData.scans);
          setTotal(backendData.total);
          setUseBackend(true);
          setLoading(false);
        } else {
          const localScans = await listScans();
          if (!cancelled) {
            setScans(localScans);
            setTotal(localScans.length);
            setUseBackend(false);
            setLoading(false);
          }
        }
      };

      load();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  if (loading) {
    return (
      <GlowBackground variant="mist">
        <SafeAreaView className="flex-1" edges={['top']}>
          <ScreenHeader
            title="Your progress"
            subtitle="Scan on the same day each week — consistent lighting is what makes the comparison honest."
          />
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette.ink} />
          </View>
        </SafeAreaView>
      </GlowBackground>
    );
  }

  const displayScans = useBackend ? backendScans : scans;
  const oldest = displayScans?.[displayScans.length - 1];
  const newest = displayScans?.[0];

  return (
    <GlowBackground variant="mist">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
          <ScreenHeader
            title="Your progress"
            subtitle="Scan on the same day each week — consistent lighting is what makes the comparison honest."
          />

          {!displayScans ? null : displayScans.length === 0 ? (
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
              {displayScans.length > 1 && oldest && newest ? (
                <View className="px-gutter mb-2xl">
                  <SectionTitle title="Then and now" />
                  <View className="flex-row gap-lg">
                    {[
                      { label: 'First', record: oldest },
                      { label: 'Latest', record: newest },
                    ].map(({ label, record }) => {
                      const photoUri = useBackend
                        ? (record as BackendScan).photoUrl
                        : (record as ScanRecord).photoUri;
                      return photoUri ? (
                        <View key={label} className="flex-1">
                          <Image
                            source={{ uri: photoUri }}
                            className="aspect-[3/4] rounded-lg bg-sunk"
                            resizeMode="cover"
                          />
                          <Text className="font-ui text-label text-ink mt-md">{label}</Text>
                          <Text className="font-body text-body-sm text-ink-faint">
                            {formatDate(record.capturedAt)}
                          </Text>
                        </View>
                      ) : null;
                    })}
                  </View>
                </View>
              ) : null}

              <View className="px-gutter mb-2xl">
                <SectionTitle
                  title={`${total} ${total === 1 ? 'scan' : 'scans'}`}
                />
                {displayScans.map((scan) => {
                  const photoUri = useBackend
                    ? (scan as BackendScan).photoUrl
                    : (scan as ScanRecord).photoUri;
                  const headline = useBackend
                    ? (scan as BackendScan).hasAnalysis
                      ? `Score: ${(scan as BackendScan).overallScore ?? 'N/A'}`
                      : 'Not analysed yet'
                    : (scan as ScanRecord).analysis
                      ? (scan as ScanRecord).analysis!.headline
                      : 'Not analysed yet';

                  return (
                    <Card
                      key={scan.id}
                      mode="contained"
                      onPress={() => navigation.navigate('Results', { scanId: scan.id })}
                      className="bg-surface rounded-lg mb-md"
                      style={shadow.card}
                    >
                      <Card.Content className="flex-row items-center py-md">
                        {photoUri ? (
                          <Image
                            source={{ uri: photoUri }}
                            className="w-[54px] h-[66px] rounded-md bg-sunk mr-lg"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-[54px] h-[66px] rounded-md bg-sunk mr-lg" />
                        )}
                        <View className="flex-1">
                          <Text className="font-ui text-label text-ink">
                            {formatDate(scan.capturedAt)}
                          </Text>
                          <Text className="font-body text-body-sm text-ink-faint mt-px">
                            {headline}
                          </Text>
                        </View>
                      </Card.Content>
                    </Card>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
