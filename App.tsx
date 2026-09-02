import './global.css';
import './src/theme/paperInterop';

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palette, paperTheme } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Outfit_600SemiBold,
  });

  return (
    <SafeAreaProvider>
      <PaperProvider
        theme={paperTheme}
        settings={{
          // Paper resolves icons through this so the app never needs
          // react-native-vector-icons as a separate dependency.
          icon: ({ name, color, size }) => (
            <MaterialCommunityIcons name={name as never} color={color} size={size} />
          ),
        }}
      >
        {fontsLoaded ? (
          <RootNavigator />
        ) : (
          <View className="flex-1 items-center justify-center bg-canvas">
            <ActivityIndicator color={palette.ink} />
          </View>
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
