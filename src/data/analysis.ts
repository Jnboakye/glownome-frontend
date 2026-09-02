import { SkinAnalysis } from '../api/types';

/**
 * Stand-in for the Claude vision response. The shape here is the contract the
 * screens are written against — keep it stable when the real endpoint lands.
 */
export function buildMockAnalysis(photoUri?: string): SkinAnalysis {
  return {
    id: `scan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    photoUri,
    overallScore: 72,
    skinType: 'Combination, dehydrated',
    headline: 'your barrier is asking for water, not oil',
    summary:
      'Hydration is the limiting factor right now. The shine along your T-zone is the skin overcompensating for water loss rather than true oiliness, which is why a richer cream alone has not settled it. Tone and texture are both in good shape, so the routine below is deliberately short — three steps, held for four weeks, then rescan.',
    metrics: [
      { key: 'hydration', label: 'Hydration', score: 48, note: 'Low. Tightness after cleansing is the clearest sign.' },
      { key: 'oiliness', label: 'Oil balance', score: 61, note: 'Midday shine across the T-zone, cheeks are dry.' },
      { key: 'texture', label: 'Texture', score: 78, note: 'Smooth overall with slight roughness on the chin.' },
      { key: 'redness', label: 'Calmness', score: 66, note: 'Mild flush around the nose and outer cheeks.' },
      { key: 'pores', label: 'Pores', score: 71, note: 'Visible but not congested around the nose.' },
      { key: 'darkSpots', label: 'Even tone', score: 82, note: 'A few faded post-blemish marks, nothing active.' },
    ],
    recommendedProductIds: ['p-hydra-serum', 'p-spf', 'p-gentle-cleanser', 'p-barrier-cream'],
  };
}
