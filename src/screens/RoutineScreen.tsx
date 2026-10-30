import React from 'react';
import { ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, GlowBackground, useTabBarSpace } from '../components';

/** Placeholder until R2. Honest about it — no sample steps. */
export function RoutineScreen() {
  const bottomSpace = useTabBarSpace();
  return (
    <GlowBackground variant="mist">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="flex-grow"
          contentContainerStyle={{ paddingBottom: bottomSpace }}
        >
          <Text
            accessibilityRole="header"
            className="font-display text-title text-ink px-gutter mt-lg"
          >
            routine
          </Text>
          <EmptyState
            icon="clipboard-check-outline"
            title="Routines are on the way"
            body="Morning and night steps with a daily check-off, built from your scans. Not built yet."
          />
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
