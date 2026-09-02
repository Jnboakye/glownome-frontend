import { useEffect, useState } from 'react';
import { LightingQuality, ScanCapability } from '../api/scanCapture';

export type ScanSignals = {
  faceDetected: boolean;
  lighting: LightingQuality;
};

/**
 * Live framing and exposure signals for the scan screen.
 *
 * With a development build these come from a vision-camera frame processor.
 * Until then they are SIMULATED on a timer so the UI's states are all
 * reachable — the screen renders a visible badge whenever that is the case.
 *
 * Replace the body, not the signature.
 */
export function useScanSignals(capability: ScanCapability | null, ready: boolean): ScanSignals {
  const [signals, setSignals] = useState<ScanSignals>({
    faceDetected: false,
    lighting: 'dark',
  });

  useEffect(() => {
    if (!capability || !ready) return undefined;

    if (capability.faceDetection && capability.liveMetering) {
      // Real implementation goes here — subscribe to the frame processor.
      return undefined;
    }

    // Simulation: the face "arrives", then the light "settles". Long enough
    // that the coaching copy is readable rather than flashing past.
    const found = setTimeout(() => {
      setSignals((s) => ({ ...s, faceDetected: true }));
    }, 1400);
    const lit = setTimeout(() => {
      setSignals((s) => ({ ...s, lighting: 'ok' }));
    }, 2600);

    return () => {
      clearTimeout(found);
      clearTimeout(lit);
    };
  }, [capability, ready]);

  return signals;
}
