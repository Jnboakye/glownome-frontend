import React from 'react';
import { ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, GlowBackground, useTabBarSpace } from '../components';

/** Placeholder until R4. No sample conversation. */
export function AssistantScreen() {
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
            assistant
          </Text>
          <EmptyState
            icon="chat-processing-outline"
            title="Ask about your skin"
            body="A chat that knows your scans and your routine is being built. It won't replace a dermatologist."
          />
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}