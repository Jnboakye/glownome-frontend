import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { palette } from '../theme';

export type CardTint = 'lilac' | 'blue' | 'mint';

/** Fill + the deeper shade for the card's shape. Option B (28 Sep). */
export const TINTS: Record<CardTint, { fill: string; ink: string }> = {
  lilac: { fill: palette.cardLilac, ink: palette.cardLilacInk },
  blue: { fill: palette.cardBlue, ink: palette.cardBlueInk },
  mint: { fill: palette.cardMint, ink: palette.cardMintInk },
};

type Props = {
  label: string;
  /** Lowercase — it is a display heading. */
  title: string;
  /** One line under the title. A node so it can carry a coloured number. */
  line?: React.ReactNode;
  tint: CardTint;
  /** A simple shape on the right, drawn in the tint's ink. */
  shape?: (ink: string) => React.ReactNode;
  action?: { label: string; onPress: () => void; icon?: string };
  /** Tapping the text block (title + line). */
  onPressBody?: () => void;
  bodyLabel?: string;
  children?: React.ReactNode;
};

/**
 * The Home card: small uppercase label, bold lowercase title, one line, one
 * dark pill button, one shape. Structure borrowed from the Noe AI reference;
 * colours and visuals are Glownome's own.
 */
export function HomeCard({
  label,
  title,
  line,
  tint,
  shape,
  action,
  onPressBody,
  bodyLabel,
  children,
}: Props) {
  const { fill, ink } = TINTS[tint];

  const body = (
    <View>
      <Text className="font-ui text-caption text-ink-faint">{label.toUpperCase()}</Text>
      <Text className="font-title text-heading text-ink mt-xs">{title}</Text>
      {line ? <View className="mt-xs">{line}</View> : null}
    </View>
  );

  return (
    <View className="rounded-xl mb-md overflow-hidden" style={{ backgroundColor: fill }}>
      {shape ? (
        <View pointerEvents="none" className="absolute right-xl top-0 bottom-0 justify-center">
          {shape(ink)}
        </View>
      ) : null}

      <View className="p-xl" style={{ paddingRight: shape ? 118 : undefined }}>
        {onPressBody ? (
          <Pressable onPress={onPressBody} accessibilityRole="button" accessibilityLabel={bodyLabel}>
            {body}
          </Pressable>
        ) : (
          body
        )}

        {action ? (
          <View className="flex-row mt-lg">
            <PillButton {...action} />
          </View>
        ) : null}

        {children}
      </View>
    </View>
  );
}

/** Line text in the card's secondary style. */
export function CardLine({ children }: { children: React.ReactNode }) {
  return <Text className="font-body text-body-sm text-ink-soft">{children}</Text>;
}

/** The compact dark pill used on cards — PrimaryButton is full-width and 58pt. */
export function PillButton({
  label,
  onPress,
  icon = 'arrow-right',
}: {
  label: string;
  onPress: () => void;
  icon?: string;
}) {
  return (
    <TouchableRipple
      onPress={onPress}
      borderless
      accessibilityRole="button"
      rippleColor="rgba(255,255,255,0.18)"
      className="rounded-pill bg-ink"
    >
      <View className="flex-row items-center gap-xs px-lg py-[10px]">
        <Text className="font-ui text-label text-white">{label}</Text>
        <MaterialCommunityIcons name={icon as never} size={16} color={palette.white} />
      </View>
    </TouchableRipple>
  );
}

/** Small underlined links under a card's button. */
export function CardLinks({ links }: { links: { label: string; onPress: () => void }[] }) {
  return (
    <View className="flex-row flex-wrap gap-x-lg gap-y-xs mt-md">
      {links.map((link) => (
        <Pressable key={link.label} onPress={link.onPress} accessibilityRole="link" hitSlop={8}>
          <Text className="font-ui text-body-sm text-ink-soft underline">{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Shapes. Plain Views; placeholders until real artwork exists. ─────────────

/** An oval face guide with a dot lattice — echoes the scan screen. */
export function ScanShape({ ink }: { ink: string }) {
  const w = 76;
  const h = 88;
  const dots = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let r = 0; r < 6; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const nx = (c / 4) * 2 - 1;
        const ny = (r / 5) * 2 - 1;
        if (nx * nx + ny * ny > 0.8) continue;
        out.push({ x: w / 2 + nx * 22, y: h / 2 + ny * 28 });
      }
    }
    return out;
  }, []);
  return (
    <View style={{ width: w, height: h, borderRadius: w, borderWidth: 1.5, borderColor: ink }}>
      {dots.map((d, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: d.x - 2,
            top: d.y - 2,
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: ink,
            opacity: 0.55,
          }}
        />
      ))}
    </View>
  );
}

/** Three rising bars. */
export function BarsShape({ ink }: { ink: string }) {
  return (
    <View className="flex-row items-end gap-sm" style={{ height: 76 }}>
      {[
        { h: 32, o: 0.35 },
        { h: 48, o: 0.6 },
        { h: 72, o: 1 },
      ].map((b) => (
        <View key={b.h} style={{ width: 14, height: b.h, borderRadius: 7, backgroundColor: ink, opacity: b.o }} />
      ))}
    </View>
  );
}

/** A filled sun-disc and an outlined moon-disc — morning and night. */
export function DayNightShape({ ink }: { ink: string }) {
  return (
    <View style={{ width: 86, height: 66 }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 4,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: ink,
          opacity: 0.45,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 14,
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 1.5,
          borderColor: ink,
        }}
      />
    </View>
  );
}

/** A dropper-ish stack of circles for ingredients. */
export function DropsShape({ ink }: { ink: string }) {
  return (
    <View style={{ width: 70, height: 76 }}>
      {[
        { s: 38, l: 0, t: 30, o: 0.5 },
        { s: 26, l: 40, t: 10, o: 0.8 },
        { s: 16, l: 30, t: 58, o: 1 },
      ].map((c) => (
        <View
          key={c.s}
          style={{
            position: 'absolute',
            left: c.l,
            top: c.t,
            width: c.s,
            height: c.s,
            borderRadius: c.s,
            backgroundColor: ink,
            opacity: c.o,
          }}
        />
      ))}
    </View>
  );
}
