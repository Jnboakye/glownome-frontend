/**
 * The single source of truth for Glownome's visual design.
 *
 * Plain CommonJS on purpose: tailwind.config.js (loaded by Metro, outside the
 * TypeScript pipeline) and the React Native Paper theme both read this file, so
 * the palette can never drift between the two systems. Change a value here and
 * it lands on Tailwind classes and Paper components at the same time.
 *
 * Types live alongside in tokens.d.ts.
 */

/**
 * Near-monochrome by design: cool off-white greys, a true near-black, and a
 * single electric lilac carrying every piece of emphasis. Skin photography is
 * the most saturated thing on any screen, so the interface stays colourless.
 */
const colors = {
  ink: '#131316',
  inkSoft: '#4A4A52',
  inkFaint: '#86868F',

  white: '#FFFFFF',
  surface: '#FFFFFF',
  canvas: '#F8F8FA',
  sunk: '#EDEDF0',

  outline: '#E4E4E8',
  outlineStrong: '#D3D3DA',

  /** The only brand hue. */
  accent: '#7C5CFF',
  accentSoft: '#EDE9FF',

  /** Semantic score tones. Never used decoratively. */
  sage: '#3F8F6A',
  sageSoft: '#E1F0E9',
  amber: '#A98530',
  amberSoft: '#F5EDD9',
  rose: '#C0566E',
  roseSoft: '#F8E4E9',
};

const gradients = {
  /** Onboarding and Scan — a lilac wash falling through cool grey. */
  glow: ['#FBFBFC', '#F2F0FA', '#EAE8F5', '#EDEDF1', '#F6F6F8'],
  glowLocations: [0, 0.26, 0.5, 0.78, 1],
  /** Results, Progress, Profile — the same family, flattened for long content. */
  mist: ['#FCFCFD', '#F6F5FA', '#F2F2F5'],
  mistLocations: [0, 0.45, 1],
};

/**
 * A 4pt base. `gutter` is the screen margin — wider than the 16 or 20 most apps
 * use, taken from the onboarding design, and it is what gives every screen its
 * unhurried feel.
 *
 * This REPLACES Tailwind's numeric scale rather than extending it, so there is
 * no `p-4` to reach for by habit where the design calls for `px-gutter`.
 */
const spacing = {
  0: 0,
  px: 1,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  gutter: 26,
  '3xl': 32,
  huge: 40,
};

const radius = {
  none: 0,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 9999,
};

/**
 * In React Native the weight comes from the font file, not a font-weight
 * property — so these are families. The names deliberately avoid Tailwind's own
 * weight scale (font-medium, font-bold …) to prevent a class collision.
 */
const fonts = {
  body: 'Poppins_400Regular',
  ui: 'Poppins_500Medium',
  title: 'Poppins_600SemiBold',
  display: 'Poppins_700Bold',
  /**
   * The wordmark face — used for the Glownome logotype and nothing else.
   * Outfit is tighter and more geometric than Poppins, which is what makes it
   * read as a logo rather than as a heading. Swap this one value to change the
   * logotype; alternatives worth trying are 'Sora_600SemiBold' (more technical)
   * and 'InstrumentSerif_400Regular' (editorial, beauty-adjacent).
   */
  wordmark: 'Outfit_600SemiBold',
};

/** [fontSize, { lineHeight, letterSpacing }] — the tuple shape Tailwind expects. */
const fontSize = {
  display: ['40px', { lineHeight: '46px', letterSpacing: '-0.8px' }],
  title: ['28px', { lineHeight: '34px', letterSpacing: '-0.4px' }],
  heading: ['20px', { lineHeight: '26px', letterSpacing: '-0.2px' }],
  subheading: ['17px', { lineHeight: '24px' }],
  body: ['15px', { lineHeight: '23px' }],
  'body-sm': ['13.5px', { lineHeight: '20px' }],
  label: ['14px', { lineHeight: '20px' }],
  caption: ['11.5px', { lineHeight: '16px', letterSpacing: '0.4px' }],
};

module.exports = { colors, gradients, spacing, radius, fonts, fontSize };
