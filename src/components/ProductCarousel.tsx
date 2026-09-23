import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Text, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Product } from '../api/types';
import { palette, shadow } from '../theme';

export type Recommendation = { product: Product; reason: string };

type Props = {
  items: Recommendation[];
  onPress: (productId: string) => void;
};

/**
 * Horizontal, because a recommendation list is browsed sideways and a vertical
 * stack of five would push the disclaimer off the bottom of the screen.
 * Cards are a fixed width so the peek of the next one invites the swipe.
 */
export function ProductCarousel({ items, onPress }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-md px-gutter"
      // Snapping makes a short list feel deliberate rather than loose.
      snapToInterval={212}
      decelerationRate="fast"
    >
      {items.map(({ product, reason }) => (
        <Card
          key={product.id}
          mode="contained"
          onPress={() => onPress(product.id)}
          className="bg-surface rounded-lg w-[200px]"
          style={shadow.card}
        >
          <Card.Content className="py-lg">
            <View
              className="h-[64px] rounded-md items-center justify-center mb-md"
              style={{ backgroundColor: product.swatch }}
            >
              <Text className="font-title text-heading text-ink/30">
                {product.brand.charAt(0)}
              </Text>
            </View>

            <Text className="font-ui text-caption text-ink-faint" numberOfLines={1}>
              {product.brand.toUpperCase()}
            </Text>
            <Text className="font-ui text-label text-ink mt-[2px]" numberOfLines={2}>
              {product.name}
            </Text>

            <View className="bg-accent-soft rounded-pill px-md py-[3px] self-start mt-md">
              <Text className="font-ui text-caption text-accent" numberOfLines={1}>
                {reason}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mt-md">
              <Text className="font-ui text-label text-ink">{product.price}</Text>
              {product.rating > 0 ? (
                <View className="flex-row items-center gap-xs">
                  <MaterialCommunityIcons name="star" size={13} color={palette.accent} />
                  <Text className="font-body text-body-sm text-ink-faint">
                    {product.rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableRipple
              onPress={() => onPress(product.id)}
              className="mt-md rounded-pill"
              rippleColor="rgba(124,92,255,0.12)"
            >
              <View className="border-hairline border-outline rounded-pill py-sm items-center">
                <Text className="font-ui text-label text-ink">Learn more</Text>
              </View>
            </TouchableRipple>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}
