import { ApiError, isLiveBackend, request } from './client';
import { ScanRecord } from './scans';
import { SkinAnalysis } from './types';

/**
 * Thrown when there is no analysis to be had — no backend configured, the
 * server unreachable, or the scan never made it to the server.
 *
 * The screens catch this and show a "not connected yet" state rather than
 * inventing a result. Nothing in this app fabricates a skin reading.
 */
export class AnalysisUnavailableError extends Error {
  constructor(message = 'No analysis backend configured.') {
    super(message);
    this.name = 'AnalysisUnavailableError';
  }
}

/**
 * Sends a captured scan for analysis.
 *
 * The scan must already exist server-side — `saveScan` uploads the photo and
 * takes the server's uuid as the scan id. Only that id is sent here; the
 * server already has the photo and the user's answers.
 *
 * The response is `SkinAnalysis` exactly as ./types.ts defines it. The backend
 * conforms to that file, so there is nothing to reshape on arrival.
 *
 * The API key belongs on the server. Never ship it in the app bundle — anything
 * in a React Native binary is readable by anyone who downloads it.
 */
export async function requestAnalysis(scan: ScanRecord): Promise<SkinAnalysis> {
  if (!isLiveBackend()) throw new AnalysisUnavailableError();

  if (scan.synced === false) {
    throw new AnalysisUnavailableError('This scan was never uploaded, so it cannot be analysed.');
  }

  try {
    return await request<SkinAnalysis>('/analyses', {
      method: 'POST',
      body: JSON.stringify({ scanId: scan.id }),
    });
  } catch (error) {
    // 503 is the server saying Claude is unreachable or unconfigured, and 404
    // that it has no such scan. Both are "no analysis", not a crash.
    if (error instanceof ApiError && (error.status === 503 || error.status === 404)) {
      throw new AnalysisUnavailableError(error.message);
    }
    throw error;
  }
}
