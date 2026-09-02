import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

type Props = {
  /** Diameter of the face guide the mesh sits inside. */
  size: number;
  visible: boolean;
};

const ROWS = 11;
const COLS = 9;
const DOT = 3;

/**
 * A point cloud rather than a wireframe.
 *
 * Skia is not available in Expo Go, so this is built from plain Views. A lattice
 * of dots clipped to the guide's oval reads as a depth capture and degrades
 * honestly — a hand-drawn wireframe made of Views would just look broken. Each
 * dot fades in on a stagger seeded by its distance from centre, so the mesh
 * blooms outward from the nose rather than sweeping in from a corner.
 */
export function FaceMesh({ size, visible }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  const dots = useMemo(() => {
    const rx = size / 2;
    const ry = (size / 2) * 1.12; // faces are taller than they are wide
    const points: { x: number; y: number; delay: number }[] = [];

    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        // Normalised −1..1 lattice position.
        const nx = (c / (COLS - 1)) * 2 - 1;
        const ny = (r / (ROWS - 1)) * 2 - 1;
        // Keep only what falls inside the oval, with a little inset.
        if (nx * nx + ny * ny > 0.82) continue;
        points.push({
          x: rx + nx * rx,
          y: ry + ny * ry,
          delay: Math.sqrt(nx * nx + ny * ny),
        });
      }
    }
    return points;
  }, [size]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 700 : 260,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: size, height: size * 1.12 }}
    >
      {dots.map((dot, i) => {
        // Each dot reads a slice of the shared clock, ordered by its distance
        // from the centre of the face.
        const start = dot.delay * 0.55;
        const opacity = progress.interpolate({
          inputRange: [start, Math.min(1, start + 0.45)],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: dot.x - DOT / 2,
              top: dot.y - DOT / 2,
              width: DOT,
              height: DOT,
              borderRadius: DOT,
              backgroundColor: '#FFFFFF',
              opacity,
              transform: [
                { scale: opacity.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
