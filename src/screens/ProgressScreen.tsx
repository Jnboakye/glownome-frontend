import React, { useCallback, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState, GlowBackground, PrimaryButton, ScreenHeader, SectionTitle } from '../components';
import { RootStackParamList } from '../navigation/types';
import { listScans } from '../api';
import { ScanRecord } from '../api/scans';
import { shadow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const [scans, setScans] = useState<ScanRecord[] | null>(null);

  // Re-read on focus so a scan taken moments ago is already here.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listScans().then((result) => {
        if (!cancelled) setScans(result);
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
        <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
          <ScreenHeader
            title="Your progress"
            subtitle="Scan on the same day each week — consistent lighting is what makes the comparison honest."
          />

          {!scans ? null : scans.length === 0 ? (
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
                      <View key={label} className="flex-1">
                        <Image
                          source={{ uri: record.photoUri }}
                          className="aspect-[3/4] rounded-lg bg-sunk"
                          resizeMode="cover"
                        />
                        <Text className="font-ui text-label text-ink mt-md">{label}</Text>
                        <Text className="font-body text-body-sm text-ink-faint">
                          {formatDate(record.capturedAt)}
                        </Text>
                      </View>
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
                    </Card.Content>
                  </Card>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
