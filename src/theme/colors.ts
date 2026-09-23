import tokens from './tokens';

/** The palette, for the places a class name cannot reach: Paper's theme, native props, gradients. */
export const palette = tokens.colors;

export const glowGradient = tokens.gradients.glow;
export const glowLocations = tokens.gradients.glowLocations;
export const mistGradient = tokens.gradients.mist;
export const mistLocations = tokens.gradients.mistLocations;

export type ScoreTone = { color: string; soft: string; bar: string; label: string };

/**
 * Score bands. One function so a 62 means the same thing on the Results
 * breakdown, the weekly chart and the progress cards.
 *
 * `bar` and `soft` are class names rather than hex, so the tone can be applied
 * with className where the value is dynamic.
 */
/**
 * The sentence that goes under the score. Lives beside toneForScore so the
 * colour and the words can never disagree about the same number.
 */
export function interpretationForScore(score: number): string {
  if (score >= 75) return 'Healthy';
  if (score >= 50) return 'Good, with some concerns';
  return 'Needs attention';
}

export function toneForScore(score: number): ScoreTone {
  if (score >= 75) {
    return { color: palette.sage, soft: 'bg-sage-soft', bar: 'bg-sage', label: 'thriving' };
  }
  if (score >= 50) {
    return { color: palette.amber, soft: 'bg-amber-soft', bar: 'bg-amber', label: 'balanced' };
  }
  return { color: palette.rose, soft: 'bg-rose-soft', bar: 'bg-rose', label: 'needs care' };
}
