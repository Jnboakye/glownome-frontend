import tokens from './tokens';

/**
 * React Native shadows are native props, not a CSS box-shadow, so this stays a
 * style object. One definition, applied through the `shadow.card` spread.
 */
export const shadow = {
  card: {
    shadowColor: tokens.colors.ink,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
} as const;
