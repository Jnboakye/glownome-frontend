import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  GlowBackground,
  MetricBar,
  PrimaryButton,
  ProductCard,
  ScoreDial,
  SectionTitle,
} from '../components';
import { RootStackParamList } from '../navigation/types';
import { getAnalysis, getProductsByIds } from '../api';
import { Product, SkinAnalysis } from '../api/types';
import { fonts, palette, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ route, navigation }: Props) {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<SkinAnalysis | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    getAnalysis(analysisId).then(async (result) => {
      if (cancelled) return;
      setAnalysis(result);
      const matched = await getProductsByIds(result.recommendedProductIds);
      if (!cancelled) setProducts(matched);
    });
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (!analysis) {
    return (
      <GlowBackground variant="mist">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.ink} />
          <Text className="font-body text-body text-ink-soft mt-md">Reading your scan…</Text>
        </View>
      </GlowBackground>
    );
  }

  return (
    <GlowBackground variant="mist">
      <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-gutter pt-sm">
          {analysis.photoUri ? (
            <Image
              source={{ uri: analysis.photoUri }}
              className="w-[68px] h-[84px] rounded-md mr-lg bg-sunk"
              resizeMode="cover"
            />
          ) : null}
          <View className="flex-1">
            <Text className="font-ui text-caption text-accent mb-xs">
              {analysis.skinType.toUpperCase()}
            </Text>
            <Text className="font-title text-title text-ink">{analysis.headline}</Text>
          </View>
        </View>

        <View className="px-gutter mt-2xl">
          <ScoreDial
            score={analysis.overallScore}
            caption="Your overall skin score. Rescan in four weeks to see it move."
          />
        </View>

        <View className="px-gutter mt-2xl">
          <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
            <Card.Content>
              <Text className="font-ui text-caption text-ink-faint mb-sm">WHAT THE SCAN SHOWS</Text>
              <Text className="font-body text-body text-ink-soft">{analysis.summary}</Text>
            </Card.Content>
          </Card>
        </View>

        <View className="px-gutter mt-2xl">
          <SectionTitle title="The breakdown" />
          {analysis.metrics.map((metric) => (
            <MetricBar key={metric.key} metric={metric} />
          ))}
        </View>

        <View className="px-gutter mt-2xl">
          <SectionTitle
            title="Your routine"
            trailing={
              <Chip
                compact
                className="bg-accent-soft"
                textStyle={{ color: palette.accent, fontFamily: fonts.ui, fontSize: 12 }}
              >
                {`${products.length} products`}
              </Chip>
            }
          />
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
            />
          ))}
        </View>

        <View className="px-gutter mt-2xl">
          <PrimaryButton
            label="Save to my progress"
            onPress={() => navigation.navigate('Main', { screen: 'Progress' })}
          />
        </View>
      </ScrollView>
    </GlowBackground>
  );
}
