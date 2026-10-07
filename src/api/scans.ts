import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, isLiveBackend, request } from './client';
import { ensureUserId, isUnknownUser, renewUserId } from './identity';
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
   * it is kept on the device and uploaded later by `syncScan()` (on app start,
   * and before an analysis), because POST /analyses looks the id up in
   * Postgres and a local `scan-<timestamp>` id can never match a row.
   */
  synced?: boolean;
}

/**
 * The wire value for `mode`. Scans are 2D only, and the server accepts only
 * `2d` (anything else is a 422). The field stays on the API so 3D can return
 * without a break; the parameter stays so that change is local to here.
 */
function wireMode(_mode: CaptureMode): '2d' {
  return '2d';
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
  if (blob.size === 0) throw new Error('The photo file is empty or missing');
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
    // Non-fatal: the change simply won't survive a restart.
  }
}

/** The tail of the write queue. */
let writing: Promise<unknown> = Promise.resolve();

/**
 * Read, change, write — one at a time.
 *
 * A background retry, a new capture and a finished analysis can all touch the
 * list at once. Each read-modify-write waits for the previous one, so no
 * change overwrites another. Never await a network call inside `change`.
 */
function mutate<T>(change: (scans: ScanRecord[]) => { scans: ScanRecord[]; result: T }): Promise<T> {
  const run = writing.then(async () => {
    const { scans, result } = change(await readAll());
    await writeAll(scans);
    return result;
  });
  writing = run.catch(() => undefined);
  return run;
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

/**
 * Put one photo on the server and return the server's scan id.
 *
 * Every scan belongs to a profile — made now if the wizard was skipped or
 * couldn't reach the server. If the server no longer knows the stored id
 * (e.g. the database was reset), no photo was stored — the server checks
 * first — so a new profile is made and the upload is tried exactly once more.
 *
 * Throws on anything else, including "server unreachable".
 */
async function upload(dataUri: string, mode: CaptureMode, capturedAt: string): Promise<string> {
  const post = (userId: string | null) =>
    request<{ scanId: string; storedAt: string }>('/scans', {
      method: 'POST',
      body: JSON.stringify({ photoUri: dataUri, mode: wireMode(mode), capturedAt, userId }),
    });

  const userId = await ensureUserId();
  try {
    return (await post(userId)).scanId;
  } catch (error) {
    if (!userId || !isUnknownUser(error)) throw error;
    return (await post(await renewUserId(userId))).scanId;
  }
}

export async function saveScan(capture: ScanCaptureResult): Promise<ScanRecord> {
  let id = `scan-${Date.now()}`;
  let synced = false;

  if (isLiveBackend()) {
    try {
      // The server's uuid becomes the scan's identity — POST /analyses looks
      // the scan up by it.
      const dataUri = await toDataUri(capture.photoUri, capture.base64);
      id = await upload(dataUri, capture.mode, capture.capturedAt);
      synced = true;
    } catch {
      // Backend down or unreachable. Keep the photo rather than losing it;
      // `syncScan()` uploads it later.
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
  await mutate((scans) => ({ scans: [...scans, record], result: undefined }));
  return record;
}

/** Uploads in flight, by local id — so a retry on app start and a retry from
 *  the Results screen can't send the same photo twice. */
const syncing = new Map<string, Promise<ScanRecord>>();

/**
 * Upload a scan that was taken offline, and give it the server's id.
 *
 * Returns the updated record (now `synced: true`, new `id`). Returns the
 * record unchanged if it was already synced. Throws if the upload fails — the
 * scan stays on the device as `synced: false` for the next attempt.
 *
 * The photo is read back from `photoUri`. Camera captures live in the OS
 * cache until R5 moves them to permanent storage; if iOS has cleared it,
 * the read fails and this throws `PhotoMissingError`.
 */
export function syncScan(record: ScanRecord): Promise<ScanRecord> {
  if (record.synced !== false) return Promise.resolve(record);
  const inFlight = syncing.get(record.id);
  if (inFlight) return inFlight;

  const run = (async () => {
    if (!isLiveBackend()) throw new Error('No backend configured.');
    let dataUri: string;
    try {
      dataUri = await toDataUri(record.photoUri);
    } catch {
      throw new PhotoMissingError();
    }

    const serverId = await upload(dataUri, record.mode, record.capturedAt);
    return mutate((scans) => {
      let updated: ScanRecord = { ...record, id: serverId, synced: true };
      const next = scans.map((s) => {
        if (s.id !== record.id) return s;
        // Keep anything that changed on the stored copy meanwhile.
        updated = { ...s, id: serverId, synced: true };
        return updated;
      });
      return { scans: next, result: updated };
    });
  })();

  syncing.set(record.id, run);
  const clear = () => syncing.delete(record.id);
  run.then(clear, clear);
  return run;
}

/** The photo file behind an unsynced scan is gone, so it can never upload. */
export class PhotoMissingError extends Error {
  constructor() {
    super('The photo for this scan is no longer on this phone.');
    this.name = 'PhotoMissingError';
  }
}

/**
 * Upload every scan that was taken offline. Called on app start.
 *
 * One at a time, oldest first. Stops at the first "server unreachable", so an
 * offline phone doesn't try every scan; any other failure (a missing photo, a
 * rejected upload) skips that scan only. Never throws.
 */
export async function retryUnsyncedScans(): Promise<void> {
  if (!isLiveBackend()) return;
  const pending = (await readAll())
    .filter((s) => s.synced === false)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));

  for (const scan of pending) {
    try {
      await syncScan(scan);
    } catch (error) {
      // Status 0 = no response at all. Try again next launch.
      if (error instanceof ApiError && error.status === 0) return;
    }
  }
}

/**
 * Keep an analysis on its scan, so it is fetched from Claude exactly once.
 * Results, Home and Progress all read it from here afterwards.
 */
export async function attachAnalysis(id: string, analysis: SkinAnalysis): Promise<void> {
  await mutate((scans) => ({
    scans: scans.map((s) => (s.id === id ? { ...s, analysis } : s)),
    result: undefined,
  }));
}

export async function clearScans(): Promise<void> {
  await mutate(() => ({ scans: [], result: undefined }));
}
