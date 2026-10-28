import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MainTabParamList } from '../navigation/types';
import { palette, shadow } from '../theme';

const BAR_HEIGHT = 64;
/** Gap between the bar and the bottom of the screen on phones with no home indicator. */
const MIN_BOTTOM = 12;

const TABS: Record<keyof MainTabParamList, { icon: string; label: string }> = {
  Home: { icon: 'home-variant-outline', label: 'Home' },
  Routine: { icon: 'clipboard-check-outline', label: 'Routine' },
  Assistant: { icon: 'chat-processing-outline', label: 'Assistant' },
  Profile: { icon: 'account-outline', label: 'Profile' },
};

/**
 * How much bottom padding a tab screen's scroll content needs so its last
 * card can scroll clear of the floating bar.
 */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(insets.bottom, MIN_BOTTOM) + 24;
}

/**
 * The floating dark pill. Rendered by the tab navigator in place of its own
 * bar; it floats over the screens rather than taking layout space, which is
 * why every tab screen pads its content with `useTabBarSpace()`.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, MIN_BOTTOM) }}
    >
      <View
        className="mx-2xl flex-row items-center rounded-pill px-[6px]"
        style={[
          shadow.card,
          {
            height: BAR_HEIGHT,
            backgroundColor: 'rgba(19,19,22,0.94)',
            shadowOpacity: 0.22,
            elevation: 8,
          },
        ]}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab = TABS[route.name as keyof MainTabParamList];
          const colour = focused ? palette.white : 'rgba(255,255,255,0.55)';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              hitSlop={4}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              className="flex-1 items-center justify-center rounded-pill"
              style={{
                height: BAR_HEIGHT - 12,
                // Lilac wash on the active tab — brand accent without leaving the dark pill.
                backgroundColor: focused ? 'rgba(124,92,255,0.28)' : 'transparent',
              }}
            >
              <MaterialCommunityIcons name={tab.icon as never} size={22} color={colour} />
              <Text className="font-ui text-[10.5px] leading-[14px] mt-[2px]" style={{ color: colour }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
