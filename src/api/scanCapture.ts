/**
 * The seam between the scan UI and the native capabilities it wants.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * The scan screen was specified around depth capture, face landmarks and live
 * exposure metering. None of the three are reachable from Expo Go on SDK 54:
 *
 *   • expo-face-detector was REMOVED from Expo (it blocked their ARM64
 *     simulator migration). Expo's own guidance is that face detection now
 *     requires a development build.
 *     https://github.com/expo/fyi/blob/main/face-detector-removed.md
 *   • react-native-vision-camera and @shopify/react-native-skia are not in
 *     Expo Go either — both need a development build.
 *   • Depth capture (TrueDepth / LIDAR / Android Depth API) has no React Native
 *     library at all. It is custom Swift and Kotlin.
 *
 * So the screen is built against this interface instead of against a library.
 * Everything the UI needs is declared here; today the answers are honest
 * "unsupported", and the screen falls back to 2D guided capture.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHEN YOU MOVE TO A DEVELOPMENT BUILD
 *
 *   1. `faceDetection` → true, and replace the simulated signal in
 *      `hooks/useScanSignals.ts` with a vision-camera frame processor.
 *   2. `liveMetering`  → true, and read mean luminance off the same frame
 *      processor rather than the timed simulation.
 *   3. `depth`         → true only once a native module actually returns a
 *      depth map. `mode` then becomes '3d-depth' and the copy changes itself.
 *
 * No screen code changes for any of that.
 */

export type LightingQuality = 'dark' | 'ok' | 'bright';
export type CaptureMode = '3d-depth' | '2d-guided';

export interface ScanCapability {
  /** A native depth map is available (TrueDepth, LIDAR, Android Depth API). */
  depth: boolean;
  /** On-device face landmark detection is available. */
  faceDetection: boolean;
  /** Per-frame exposure can be read without taking a picture. */
  liveMetering: boolean;
  /** What the UI should offer, derived from the flags above. */
  mode: CaptureMode;
  /**
   * True while face detection or metering is being simulated for the UI.
   * The screen shows a visible dev badge when this is set, so a simulated
   * signal can never be mistaken for a real one.
   */
  simulated: boolean;
}

export async function getScanCapability(): Promise<ScanCapability> {
  // Nothing to probe yet — every capability is gated on a development build.
  // When the native module lands, probe it here and return real values.
  const depth = false;
  const faceDetection = false;
  const liveMetering = false;

  return {
    depth,
    faceDetection,
    liveMetering,
    mode: depth ? '3d-depth' : '2d-guided',
    simulated: !faceDetection || !liveMetering,
  };
}

/** What a captured scan hands to the analysis. */
export interface ScanCaptureResult {
  photoUri: string;
  mode: CaptureMode;
  /** Populated only once a native depth module exists. */
  depthMapUri?: string;
  capturedAt: string;
}
