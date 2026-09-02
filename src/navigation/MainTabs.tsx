import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MainTabParamList } from './types';
import { ScanScreen } from '../screens/ScanScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { fonts, palette } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Scan: 'camera-iris',
  Progress: 'chart-timeline-variant',
  Profile: 'account-outline',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.inkFaint,
        // Navigator options take style objects, not class names.
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={ICONS[route.name] as never}
            color={color}
            size={size ?? 24}
          />
        ),
      })}
    >
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: palette.surface,
    borderTopColor: palette.outline,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 88 : 66,
    paddingTop: 8,
  },
  label: { fontFamily: fonts.ui, fontSize: 11.5, marginTop: 2 },
});
