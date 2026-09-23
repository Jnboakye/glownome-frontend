import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState, GlowBackground, PrimaryButton, SectionTitle } from '../components';
import { RootStackParamList } from '../navigation/types';
import { getProduct } from '../api';
import { Product } from '../api/types';
import { fonts, palette, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProduct(route.params.productId)
      .then((result) => {
        if (!cancelled) setProduct(result);
      })
      .catch(() => undefined)
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.ink} />
        </View>
      </GlowBackground>
    );
  }

  if (!product) {
    return (
      <GlowBackground variant="mist">
        <View className="flex-1 justify-center">
          <EmptyState
            icon="database-off-outline"
            title="No catalogue yet"
            body="Product details arrive with the scraped catalogue. Nothing is shown here until it is real."
            action={<PrimaryButton label="Go back" onPress={() => navigation.goBack()} />}
          />
        </View>
      </GlowBackground>
    );
  }

  return (
    <GlowBackground variant="mist">
      <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
        <View className="px-gutter mt-2xl">
          <Text className="font-ui text-caption text-accent mb-sm">
            {product.category.toUpperCase()}
          </Text>
          <Text className="font-title text-title text-ink">{product.name}</Text>
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

        <View className="px-gutter mt-2xl">
          <PrimaryButton
            label={`Buy · ${product.price}`}
            icon="open-in-new"
            onPress={() => void Linking.openURL(product.buyUrl)}
          />
        </View>
      </ScrollView>
    </GlowBackground>
  );
}
