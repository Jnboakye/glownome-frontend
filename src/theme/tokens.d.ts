declare const tokens: {
  colors: {
    ink: string;
    inkSoft: string;
    inkFaint: string;
    white: string;
    surface: string;
    canvas: string;
    sunk: string;
    outline: string;
    outlineStrong: string;
    accent: string;
    accentSoft: string;
    sage: string;
    sageSoft: string;
    amber: string;
    amberSoft: string;
    rose: string;
    roseSoft: string;
  };
  gradients: {
    glow: readonly [string, string, ...string[]];
    glowLocations: readonly [number, number, ...number[]];
    mist: readonly [string, string, ...string[]];
    mistLocations: readonly [number, number, ...number[]];
  };
  spacing: Record<string, number>;
  radius: { none: number; sm: number; md: number; lg: number; xl: number; pill: number };
  fonts: { body: string; ui: string; title: string; display: string; wordmark: string };
  fontSize: Record<string, unknown>;
};

export = tokens;
