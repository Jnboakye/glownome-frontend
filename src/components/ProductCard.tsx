import React from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Product } from '../api/types';
import { shadow } from '../theme';

type Props = { product: Product; onPress: () => void };

export function ProductCard({ product, onPress }: Props) {
  return (
    <Card
      mode="contained"
      onPress={onPress}
      className="bg-surface rounded-lg mb-md"
      style={shadow.card}
    >
      <Card.Content className="flex-row py-lg px-lg">
        {/* Swatch tile stands in for product photography — no image assets, no broken URLs. */}
        <View
          className="w-[68px] h-[82px] rounded-md items-center justify-center mr-lg"
          style={{ backgroundColor: product.swatch }}
        >
          <Text className="font-title text-[24px] text-ink/40">{product.brand.charAt(0)}</Text>
        </View>

        <View className="flex-1 justify-center">
          <Text className="font-ui text-caption text-ink-faint">
            {product.brand.toUpperCase()}
          </Text>
          <Text className="font-ui text-subheading text-ink mt-px" numberOfLines={2}>
            {product.name}
          </Text>
          <Text className="font-body text-body-sm text-ink-soft mt-xs" numberOfLines={2}>
            {product.blurb}
          </Text>

          <View className="flex-row items-center mt-md">
            <Text className="font-ui text-label text-ink">{product.price}</Text>
            <View className="ml-md bg-accent-soft px-[10px] py-[3px] rounded-pill">
              <Text className="font-ui text-caption text-accent">{product.matchScore}% MATCH</Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}
