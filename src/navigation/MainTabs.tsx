import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { FloatingTabBar } from '../components/FloatingTabBar';
import { HomeScreen } from '../screens/HomeScreen';
import { RoutineScreen } from '../screens/RoutineScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Home · Routine · Assistant · Profile (roadmap, 27 Sep). The Assistant has
 * its own tab so it is always one tap away. Scan and Progress are stack
 * screens now, opened from Home.
 */
export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Routine" component={RoutineScreen} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
