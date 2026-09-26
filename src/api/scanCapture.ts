/**
 * The seam between the scan UI and the native capabilities it wants.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 2D ONLY (decided 25 Sep 2026)
 *
 * Scans are 2D guided photos. Depth capture was dropped: the analysis is a
 * Claude vision call on an RGB photo, and tone, texture, pores and redness all
 * live in the image — a depth map would not be read. The backend accepts only
 * `mode: "2d"`, but keeps the field so 3D can return later without an API
 * break. If it does, widen `CaptureMode` here and `wireMode()` in ./scans.ts.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT STILL NEEDS A DEVELOPMENT BUILD (Expo SDK 57, Expo Go)
 *
 *   • expo-face-detector was REMOVED from Expo (it blocked their ARM64
 *     simulator migration). Face detection now requires a development build.
 *     https://github.com/expo/fyi/blob/main/face-detector-removed.md
 *   • react-native-vision-camera and @shopify/react-native-skia are not in
 *     Expo Go either — both need a development build.
 *
 * So the screen is built against this interface instead of against a library.
 * Today the answers are honest "unsupported" and the signals are simulated,
 * behind a visible badge.
 *
 * WHEN YOU MOVE TO A DEVELOPMENT BUILD
 *
 *   1. `faceDetection` → true, and replace the simulated signal in
 *      `hooks/useScanSignals.ts` with a vision-camera frame processor.
 *   2. `liveMetering`  → true, and read mean luminance off the same frame
 *      processor rather than the timed simulation.
 *
 * No screen code changes for either.
 */

export type LightingQuality = 'dark' | 'ok' | 'bright';

/** One value today. Kept as a type so a future mode is a one-line change. */
export type CaptureMode = '2d-guided';

export interface ScanCapability {
  /** On-device face landmark detection is available. */
  faceDetection: boolean;
  /** Per-frame exposure can be read without taking a picture. */
  liveMetering: boolean;
  /** How the shot is guided. Always '2d-guided' for now. */
  mode: CaptureMode;
  /**
   * True while face detection or metering is being simulated for the UI.
   * The screen shows a visible dev badge when this is set, so a simulated
   * signal can never be mistaken for a real one.
   */
  simulated: boolean;
}

export async function getScanCapability(): Promise<ScanCapability> {
  // Nothing to probe yet — both capabilities are gated on a development build.
  // When the native module lands, probe it here and return real values.
  const faceDetection = false;
  const liveMetering = false;

  return {
    faceDetection,
    liveMetering,
    mode: '2d-guided',
    simulated: !faceDetection || !liveMetering,
  };
}

/** What a captured scan hands to the analysis. */
export interface ScanCaptureResult {
  photoUri: string;
  mode: CaptureMode;
  capturedAt: string;
  /**
   * The image bytes, base64, without the data: prefix.
   *
   * The server cannot read a file:// path off the phone, so the upload has to
   * carry the bytes. Both capture paths can produce this for free —
   * `takePictureAsync({ base64: true })` and the image picker's `base64`
   * option — which is why there is no file-system dependency here.
   */
  base64?: string;
}
