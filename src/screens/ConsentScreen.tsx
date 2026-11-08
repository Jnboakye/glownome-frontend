import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlowBackground, PrimaryButton, TextLink } from '../components';
import { RootStackParamList } from '../navigation/types';
import { grantConsent } from '../api';
import { palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Consent'>;

/**
 * GDPR consent screen for photo analysis.
 *
 * Germany treats face photos as special-category biometric/health data under
 * GDPR Article 9. This screen explains what's being processed and obtains
 * explicit consent before the user can scan their skin.
 */
export function ConsentScreen({ navigation, route }: Props) {
  const [loading, setLoading] = useState(false);
  const { onSuccess } = route.params || {};

  const handleAgree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await grantConsent('photo-analysis', '1.0');
      console.log('[Consent] Granted:', response);
      if (onSuccess) {
        onSuccess();
      } else {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(
        'Connection error',
        'Could not save your consent. Please check your connection and try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setLoading(false);
    }
  }, [navigation, onSuccess]);

  const handleDecline = useCallback(() => {
    Alert.alert(
      'Consent required',
      'Photo analysis is a core feature of Glownome. Without consent, you can browse your profile and view past scans, but you cannot take new scans.',
      [
        {
          text: 'Review consent',
          style: 'cancel',
        },
        {
          text: 'Go back',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }, [navigation]);

  return (
    <GlowBackground variant="mist">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          contentContainerClassName="px-gutter py-2xl"
          showsVerticalScrollIndicator={false}
        >
          <Text className="font-display text-[32px] leading-[38px] text-ink mb-lg">
            Your consent is needed
          </Text>

          <View className="mb-2xl">
            <Text className="font-body text-body text-ink mb-lg">
              Glownome analyses photos of your face to assess skin health and recommend products.
            </Text>

            <Text className="font-ui text-label text-ink mb-xs">
              What this means under GDPR
            </Text>
            <Text className="font-body text-body-sm text-ink-soft mb-lg">
              Face photos are classified as special-category biometric and health-related data
              under Article 9 of the GDPR. This means we need your explicit consent before we
              process them.
            </Text>

            <Text className="font-ui text-label text-ink mb-xs">
              What we do with your photos
            </Text>
            <Text className="font-body text-body-sm text-ink-soft mb-lg">
              • Your photo is sent to our secure server for analysis{'\n'}
              • We use AI to detect skin concerns (acne, dryness, redness, etc.){'\n'}
              • The analysis is stored with your account{'\n'}
              • You can view and delete your scans at any time{'\n'}
              • We never share your photos with third parties
            </Text>

            <Text className="font-ui text-label text-ink mb-xs">
              Your rights
            </Text>
            <Text className="font-body text-body-sm text-ink-soft mb-lg">
              You can withdraw consent, delete your data, or export all your data at any time
              from your Profile screen.
            </Text>

            <View className="flex-row items-center mb-md">
              <Text className="font-body text-body-sm text-ink-soft">
                Read our full{' '}
              </Text>
              <TextLink
                label="Privacy Policy"
                tone="accent"
                onPress={() => {
                  Alert.alert('Privacy Policy', 'Privacy policy will be available at launch.', [
                    { text: 'OK' },
                  ]);
                }}
              />
            </View>
          </View>

          <PrimaryButton
            label="I agree — analyse my photos"
            onPress={handleAgree}
            disabled={loading}
          />
          <View className="h-[44px] justify-center">
            <TextLink label="I decline" tone="muted" onPress={handleDecline} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
