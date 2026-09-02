import React, { useMemo } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlowBackground, PrimaryButton, SectionTitle } from '../components';
import { RootStackParamList } from '../navigation/types';
import { getProductSync } from '../api';
import { Review } from '../api/types';
import { fonts, palette, shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const STEP_LABEL: Record<string, string> = {
  cleanse: 'Step 1 · Cleanse',
  treat: 'Step 2 · Treat',
  moisturise: 'Step 3 · Moisturise',
  protect: 'Step 4 · Protect',
};

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialCommunityIcons
          key={i}
          name={i <= rounded ? 'star' : 'star-outline'}
          size={15}
          color={palette.accent}
        />
      ))}
    </View>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <View>
      <View className="flex-row items-center justify-between mb-xs">
        <Text className="font-ui text-label text-ink">{review.author}</Text>
        <Stars rating={review.rating} />
      </View>
      <Text className="font-body text-body-sm text-ink-soft">{review.body}</Text>
    </View>
  );
}

export function ProductDetailScreen({ route }: Props) {
  const product = useMemo(() => getProductSync(route.params.productId), [route.params.productId]);

  if (!product) {
    return (
      <GlowBackground variant="mist">
        <View className="flex-1 items-center justify-center p-gutter">
          <Text className="font-body text-body text-ink-soft">
            This product is no longer in the catalogue.
          </Text>
        </View>
      </GlowBackground>
    );
  }

  const openBuyLink = () => {
    void Linking.openURL(product.buyUrl);
  };

  return (
    <GlowBackground variant="mist">
      <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
        <View
          className="h-[200px] mx-gutter rounded-xl items-center justify-center"
          style={{ backgroundColor: product.swatch }}
        >
          <Text className="font-display text-[64px] text-ink/25">{product.brand.charAt(0)}</Text>
          <View className="absolute top-lg right-lg bg-white/80 px-md py-[5px] rounded-pill">
            <Text className="font-ui text-caption text-accent">{product.matchScore}% MATCH</Text>
          </View>
        </View>

        <View className="px-gutter mt-2xl">
          <Text className="font-ui text-caption text-accent mb-sm">
            {(STEP_LABEL[product.routineStep] ?? product.category).toUpperCase()}
          </Text>
          <Text className="font-title text-title text-ink">{product.name}</Text>
          <Text className="font-ui text-subheading text-ink-faint mt-px">{product.brand}</Text>

          <View className="flex-row items-center justify-between mt-lg">
            <Text className="font-title text-heading text-ink">{product.price}</Text>
            <View className="items-end">
              <Stars rating={product.rating} />
              <Text className="font-body text-body-sm text-ink-faint mt-px">
                {product.rating.toFixed(1)} · {product.reviewCount.toLocaleString()} reviews
              </Text>
            </View>
          </View>
        </View>

        <View className="px-gutter mt-2xl">
          <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
            <Card.Content>
              <Text className="font-ui text-caption text-ink-faint mb-sm">
                WHY IT IS IN YOUR ROUTINE
              </Text>
              <Text className="font-body text-body text-ink-soft">{product.description}</Text>
            </Card.Content>
          </Card>
        </View>

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

        <View className="px-gutter mt-2xl">
          <SectionTitle title={`Reviews (${product.reviews.length})`} />
          <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
            <Card.Content>
              {product.reviews.map((review, i) => (
                <View key={review.id}>
                  {i > 0 ? <Divider className="my-lg bg-outline" /> : null}
                  <ReviewRow review={review} />
                </View>
              ))}
            </Card.Content>
          </Card>
        </View>

        <View className="px-gutter mt-2xl">
          <PrimaryButton label={`Buy · ${product.price}`} icon="open-in-new" onPress={openBuyLink} />
          <Text className="font-body text-body-sm text-ink-faint text-center mt-md">
            Opens the retailer in your browser. Glownome does not take a cut of this purchase.
          </Text>
        </View>
      </ScrollView>
    </GlowBackground>
  );
}
