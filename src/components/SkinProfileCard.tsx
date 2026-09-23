import React from 'react';
import { View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { palette, shadow } from '../theme';

export type ProfileRow = {
  icon: string;
  label: string;
  value: string;
  /** Set when the value came from the questionnaire rather than the photo. */
  fromYou?: boolean;
};

/**
 * What we know about this skin, and where each line came from. The provenance
 * tag matters: "you told us" and "we read it in the photo" are different kinds
 * of claim, and a user should be able to tell them apart.
 */
export function SkinProfileCard({ rows }: { rows: ProfileRow[] }) {
  return (
    <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
      <Card.Content className="py-sm">
        {rows.map((row, i) => (
          <View key={row.label}>
            {i > 0 ? <Divider className="bg-outline" /> : null}
            <View className="flex-row items-start py-lg">
              <View className="w-[34px] h-[34px] rounded-pill bg-accent-soft items-center justify-center mr-lg">
                <MaterialCommunityIcons
                  name={row.icon as never}
                  size={17}
                  color={palette.accent}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-sm">
                  <Text className="font-ui text-caption text-ink-faint">
                    {row.label.toUpperCase()}
                  </Text>
                  {row.fromYou ? (
                    <Text className="font-ui text-caption text-accent">· FROM YOU</Text>
                  ) : null}
                </View>
                <Text className="font-ui text-subheading text-ink mt-[2px]">{row.value}</Text>
              </View>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}
