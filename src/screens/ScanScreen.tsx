import React, { useCallback, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BackBar, GlowBackground, PrimaryButton, ScreenHeader } from '../components';
import { RootStackParamList } from '../navigation/types';
import { saveScan } from '../api';
import { firstNameOf, useUser } from '../hooks/userContext';
import { palette, shadow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TIPS = [
  'Natural light, facing a window if you can',
  'Bare skin — no makeup, no filters',
  'Hold steady, straight on, from about arm’s length',
];

export function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const { name } = useUser();
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [photoBase64, setPhotoBase64] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const busy = saving || picking;

  const pickFromLibrary = useCallback(async () => {
    setError(undefined);
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo access is off. Enable it in Settings to choose a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
        // The server needs the bytes, not a file:// path the phone owns.
        base64: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(result.assets[0].base64 ?? undefined);
      }
    } catch {
      setError('Something went wrong opening your library. Please try again.');
    } finally {
      setPicking(false);
    }
  }, []);

  const useThisPhoto = useCallback(async () => {
    if (!photoUri || busy) return;
    setSaving(true);
    setError(undefined);
    try {
      const scan = await saveScan({
        photoUri,
        mode: '2d-guided',
        capturedAt: new Date().toISOString(),
        base64: photoBase64,
      });
      navigation.navigate('Results', { scanId: scan.id });
    } catch {
      setError('That photo could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [busy, navigation, photoBase64, photoUri]);

  const clearPhoto = useCallback(() => {
    if (busy) return;
    setPhotoUri(undefined);
    setPhotoBase64(undefined);
    setError(undefined);
  }, [busy]);

  return (
    <GlowBackground>
      <SafeAreaView className="flex-1" edges={['top']}>
        <BackBar />
        <ScrollView contentContainerClassName="pb-huge" showsVerticalScrollIndicator={false}>
          <ScreenHeader
            eyebrow={firstNameOf(name) ? `Hello, ${firstNameOf(name)}` : 'Step one'}
            title="Scan your skin"
            subtitle="One clear photo is all it takes. It is sent privately for analysis, and a copy stays on this phone."
          />

          <View className="px-gutter">
            <View className="w-full max-h-[340px] aspect-[3/4] self-center rounded-xl bg-white/60 border-thick border-outline overflow-hidden">
              {photoUri ? (
                <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center p-2xl">
                  <View className="w-[52px] h-[52px] rounded-pill bg-accent-soft items-center justify-center mb-md">
                    <MaterialCommunityIcons
                      name="camera-outline"
                      size={24}
                      color={palette.accent}
                    />
                  </View>
                  <Text className="font-title text-heading text-ink-soft">No photo yet</Text>
                  <Text className="font-body text-body-sm text-ink-faint mt-xs text-center">
                    Open the camera, or pick one from your library
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Card mode="contained" className="mx-gutter mt-xl bg-surface rounded-lg" style={shadow.card}>
            <Card.Content>
              <Text className="font-ui text-caption text-accent mb-md">FOR THE BEST READ</Text>
              {TIPS.map((tip) => (
                <View key={tip} className="flex-row items-start mb-sm">
                  <View className="w-[5px] h-[5px] rounded-pill bg-accent mt-[8px] mr-md" />
                  <Text className="font-body text-body-sm text-ink-soft flex-1">{tip}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>

          {error ? (
            <Text
              accessibilityLiveRegion="polite"
              className="font-body text-body-sm text-rose mx-gutter mt-lg"
            >
              {error}
            </Text>
          ) : null}

          <View className="px-gutter mt-2xl">
            <PrimaryButton
              label="Open the camera"
              icon="camera-iris"
              onPress={() => navigation.navigate('ScanCapture')}
              disabled={busy}
              className="mb-md"
            />
            <PrimaryButton
              label={picking ? 'Opening library…' : 'Choose from library'}
              icon="image-outline"
              variant="outline"
              onPress={() => void pickFromLibrary()}
              disabled={busy}
              loading={picking}
              className="mb-md"
            />
            {photoUri ? (
              <>
                <PrimaryButton
                  label={saving ? 'Saving…' : 'Use this photo'}
                  onPress={() => void useThisPhoto()}
                  loading={saving}
                  disabled={busy}
                  className="mb-md"
                />
                <PrimaryButton
                  label="Choose a different photo"
                  variant="outline"
                  onPress={clearPhoto}
                  disabled={busy}
                />
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
