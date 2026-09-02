const { colors, spacing, radius, fonts, fontSize } = require('./src/theme/tokens');

/**
 * Glownome's Tailwind config reads the same token file the Paper theme does, so
 * a colour or size is declared in exactly one place.
 *
 * The colour, spacing, radius and type scales are REPLACED, not extended. If a
 * class exists, it is a Glownome value — which is what stops `p-4` (16) quietly
 * being used where the design calls for the 26pt gutter.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      transparent: 'transparent',
      ink: colors.ink,
      'ink-soft': colors.inkSoft,
      'ink-faint': colors.inkFaint,
      white: colors.white,
      surface: colors.surface,
      canvas: colors.canvas,
      sunk: colors.sunk,
      outline: colors.outline,
      'outline-strong': colors.outlineStrong,
      accent: colors.accent,
      'accent-soft': colors.accentSoft,
      sage: colors.sage,
      'sage-soft': colors.sageSoft,
      amber: colors.amber,
      'amber-soft': colors.amberSoft,
      rose: colors.rose,
      'rose-soft': colors.roseSoft,
    },
    spacing,
    borderRadius: radius,
    fontFamily: fonts,
    fontSize,
    extend: {
      borderWidth: { hairline: 1, DEFAULT: 1, thick: 1.2 },
    },
  },
  plugins: [],
};
