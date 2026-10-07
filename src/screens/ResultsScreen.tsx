import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  GlowBackground,
  MetricBar,
  NextSteps,
  PrimaryButton,
  ProductCarousel,
  Recommendation,
  ScanImage,
  ScoreCard,
  SectionTitle,
  SkinProfileCard,
  ProfileRow,
} from '../components';
import { RootStackParamList } from '../navigation/types';
import { analyseScan, AnalysisErrorKind, analysisErrorKind, getProductsByIds, getScan } from '../api';
import { ScanRecord } from '../api/scans';
import { SkinAnalysis } from '../api/types';
import { useUser } from '../hooks/userContext';
import { labelFor } from '../data/onboardingQuestions';
import { palette, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

type Status = 'loading' | 'error' | 'ready' | 'missing';

/**
 * One honest message per reason there is no analysis (fix 5). `retry` says
 * whether trying again can help; when it can't, the action is a new scan.
 */
const ERROR_COPY: Record<AnalysisErrorKind, { icon: string; title: string; body: string; retry: boolean }> = {
  'no-backend': {
    icon: 'cloud-off-outline',
    title: 'Analysis not connected',
    body: 'Your photo is saved on this phone. This build has no analysis server configured.',
    retry: false,
  },
  offline: {
    icon: 'wifi-off',
    title: "Can't reach the server",
    body: 'Your photo is saved on this phone. Check your connection, then try again.',
    retry: true,
  },
  'not-uploaded': {
    icon: 'cloud-upload-outline',
    title: 'Not uploaded yet',
    body: 'Your photo is saved on this phone but could not be sent. Try again in a moment.',
    retry: true,
  },
  'photo-missing': {
    icon: 'image-off-outline',
    title: 'Photo no longer on this phone',
    body: 'This scan was never uploaded, and the phone has since cleared the photo. A new scan is needed.',
    retry: false,
  },
  unavailable: {
    icon: 'timer-sand',
    title: 'Analysis not available right now',
    body: 'Your photo was uploaded, but the analysis service did not answer. Try again in a moment.',
    retry: true,
  },
  'not-found': {
    icon: 'file-question-outline',
    title: 'Scan not found on the server',
    body: 'The server has no record of this scan. A new scan is needed.',
    retry: false,
  },
  failed: {
    icon: 'alert-circle-outline',
    title: 'Analysis did not go through',
    body: 'Your photo is saved on this phone. Try again in a moment.',
    retry: true,
  },
};

const DISCLAIMER =
  'This analysis is not a substitute for professional dermatology advice. See a dermatologist for anything painful, spreading or changing.';

export function ResultsScreen({ route, navigation }: Props) {
  const { scanId } = route.params;
  const { profile } = useUser();

  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [errorKind, setErrorKind] = useState<AnalysisErrorKind>('failed');

  /** Product ids → cards. A catalogue failure never hides the analysis. */
  const loadRecommendations = useCallback(async (result: SkinAnalysis) => {
    try {
      const products = await getProductsByIds(result.recommendations.map((r) => r.productId));
      setRecommendations(
        result.recommendations
          .map((rec) => {
            const product = products.find((p) => p.id === rec.productId);
            return product ? { product, reason: rec.reason } : null;
          })
          .filter((r): r is Recommendation => r !== null),
      );
    } catch {
      setRecommendations([]);
    }
  }, []);

  // `scanId` is the id the screen was opened with. If the scan was taken
  // offline, `analyseScan` uploads it and it gets the server's id — `scan`
  // (state) holds the current record from then on, so the retry button
  // uses that, not the route param.
  const load = useCallback(
    async (from?: ScanRecord) => {
      setStatus('loading');
      const record = from ?? (await getScan(scanId));
      if (!record) {
        setStatus('missing');
        return;
      }
      setScan(record);

      try {
        // Saved analysis → no network call. Otherwise upload if needed,
        // analyse once, and save it on the scan (fix 2).
        const { scan: current, analysis: result } = await analyseScan(record);
        setScan(current);
        setAnalysis(result);
        setStatus('ready');
        void loadRecommendations(result);
      } catch (error) {
        // Invent nothing — say which thing went wrong.
        setErrorKind(analysisErrorKind(error));
        setStatus('error');
      }
    },
    [loadRecommendations, scanId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // The questionnaire answers are real today, so they can be shown whether or
  // not the photo has been analysed.
  const profileRows: ProfileRow[] = [
    profile?.concern?.length
      ? {
          icon: 'target-variant',
          label: 'Main concern',
          value: labelFor('concern', profile.concern),
          fromYou: true,
        }
      : null,
    profile?.routine
      ? {
          icon: 'clipboard-list-outline',
          label: 'Starting point',
          value: labelFor('routine', profile.routine),
          fromYou: true,
        }
      : null,
    analysis
      ? { icon: 'face-woman-shimmer-outline', label: 'Skin type', value: analysis.skinType }
      : null,
  ].filter((row): row is ProfileRow => row !== null);

  const header = (
    <View className="flex-row items-center px-md pt-sm">
      <IconButton
        icon="chevron-left"
        size={26}
        iconColor={palette.ink}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Back"
      />
      <Text className="font-title text-heading text-ink">Results</Text>
    </View>
  );

  if (status === 'loading') {
    return (
      <GlowBackground variant="mist">
        <SafeAreaView className="flex-1" edges={['top']}>
          {header}
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={palette.ink} />
          </View>
        </SafeAreaView>
      </GlowBackground>
    );
  }

  if (status === 'missing') {
    return (
      <GlowBackground variant="mist">
        <SafeAreaView className="flex-1" edges={['top']}>
          {header}
          <View className="flex-1 justify-center">
            <EmptyState
              icon="image-off-outline"
              title="Scan not found"
              body="It may have been cleared from this device."
              action={
                <PrimaryButton
                  label="Take a new scan"
                  onPress={() => navigation.replace('ScanCapture')}
                />
              }
            />
          </View>
        </SafeAreaView>
      </GlowBackground>
    );
  }

  return (
    <GlowBackground variant="mist">
      <SafeAreaView className="flex-1" edges={['top']}>
        {header}

        <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
          {scan ? (
            <View className="px-gutter">
              <ScanImage uri={scan.photoUri} capturedAt={scan.capturedAt} />
            </View>
          ) : null}

          {status === 'error' || !analysis ? (
            <>
              <EmptyState
                icon={ERROR_COPY[errorKind].icon}
                title={ERROR_COPY[errorKind].title}
                body={ERROR_COPY[errorKind].body}
                action={
                  ERROR_COPY[errorKind].retry ? (
                    <PrimaryButton label="Try again" onPress={() => void load(scan ?? undefined)} />
                  ) : errorKind === 'no-backend' ? undefined : (
                    <PrimaryButton
                      label="Take a new scan"
                      onPress={() => navigation.replace('ScanCapture')}
                    />
                  )
                }
              />

              {profileRows.length > 0 ? (
                <View className="px-gutter mt-sm">
                  <SectionTitle title="What we know so far" />
                  <SkinProfileCard rows={profileRows} />
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View className="px-gutter mt-2xl">
                <ScoreCard score={analysis.overallScore} />
              </View>

              <View className="px-gutter mt-2xl">
                <SectionTitle title="Your skin profile" />
                <SkinProfileCard rows={profileRows} />
              </View>

              {analysis.findings.length > 0 ? (
                <View className="px-gutter mt-2xl">
                  <SectionTitle title="What the scan shows" />
                  <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
                    <Card.Content>
                      <Text className="font-body text-body text-ink-soft">{analysis.summary}</Text>
                      <View className="mt-lg">
                        {analysis.findings.map((finding) => (
                          <View key={finding} className="flex-row items-start mb-sm">
                            <View className="w-[5px] h-[5px] rounded-pill bg-accent mt-[8px] mr-md" />
                            <Text className="font-body text-body-sm text-ink-soft flex-1">
                              {finding}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </Card.Content>
                  </Card>
                </View>
              ) : null}

              {analysis.metrics.length > 0 ? (
                <View className="px-gutter mt-2xl">
                  <SectionTitle title="The breakdown" />
                  {analysis.metrics.map((metric) => (
                    <MetricBar key={metric.key} metric={metric} />
                  ))}
                </View>
              ) : null}

              <View className="mt-2xl">
                <View className="px-gutter">
                  <SectionTitle title="Personalised for you" />
                </View>
                {recommendations.length > 0 ? (
                  <ProductCarousel
                    items={recommendations}
                    onPress={(productId) => navigation.navigate('ProductDetail', { productId })}
                  />
                ) : (
                  <View className="px-gutter">
                    <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
                      <Card.Content>
                        <Text className="font-body text-body-sm text-ink-faint">
                          Building your profile — recommendations arrive with the product
                          catalogue.
                        </Text>
                      </Card.Content>
                    </Card>
                  </View>
                )}
              </View>
            </>
          )}

          <View className="px-gutter mt-3xl">
            <NextSteps
              onStartRoutine={() => navigation.navigate('Main', { screen: 'Routine' })}
              onTrackProgress={() => navigation.navigate('Progress')}
            />
          </View>

          <View className="px-gutter mt-xl">
            <Text className="font-body text-body-sm text-ink-faint text-center">{DISCLAIMER}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
