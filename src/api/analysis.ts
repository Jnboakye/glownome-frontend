import { SkinAnalysis } from './types';
import { delay } from './client';
import { buildMockAnalysis } from '../data/analysis';

const cache = new Map<string, SkinAnalysis>();

/**
 * Sends the captured photo for analysis.
 *
 * Live implementation will POST the image to the backend, which calls the
 * Claude vision API and returns a SkinAnalysis. Until then this resolves a
 * realistic mock after a short delay so loading states behave correctly.
 */
export async function analyseSkin(photoUri?: string): Promise<SkinAnalysis> {
  const analysis = buildMockAnalysis(photoUri);
  cache.set(analysis.id, analysis);
  return delay(analysis, 1600);
}

export async function getAnalysis(id: string): Promise<SkinAnalysis> {
  const cached = cache.get(id);
  if (cached) return cached;
  const fallback = buildMockAnalysis();
  cache.set(id, fallback);
  return fallback;
}

export function getCachedAnalysis(id: string): SkinAnalysis | undefined {
  return cache.get(id);
}
