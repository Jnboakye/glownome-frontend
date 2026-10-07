import { ApiError, isLiveBackend, request } from './client';
import { attachAnalysis, PhotoMissingError, ScanRecord, syncScan } from './scans';
import { SkinAnalysis } from './types';

/**
 * Why there is no analysis to show. Each one gets its own message on screen,
 * because each one asks something different of the user.
 *
 *   no-backend     the app has no API URL configured (development only)
 *   offline        no response at all — Wi-Fi, server down, wrong LAN IP
 *   not-uploaded   the scan is still only on this phone and could not be sent
 *   photo-missing  the scan was never uploaded and its photo is gone
 *   unavailable    the server answered 503 — Claude unreachable/unconfigured
 *   not-found      the server has no such scan (404)
 *   failed         anything else the server rejected
 */
export type AnalysisErrorKind =
  | 'no-backend'
  | 'offline'
  | 'not-uploaded'
  | 'photo-missing'
  | 'unavailable'
  | 'not-found'
  | 'failed';

/**
 * Thrown when there is no analysis to be had. Nothing in this app fabricates
 * a skin reading — the screens show `kind` honestly instead.
 */
export class AnalysisError extends Error {
  readonly kind: AnalysisErrorKind;

  constructor(kind: AnalysisErrorKind, message: string) {
    super(message);
    this.name = 'AnalysisError';
    this.kind = kind;
  }
}

/** Any error, reduced to the kind a screen should explain. */
export function analysisErrorKind(error: unknown): AnalysisErrorKind {
  if (error instanceof AnalysisError) return error.kind;
  if (error instanceof ApiError && error.status === 0) return 'offline';
  return 'failed';
}

/**
 * Sends a captured scan for analysis.
 *
 * The scan must already exist server-side — only its id is sent; the server
 * has the photo and the user's answers. The response is `SkinAnalysis` exactly
 * as ./types.ts defines it.
 *
 * The API key belongs on the server. Never ship it in the app bundle — anything
 * in a React Native binary is readable by anyone who downloads it.
 */
export async function requestAnalysis(scan: ScanRecord): Promise<SkinAnalysis> {
  if (!isLiveBackend()) {
    throw new AnalysisError('no-backend', 'No analysis backend configured.');
  }
  if (scan.synced === false) {
    throw new AnalysisError('not-uploaded', 'This scan has not been uploaded yet.');
  }

  try {
    return await request<SkinAnalysis>('/analyses', {
      method: 'POST',
      body: JSON.stringify({ scanId: scan.id }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 0) throw new AnalysisError('offline', error.message);
      if (error.status === 503) throw new AnalysisError('unavailable', error.message);
      if (error.status === 404) throw new AnalysisError('not-found', error.message);
      throw new AnalysisError('failed', error.message);
    }
    throw error;
  }
}

/**
 * The analysis for a scan — from the device if it has one, otherwise from the
 * server, exactly once.
 *
 *   1. Saved on the scan already → returned, no network call.
 *   2. Scan never uploaded → uploaded now (the scan's id becomes the server's).
 *   3. POST /analyses → saved on the scan → returned.
 *
 * Returns the scan as well, because step 2 changes its id. Throws
 * `AnalysisError` with the reason when there is no analysis.
 */
export async function analyseScan(
  scan: ScanRecord,
): Promise<{ scan: ScanRecord; analysis: SkinAnalysis }> {
  if (scan.analysis) return { scan, analysis: scan.analysis };
  if (!isLiveBackend()) {
    throw new AnalysisError('no-backend', 'No analysis backend configured.');
  }

  let current = scan;
  if (current.synced === false) {
    try {
      current = await syncScan(current);
    } catch (error) {
      if (error instanceof PhotoMissingError) {
        throw new AnalysisError('photo-missing', error.message);
      }
      if (error instanceof ApiError && error.status === 0) {
        throw new AnalysisError('offline', error.message);
      }
      throw new AnalysisError('not-uploaded', error instanceof Error ? error.message : 'Upload failed.');
    }
  }

  const analysis = await requestAnalysis(current);
  await attachAnalysis(current.id, analysis);
  return { scan: { ...current, analysis }, analysis };
}
