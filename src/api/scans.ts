import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLiveBackend, request } from './client';
import { getUserId } from './identity';
import { CaptureMode, ScanCaptureResult } from './scanCapture';
import { SkinAnalysis } from './types';

const KEY = 'glownome.scans.v1';

/**
 * A captured scan, kept on the device.
 *
 * This is the real thing — an actual photo the user took. `analysis` stays null
 * until the Claude-backed endpoint returns something. Nothing here is invented.
 */
export interface ScanRecord {
  id: string;
  photoUri: string;
  mode: CaptureMode;
  capturedAt: string;
  /** null until the analysis backend has answered for this scan. */
  analysis: SkinAnalysis | null;
  /**
   * True once the server has a row for this scan, and `id` is therefore the
   * server's uuid. False for a scan taken while the backend was unreachable:
   * it is kept on the device, but it can never be analysed, because
   * POST /analyses looks the id up in Postgres.
   */
  synced?: boolean;
}

/**
 * The server stores `2d` / `3d`; the capture layer speaks in terms of how the
 * shot was guided. Mapping here keeps that vocabulary out of the wire format.
 */
function wireMode(mode: CaptureMode): '2d' | '3d' {
  return mode === '3d-depth' ? '3d' : '2d';
}

/**
 * Turn a capture into something the server can actually read.
 *
 * Both capture paths hand over base64 already. The fetch fallback is for any
 * caller that does not — RN resolves file:// through fetch.
 */
async function toDataUri(photoUri: string, base64?: string): Promise<string> {
  if (base64) return `data:image/jpeg;base64,${base64}`;

  const response = await fetch(photoUri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the captured photo'));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

async function readAll(): Promise<ScanRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(scans: ScanRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(scans));
  } catch {
    // Non-fatal: the scan simply won't survive a restart.
  }
}

/** Newest first. */
export async function listScans(): Promise<ScanRecord[]> {
  const scans = await readAll();
  return [...scans].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export async function getScan(id: string): Promise<ScanRecord | null> {
  const scans = await readAll();
  return scans.find((s) => s.id === id) ?? null;
}

export async function saveScan(capture: ScanCaptureResult): Promise<ScanRecord> {
  let id = `scan-${Date.now()}`;
  let synced = false;

  if (isLiveBackend()) {
    try {
      const dataUri = await toDataUri(capture.photoUri, capture.base64);
      const created = await request<{ scanId: string; storedAt: string }>('/scans', {
        method: 'POST',
        body: JSON.stringify({
          photoUri: dataUri,
          mode: wireMode(capture.mode),
          capturedAt: capture.capturedAt,
          userId: await getUserId(),
        }),
      });
      // The server's uuid becomes the scan's identity — POST /analyses looks
      // the scan up by it, and a locally-minted `scan-<timestamp>` id is not a
      // uuid, so it could never match a row.
      id = created.scanId;
      synced = true;
    } catch {
      // Backend down or unreachable. Keep the photo rather than losing it; the
      // Results screen will say the analysis is unavailable, which is true.
    }
  }

  const record: ScanRecord = {
    id,
    // Deliberately the local uri, not the uploaded one: the image then renders
    // instantly and still renders with no connection.
    photoUri: capture.photoUri,
    mode: capture.mode,
    capturedAt: capture.capturedAt,
    analysis: null,
    synced,
  };
  const scans = await readAll();
  await writeAll([...scans, record]);
  return record;
}

/** Called once the analysis endpoint answers for a scan. */
export async function attachAnalysis(id: string, analysis: SkinAnalysis): Promise<void> {
  const scans = await readAll();
  await writeAll(scans.map((s) => (s.id === id ? { ...s, analysis } : s)));
}

export async function clearScans(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Non-fatal.
  }
}
