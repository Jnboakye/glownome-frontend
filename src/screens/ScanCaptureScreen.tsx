import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { IconButton, Text, TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FaceMesh, PrimaryButton } from '../components';
import { RootStackParamList } from '../navigation/types';
import { getScanCapability, LightingQuality, ScanCapability } from '../api/scanCapture';
import { useScanSignals } from '../hooks/useScanSignals';
import { saveScan } from '../api';
import { palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanCapture'>;

const GUIDE = 250;

/** The badge at the top. Colour and copy both come from one place. */
const LIGHTING: Record<LightingQuality, { label: string; colour: string; icon: string }> = {
  dark: { label: 'Move somewhere brighter', colour: palette.amber, icon: 'weather-night' },
  bright: { label: 'Too much glare', colour: palette.amber, icon: 'white-balance-sunny' },
  ok: { label: 'Lighting looks good', colour: palette.sage, icon: 'check-circle' },
};

export function ScanCaptureScreen({ navigation }: Props) {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capability, setCapability] = useState<ScanCapability | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { faceDetected, lighting } = useScanSignals(capability, ready);
  const canCapture = ready && faceDetected && lighting === 'ok' && !capturing;

  const hud = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getScanCapability().then(setCapability).catch(() => undefined);
  }, []);

  useEffect(() => {
    Animated.timing(hud, {
      toValue: ready ? 1 : 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hud, ready]);

  const capture = useCallback(async () => {
    if (!camera.current || capturing) return;
    setCapturing(true);
    setError(undefined);
    try {
      const photo = await camera.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
        // The server cannot read a file:// path off the phone.
        base64: true,
      });
      if (!photo?.uri) throw new Error('no image');

      // Save the capture and stop. No analysis is invented here — the Results
      // screen asks the backend, and says so plainly when there isn't one.
      // A depth map would be attached here once a native module produces one.
      const scan = await saveScan({
        photoUri: photo.uri,
        mode: capability?.mode ?? '2d-guided',
        capturedAt: new Date().toISOString(),
        base64: photo.base64 ?? undefined,
      });
      navigation.replace('Results', { scanId: scan.id });
    } catch {
      setError('That scan did not go through. Try again.');
      setCapturing(false);
    }
  }, [capability, capturing, navigation]);

  // ── permission gate ────────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 bg-ink items-center justify-center">
        <ActivityIndicator color={palette.white} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-ink">
        <StatusBar style="light" />
        <SafeAreaView className="flex-1 justify-center px-gutter">
          <Text className="font-display text-title text-white">camera access</Text>
          <Text className="font-body text-body text-white/60 mt-md max-w-[320px]">
            Glownome needs the front camera to read your skin. The photo is used for your
            analysis and nothing else.
          </Text>
          <View className="mt-2xl">
            <PrimaryButton
              label={permission.canAskAgain ? 'Allow camera' : 'Open Settings'}
              onPress={() =>
                permission.canAskAgain
                  ? void requestPermission()
                  : void Linking.openSettings()
              }
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const badge = LIGHTING[lighting];

  return (
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />

      <CameraView
        ref={camera}
        facing="front"
        style={StyleSheet.absoluteFill}
        onCameraReady={() => setReady(true)}
      />

      {/* Spotlight. A circle with an enormous border paints everything outside
          the guide, which is the cheapest way to cut a hole in a scrim. */}
      <View pointerEvents="none" style={styles.spotlightWrap}>
        <View style={styles.spotlight} />
      </View>

      <View pointerEvents="none" style={styles.guideWrap}>
        <View style={styles.guideRing} />
        <FaceMesh size={GUIDE} visible={faceDetected && !capturing} />
      </View>

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* ── top row ── */}
        <View className="flex-row items-center justify-between px-md">
          <IconButton
            icon="help-circle-outline"
            size={24}
            iconColor={palette.white}
            onPress={() => setShowTips((v) => !v)}
            accessibilityLabel="Scan tips"
          />

          <Animated.View
            className="flex-row items-center gap-xs rounded-pill px-md py-sm bg-black/45"
            style={{ opacity: hud }}
          >
            <MaterialCommunityIcons
              name={badge.icon as never}
              size={14}
              color={badge.colour}
            />
            <Text className="font-ui text-caption" style={{ color: badge.colour }}>
              {badge.label.toUpperCase()}
            </Text>
          </Animated.View>

          <IconButton
            icon="close"
            size={24}
            iconColor={palette.white}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Cancel scan"
          />
        </View>

        {showTips ? (
          <View className="mx-gutter mt-sm rounded-lg bg-black/55 p-lg">
            <Text className="font-ui text-caption text-accent mb-sm">FOR THE BEST READ</Text>
            {[
              'Face the window, not the lamp',
              'Bare skin — no makeup, no filters',
              'Fill the circle, straight on',
            ].map((tip) => (
              <Text key={tip} className="font-body text-body-sm text-white/75">
                · {tip}
              </Text>
            ))}
          </View>
        ) : null}

        <View className="flex-1" />

        {/* ── bottom ── */}
        <View className="px-gutter pb-lg items-center">
          {capturing ? (
            <View className="items-center">
              <ActivityIndicator color={palette.white} />
              <Text className="font-ui text-subheading text-white mt-md">Saving your scan…</Text>
            </View>
          ) : (
            <>
              <Text className="font-ui text-subheading text-white text-center">
                {!ready
                  ? 'Starting the camera…'
                  : !faceDetected
                    ? 'Position your face in the circle'
                    : lighting !== 'ok'
                      ? badge.label
                      : 'Hold still'}
              </Text>

              {error ? (
                <Text className="font-body text-body-sm text-rose mt-sm">{error}</Text>
              ) : null}

              <TouchableRipple
                onPress={() => void capture()}
                disabled={!canCapture}
                borderless
                accessibilityRole="button"
                accessibilityLabel="Capture scan"
                accessibilityState={{ disabled: !canCapture }}
                className="mt-xl rounded-pill"
                style={{ opacity: canCapture ? 1 : 0.4 }}
              >
                <View style={styles.shutterOuter}>
                  <View style={styles.shutterInner} />
                </View>
              </TouchableRipple>

              {capability && capability.mode === '2d-guided' ? (
                <Text className="font-ui text-caption text-white/45 mt-md">
                  2D SCAN · NO DEPTH SENSOR IN USE
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* Simulated signals must never be mistaken for real ones. */}
        {capability?.simulated && !capturing ? (
          <View className="items-center pb-sm">
            <View className="rounded-pill bg-accent/25 px-md py-[3px]">
              <Text className="font-ui text-caption text-white/80">
                SIMULATED · FACE + METERING NEED A DEV BUILD
              </Text>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  spotlightWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  spotlight: {
    width: GUIDE,
    height: GUIDE * 1.12,
    borderRadius: GUIDE,
    borderWidth: 900,
    borderColor: 'rgba(9,9,11,0.62)',
  },
  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guideRing: {
    position: 'absolute',
    width: GUIDE,
    height: GUIDE * 1.12,
    borderRadius: GUIDE,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 76,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 60, backgroundColor: '#FFFFFF' },
});
