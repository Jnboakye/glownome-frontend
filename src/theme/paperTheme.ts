import { MD3LightTheme, configureFonts } from 'react-native-paper';
import tokens from './tokens';

const { colors } = tokens;

/**
 * Paper's theme drives everything a class name cannot reach: ripple colour, MD3
 * state layers, TextInput focus and error states, Dialog and Snackbar surfaces.
 * It reads the same tokens file Tailwind does.
 */
export const paperTheme = {
  ...MD3LightTheme,
  roundness: 14,
  fonts: configureFonts({ config: { fontFamily: tokens.fonts.body } }),
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.ink,
    onPrimary: colors.white,
    primaryContainer: colors.accentSoft,
    onPrimaryContainer: colors.ink,
    secondary: colors.accent,
    onSecondary: colors.white,
    secondaryContainer: colors.accentSoft,
    onSecondaryContainer: colors.accent,
    background: colors.canvas,
    onBackground: colors.ink,
    surface: colors.surface,
    onSurface: colors.ink,
    surfaceVariant: colors.sunk,
    onSurfaceVariant: colors.inkSoft,
    outline: colors.outlineStrong,
    outlineVariant: colors.outline,
    error: colors.rose,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
    },
  },
};

export type AppTheme = typeof paperTheme;
