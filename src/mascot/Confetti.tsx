import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { Easing, type SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '../theme';

export interface ConfettiProps {
  /** Change this value to fire a burst. */
  fireKey: number | string;
  /** Also fire once when first mounted. */
  fireOnMount?: boolean;
  /** Number of pieces per burst. */
  count?: number;
}

const PALETTE = [colors.fill, colors.cowPink, colors.warning, colors.fat, colors.creatine, colors.calories, colors.bad, colors.carbs];
const DURATION = 1900;

interface Piece {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  spin: number;
  w: number;
  h: number;
  round: boolean;
  color: string;
  wobble: number;
}

function makePieces(count: number, width: number, height: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95;
    const speed = (0.55 + Math.random() * 0.75) * Math.min(width, height * 1.2);
    const s = 7 + Math.random() * 7;
    pieces.push({
      x0: width / 2 + (Math.random() - 0.5) * width * 0.2,
      y0: height * 0.42,
      vx: Math.cos(angle) * speed * 1.1,
      vy: Math.sin(angle) * speed,
      spin: (Math.random() - 0.5) * 1400,
      w: s,
      h: Math.random() < 0.5 ? s : s * 0.45,
      round: Math.random() < 0.25,
      color: PALETTE[i % PALETTE.length] as string,
      wobble: Math.random() * Math.PI * 2,
    });
  }
  return pieces;
}

const Bit = memo(function Bit({ piece, t, gravity }: { piece: Piece; t: SharedValue<number>; gravity: number }) {
  const style = useAnimatedStyle(() => {
    const p = t.value;
    const x = piece.vx * p * (1 - 0.35 * p) + Math.sin(p * 9 + piece.wobble) * 8;
    const y = piece.vy * p + gravity * p * p;
    return {
      opacity: p <= 0 ? 0 : p > 0.75 ? (1 - p) * 4 : 1,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${piece.spin * p}deg` }, { scaleX: Math.cos(p * 12 + piece.wobble) }],
    };
  });
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: piece.x0, top: piece.y0, width: piece.w, height: piece.h, borderRadius: piece.round ? piece.w : 2, backgroundColor: piece.color },
        style,
      ]}
    />
  );
});

/** Full-parent overlay that throws a burst of confetti each time `fireKey` changes. */
export function Confetti({ fireKey, fireOnMount = false, count = 44 }: ConfettiProps) {
  const reduced = useReducedMotion();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [burst, setBurst] = useState(0);
  const first = useRef(true);
  const t = useSharedValue(0);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!fireOnMount) return;
    }
    setBurst((b) => b + 1);
  }, [fireKey, fireOnMount]);

  const ready = burst > 0 && box.width > 0;
  const pieces = useMemo(
    () => (ready ? makePieces(count, box.width, box.height) : []),
    // A fresh random set per burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burst, ready, count],
  );

  useEffect(() => {
    if (!ready) return;
    if (reduced) {
      // No motion: show a still scatter briefly, then clear it.
      t.value = 0.45;
      const id = setTimeout(() => setBurst(0), 1400);
      return () => clearTimeout(id);
    }
    t.value = 0;
    t.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) });
    const id = setTimeout(() => setBurst(0), DURATION + 100);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst, ready, reduced]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - box.width) > 1 || Math.abs(height - box.height) > 1) setBox({ width, height });
  };

  return (
    <View style={styles.overlay} onLayout={onLayout} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
      {pieces.map((p, i) => (
        <Bit key={`${burst}-${i}`} piece={p} t={t} gravity={box.height * 0.95} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' },
});
