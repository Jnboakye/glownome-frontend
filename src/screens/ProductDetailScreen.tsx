import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BackBar,
  EmptyState,
  GlowBackground,
  LoadingState,
  PrimaryButton,
  SectionTitle,
} from '../components';
import { RootStackParamList } from '../navigation/types';
import { getProduct } from '../api';
import { Product } from '../api/types';
import { fonts, palette, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    getProduct(route.params.productId)
      .then((result) => {
        if (!cancelled) setProduct(result);
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [route.params.productId]);

  if (loading) {
    return (
      <GlowBackground variant="mist">
        <SafeAreaView className="flex-1" edges={['top']}>
          <BackBar />
          <LoadingState title="Loading product…" body="Pulling details from the catalogue." />
        </SafeAreaView>
      </GlowBackground>
    );
  }

  if (!product) {
    return (
      <GlowBackground variant="mist">
        <SafeAreaView className="flex-1" edges={['top']}>
          <BackBar />
          <View className="flex-1 justify-center">
            <EmptyState
              icon={failed ? 'alert-circle-outline' : 'database-off-outline'}
              title={failed ? 'Could not load this product' : 'No catalogue yet'}
              body={
                failed
                  ? 'Check your connection and try again from the results list.'
                  : 'Product details arrive with the scraped catalogue. Nothing is shown here until it is real.'
              }
              action={<PrimaryButton label="Go back" onPress={() => navigation.goBack()} />}
            />
          </View>
        </SafeAreaView>
      </GlowBackground>
    );
  }

  return (
    <GlowBackground variant="mist">
      <SafeAreaView className="flex-1" edges={['top']}>
        <BackBar title="Product" />
        <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
          <View className="px-gutter pt-sm">
            <Text className="font-ui text-caption text-accent mb-sm">
              {product.category.toUpperCase()}
            </Text>
            <Text accessibilityRole="header" className="font-title text-title text-ink">
              {product.name}
            </Text>
            <Text className="font-ui text-subheading text-ink-faint mt-px">{product.brand}</Text>
            <Text className="font-title text-heading text-ink mt-lg">{product.price}</Text>
          </View>

          <View className="px-gutter mt-2xl">
            <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
              <Card.Content>
                <Text className="font-body text-body text-ink-soft">{product.description}</Text>
              </Card.Content>
            </Card>
          </View>

          {product.keyIngredients.length > 0 ? (
            <View className="px-gutter mt-2xl">
              <SectionTitle title="Key ingredients" />
              <View className="flex-row flex-wrap gap-sm">
                {product.keyIngredients.map((ingredient) => (
                  <Chip
                    key={ingredient}
                    compact
                    className="bg-surface border-hairline border-outline"
                    textStyle={{ color: palette.inkSoft, fontFamily: fonts.ui, fontSize: 12.5 }}
                  >
                    {ingredient}
                  </Chip>
                ))}
              </View>
            </View>
          ) : null}

          <View className="px-gutter mt-3xl">
            <PrimaryButton
              label={`Buy · ${product.price}`}
              icon="open-in-new"
              onPress={() => void Linking.openURL(product.buyUrl)}
            />
            <Text className="font-body text-body-sm text-ink-faint text-center mt-md">
              Opens the retailer in your browser. Glownome does not process the purchase.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
