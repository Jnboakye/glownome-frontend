import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Card, Divider, List, Switch, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GlowBackground, PrimaryButton, SectionTitle, useTabBarSpace } from '../components';
import { RootStackParamList } from '../navigation/types';
import { useOnboardingContext } from '../hooks/onboardingContext';
import { clearScans, listScans } from '../api';
import { initialsOf, useUser } from '../hooks/userContext';
import { labelFor } from '../data/onboardingQuestions';
import { fonts, palette, shadow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// List.Item renders its own title and description internals, which no class
// name reaches — these are the style objects Paper expects for them.
const itemTitle = { fontFamily: fonts.ui, fontSize: 15, color: palette.ink };
const itemDescription = { fontFamily: fonts.body, fontSize: 13, color: palette.inkFaint };

const PRIVACY_BODY =
  'Scan photos stay on this phone unless you choose to upload them for analysis. ' +
  'Scores and answers are used only to personalise your read. A fuller privacy policy will land here before launch.';

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { reset } = useOnboardingContext();
  const { name, profile, clear: clearUser } = useUser();
  // Local preferences until push notifications ship — toggles are honest about that.
  const [scanReminders, setScanReminders] = useState(false);
  const [routineNudges, setRoutineNudges] = useState(false);
  const [storePhotos, setStorePhotos] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const bottomSpace = useTabBarSpace();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listScans().then((scans) => {
        if (!cancelled) setScanCount(scans.length);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const initials = initialsOf(name);

  const wipeLocalData = useCallback(async () => {
    await clearUser();
    await clearScans();
    await reset();
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  }, [clearUser, navigation, reset]);

  const onReplayOnboarding = useCallback(() => {
    Alert.alert(
      'Replay the intro?',
      'This clears your name, answers and every scan on this device, then starts onboarding again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replay',
          style: 'destructive',
          onPress: () => {
            void wipeLocalData();
          },
        },
      ],
    );
  }, [wipeLocalData]);

  const onLogout = useCallback(() => {
    Alert.alert(
      'Log out',
      'This clears your name, your answers and every scan on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void wipeLocalData();
          },
        },
      ],
    );
  }, [wipeLocalData]);

  const onPrivacy = useCallback(() => {
    Alert.alert('How your skin data is used', PRIVACY_BODY, [{ text: 'Got it' }]);
  }, []);

  return (
    <GlowBackground variant="mist">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomSpace }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            accessibilityRole="header"
            className="font-display text-title text-ink px-gutter mt-lg"
          >
            profile
          </Text>

          <View className="px-gutter mt-xl mb-2xl">
            <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
              <Card.Content className="flex-row items-center py-sm">
                <View className="w-[56px] h-[56px] rounded-pill bg-accent-soft items-center justify-center mr-lg">
                  <Text className="font-title text-[19px] text-accent">{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-title text-heading text-ink">
                    {name ?? 'Your profile'}
                  </Text>
                  {/* No auth yet — say so rather than invent an email address. */}
                  <Text className="font-body text-body-sm text-ink-faint mt-px">
                    Not signed in
                  </Text>
                </View>
              </Card.Content>
              <Divider className="bg-outline" />
              <Card.Content className="flex-row py-lg gap-lg">
                <View className="flex-[2]">
                  <Text className="font-ui text-caption text-ink-faint mb-px">MAIN CONCERN</Text>
                  <Text className="font-ui text-label text-ink" numberOfLines={2}>
                    {profile?.concern?.length ? labelFor('concern', profile.concern) : 'Not set'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-ui text-caption text-ink-faint mb-px">SCANS</Text>
                  <Text className="font-ui text-label text-ink">{scanCount}</Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          <View className="px-gutter mb-2xl">
            <SectionTitle title="Notifications" />
            <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
              <List.Item
                title="Weekly scan reminder"
                description="Coming with push notifications"
                titleStyle={itemTitle}
                descriptionStyle={itemDescription}
                right={() => (
                  <Switch
                    value={scanReminders}
                    onValueChange={setScanReminders}
                    color={palette.accent}
                    disabled
                  />
                )}
              />
              <Divider className="bg-outline" />
              <List.Item
                title="Routine nudges"
                description="Coming with push notifications"
                titleStyle={itemTitle}
                descriptionStyle={itemDescription}
                right={() => (
                  <Switch
                    value={routineNudges}
                    onValueChange={setRoutineNudges}
                    color={palette.accent}
                    disabled
                  />
                )}
              />
            </Card>
          </View>

          <View className="px-gutter mb-2xl">
            <SectionTitle title="Privacy" />
            <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
              <List.Item
                title="Store scan photos"
                description="On for progress views — clearing them lands with a later privacy pass"
                titleStyle={itemTitle}
                descriptionStyle={itemDescription}
                right={() => (
                  <Switch
                    value={storePhotos}
                    onValueChange={setStorePhotos}
                    color={palette.accent}
                    disabled
                  />
                )}
              />
              <Divider className="bg-outline" />
              <List.Item
                title="How my skin data is used"
                titleStyle={itemTitle}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={onPrivacy}
                accessibilityRole="button"
              />
            </Card>
          </View>

          <View className="px-gutter mb-2xl">
            <SectionTitle title="App" />
            <Card mode="contained" className="bg-surface rounded-lg" style={shadow.card}>
              <List.Item
                title="Replay the intro"
                description="Clears local data and starts onboarding again"
                titleStyle={itemTitle}
                descriptionStyle={itemDescription}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={onReplayOnboarding}
              />
              <Divider className="bg-outline" />
              <List.Item
                title="Version"
                titleStyle={itemTitle}
                right={() => (
                  <Text className="font-body text-body-sm text-ink-faint self-center">
                    1.0.0 (MVP)
                  </Text>
                )}
              />
            </Card>
          </View>

          <View className="px-gutter mb-2xl">
            <PrimaryButton label="Log out" variant="outline" onPress={onLogout} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlowBackground>
  );
}
