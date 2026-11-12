/**
 * Props: the little drawings an animation can cue (sweat, zzz, crown ...), each with its
 * own built-in motion driven by the animation clock. Sizes follow the cow's width.
 */
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, fonts } from '../../theme';
import { ease } from './engine';
import type { Frame } from './Layer';
import type { AnchorName, CowSkin, PropCue, PropKind, Pt } from './types';

const O = colors.cowOutline;
const GOLD = '#F7C948';

/* ----------------------------------------------------------------- drawings */

export function SweatDrop({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M 12 2 C 19 12 18.5 21 12 21 C 5.500 21 5 12 12 2 Z" fill="#7FC8F5" stroke={O} strokeWidth={2.6} strokeLinejoin="round" />
      <Path d="M 9.500 14 C 9.500 16.500 10.500 17.500 12 18" fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function Zed({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M 6 6 H 18 L 6 18 H 18" fill="none" stroke={O} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GrassTuft({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 50 30">
      <Path d="M 3 14 C 16 20 26 12 36 20" fill="none" stroke={O} strokeWidth={7} strokeLinecap="round" />
      <Path d="M 24 14 C 30 4 40 4 46 8 C 42 16 32 18 24 14 Z" fill={colors.fill} stroke={O} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M 3 14 C 16 20 26 12 36 20" fill="none" stroke={colors.fill} strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}

export function Crown({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.82} viewBox="0 0 68 56">
      <Path d="M 11 50 L 6 18 L 21 32 L 34 10 L 47 32 L 62 18 L 57 50 Z" fill={GOLD} stroke={O} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M 12 42 L 56 42" stroke={colors.warning} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={34} cy={10} r={4.5} fill={colors.bad} stroke={O} strokeWidth={2.5} />
      <Circle cx={6} cy={18} r={3.6} fill="#FFFFFF" stroke={O} strokeWidth={2.5} />
      <Circle cx={62} cy={18} r={3.6} fill="#FFFFFF" stroke={O} strokeWidth={2.5} />
      <Circle cx={34} cy={36} r={3.4} fill={colors.bad} stroke={O} strokeWidth={2.5} />
    </Svg>
  );
}

export function Sunglasses({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.4} viewBox="0 0 120 48">
      <Path d="M 4 12 H 116" stroke={O} strokeWidth={7} strokeLinecap="round" />
      <Path d="M 6 12 H 54 V 24 C 54 38 44 44 30 44 C 16 44 6 38 6 24 Z" fill="#1B1F1B" stroke={O} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M 66 12 H 114 V 24 C 114 38 104 44 90 44 C 76 44 66 38 66 24 Z" fill="#1B1F1B" stroke={O} strokeWidth={5} strokeLinejoin="round" />
      <Path d="M 14 20 L 26 20 M 74 20 L 86 20" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
    </Svg>
  );
}

export function Sparkle({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M 12 1.500 C 13 8 16 11 22.500 12 C 16 13 13 16 12 22.500 C 11 16 8 13 1.500 12 C 8 11 11 8 12 1.500 Z" fill={GOLD} stroke={O} strokeWidth={2.2} strokeLinejoin="round" />
    </Svg>
  );
}

export function Heart({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M 12 21 C 3 14.500 2 9 5 5.500 C 7.500 3 11 4 12 7 C 13 4 16.500 3 19 5.500 C 22 9 21 14.500 12 21 Z" fill="#F0788E" stroke={O} strokeWidth={2.4} strokeLinejoin="round" />
    </Svg>
  );
}

export function DustPuff({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M 5 17 C 1.500 17 1.500 11.500 5.500 11.500 C 5 7 11 5.500 13 9 C 16 6.500 20.500 9 19 12.500 C 23 13 22.500 17 19 17 Z" fill="#E9E3D3" stroke={O} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function ShockLines({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.34} viewBox="0 0 116 40">
      <Path d="M 16 34 L 8 18 M 58 26 L 58 6 M 100 34 L 108 18" stroke={O} strokeWidth={6} strokeLinecap="round" />
    </Svg>
  );
}

function Bubble({ text, size }: { text: string; size: number }) {
  const border = Math.max(1.5, size * 0.09);
  return (
    <View style={[styles.bubble, { borderWidth: border, borderRadius: size * 0.8, paddingHorizontal: size * 0.55, paddingVertical: size * 0.2 }]}>
      <Text style={[styles.bubbleText, { fontSize: size, lineHeight: size * 1.2 }]} numberOfLines={1}>
        {text}
      </Text>
      <Svg width={size * 0.7} height={size * 0.5} viewBox="0 0 14 10" style={{ position: 'absolute', bottom: -size * 0.45, right: size * 0.7 }}>
        <Rect x={0} y={0} width={14} height={2.6} fill={colors.surface} />
        <Path d="M 1 1 L 11 9 L 13 1" fill={colors.surface} stroke={O} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/* ------------------------------------------------------------------- layout */

/** Where a kind is anchored by default, and what it moves with. */
const SPEC: Record<PropKind, { anchor: AnchorName; space: 'head' | 'root' | 'world' }> = {
  sweat: { anchor: 'headTop', space: 'root' },
  shock: { anchor: 'headTop', space: 'root' },
  zzz: { anchor: 'above', space: 'world' },
  hearts: { anchor: 'above', space: 'world' },
  sparkle: { anchor: 'headTop', space: 'world' },
  dust: { anchor: 'feet', space: 'world' },
  bubble: { anchor: 'above', space: 'world' },
  grass: { anchor: 'mouthPoint', space: 'head' },
  crown: { anchor: 'headTop', space: 'head' },
  sunglasses: { anchor: 'eyeLine', space: 'head' },
};

export function propSpace(kind: PropKind): 'head' | 'root' | 'world' {
  return SPEC[kind].space;
}

function anchorPoint(skin: CowSkin, name: AnchorName): Pt {
  return name === 'feet' ? skin.rootPivot : skin.anchors[name];
}

function frac(v: number): number {
  'worklet';
  return v - Math.floor(v);
}

function clamp01(v: number): number {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

interface Clock {
  t: SharedValue<number>;
}

interface ParticleProps {
  kind: 'sweat' | 'zzz' | 'hearts' | 'sparkle' | 'dust';
  index: number;
  cue: PropCue;
  clock: Clock;
  unit: number;
  /** Skull width in points. */
  headW: number;
  size: number;
  /** The cue's size multiplier (also spreads the sparkle ring). */
  sc: number;
  children: ReactNode;
}

/** One drop / z / heart / star / puff. Its path is a pure function of the cue's progress. */
function Particle({ kind, index, cue, clock, unit, headW, size, sc, children }: ParticleProps) {
  const { from, to } = cue;
  const repeat = cue.repeat ?? 1;
  const style = useAnimatedStyle(() => {
    const t = clock.t.value;
    if (t < from || t > to) return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: '0deg' }] };
    const u = clamp01((t - from) / (to - from));
    const cyc = u * repeat;
    let x = 0;
    let y = 0;
    let s = 1;
    let r = 0;
    let o = 1;
    if (kind === 'sweat') {
      const v = frac(cyc + [0, 0.45, 0.75][index]!);
      x = [-0.66, 0.66, -0.84][index]! * headW;
      y = [0.1, 0.02, 0.62][index]! * headW + v * 0.09 * unit;
      s = [1.1, 0.9, 0.8][index]! * Math.min(1, v * 5 + 0.3);
      o = v < 0.75 ? 1 : (1 - v) * 4;
    } else if (kind === 'zzz') {
      const v = frac(cyc + index / 3);
      x = (0.03 + v * 0.13) * unit;
      y = -v * 0.17 * unit;
      s = 0.45 + v * 0.75;
      r = -12 + v * 22;
      o = Math.sin(Math.PI * Math.min(1, v * 1.05));
    } else if (kind === 'hearts') {
      const v = clamp01(frac(cyc + index * 0.3) * 1.15);
      x = (index - 1) * 0.085 * unit + Math.sin(v * 7 + index * 2) * 0.014 * unit;
      y = -v * 0.2 * unit;
      s = ease(5, Math.min(1, v * 3.5)) * (0.8 + (index % 2) * 0.3);
      r = (index - 1) * 14;
      o = v < 0.65 ? 1 : 1 - (v - 0.65) / 0.35;
    } else if (kind === 'sparkle') {
      const v = frac(cyc + index * 0.37);
      const a = (index / 5) * 2 * Math.PI - 2.2;
      const rad = (index % 2 ? 0.17 : 0.13) * unit * sc;
      x = Math.cos(a) * rad * 1.25;
      y = Math.sin(a) * rad * 0.8;
      s = Math.sin(Math.PI * v) * (index % 2 ? 0.8 : 1.15);
      r = v * 90;
    } else {
      const v = clamp01(frac(cyc * 0.999) * 1.1 - index * 0.04);
      const dir = index % 2 ? 1 : -1;
      const far = index < 2 ? 1 : 0.55;
      x = dir * (0.1 + ease(2, v) * 0.16 * far) * unit;
      y = (-0.02 - ease(2, v) * 0.035 * (index < 2 ? 1 : 2)) * unit;
      s = (0.45 + v * 0.8) * far + 0.2;
      o = (1 - v) * 0.95;
    }
    return { opacity: o, transform: [{ translateX: x }, { translateY: y }, { scale: s }, { rotate: `${r}deg` }] };
  });
  return <Animated.View style={[{ position: 'absolute', left: -size / 2, top: -size / 2, width: size, height: size }, style]}>{children}</Animated.View>;
}

const COUNT = { sweat: 3, zzz: 3, hearts: 3, sparkle: 5, dust: 4 } as const;

export interface PropViewProps {
  cue: PropCue;
  skin: CowSkin;
  frame: Frame;
  clock: Clock;
}

/** Renders one cue at its anchor. Place inside a full-frame view of the right space. */
export function PropView({ cue, skin, frame, clock }: PropViewProps) {
  const { kind, from, to } = cue;
  const spec = SPEC[kind];
  const anchor = anchorPoint(skin, cue.anchor ?? spec.anchor);
  const { k, unit } = frame;
  const sc = cue.scale ?? 1;
  const left = (anchor[0] - frame.vb.x) * k + (cue.dx ?? 0) * unit;
  const top = (anchor[1] - frame.vb.y) * k + (cue.dy ?? 0) * unit;
  const headW = skin.anchors.headWidth * k;
  const span = Math.max(0.0001, to - from);
  // Entrances last a fixed slice of the animation, never more than 60% of the cue.
  const enter = Math.min(span * 0.6, kind === 'crown' || kind === 'sunglasses' ? 0.22 : 0.08);
  const exits = to < 1;

  const style = useAnimatedStyle(() => {
    const t = clock.t.value;
    if (t < from || t > to) return { opacity: 0, transform: [{ translateY: 0 }, { rotate: '0deg' }, { scale: 1 }] };
    const e = clamp01((t - from) / enter);
    const out = exits ? clamp01((to - t) / (span * 0.12)) : 1;
    let y = 0;
    let r = 0;
    let s = 1;
    let o = Math.min(1, e * 4) * out;
    if (kind === 'crown') {
      y = -(1 - ease(7, e)) * 0.5 * unit;
      r = -9 + (1 - e) * 16;
    } else if (kind === 'sunglasses') {
      y = -(1 - ease(7, e)) * 0.42 * unit;
      r = (1 - ease(2, e)) * -24;
    } else if (kind === 'grass' || kind === 'bubble') {
      s = 0.2 + 0.8 * ease(5, e);
      r = kind === 'bubble' ? (1 - e) * 10 : 0;
      s *= 0.7 + 0.3 * out;
    } else if (kind === 'shock') {
      const u = (t - from) / span;
      s = 0.7 + 0.3 * ease(5, e) + 0.05 * Math.sin(u * 40);
      o = out * (0.65 + 0.35 * Math.cos(u * 34));
    } else {
      o = 1;
    }
    return { opacity: o, transform: [{ translateY: y }, { rotate: `${r}deg` }, { scale: s }] };
  });

  let body: ReactNode = null;
  let box = { left: 0, top: 0, width: 0, height: 0 };
  let origin = '50% 50%';

  if (kind === 'crown') {
    const w = headW * 0.86 * sc;
    const h = w * 0.82;
    box = { left: left - w / 2, top: top - h * 0.86, width: w, height: h };
    origin = '50% 90%';
    body = <Crown size={w} />;
  } else if (kind === 'sunglasses') {
    const w = skin.anchors.eyeSpan * k * 2.5 * sc;
    const h = w * 0.4;
    box = { left: left - w / 2, top: top - h * 0.42, width: w, height: h };
    body = <Sunglasses size={w} />;
  } else if (kind === 'grass') {
    const w = unit * 0.15 * sc;
    box = { left: left + w * 0.1, top: top - w * 0.2, width: w, height: w * 0.6 };
    origin = '0% 40%';
    body = <GrassTuft size={w} />;
  } else if (kind === 'shock') {
    const w = headW * 1.5 * sc;
    const h = w * 0.34;
    box = { left: left - w / 2, top: top - h * 1.25, width: w, height: h };
    origin = '50% 150%';
    body = <ShockLines size={w} />;
  } else if (kind === 'bubble') {
    const fs = Math.max(9, unit * 0.085 * sc);
    return (
      <Animated.View style={[styles.bubbleSpot, { right: frame.w - left, bottom: frame.h - top + fs * 0.5, transformOrigin: '85% 120%' }, style]}>
        <Bubble text={cue.text ?? 'MOO!'} size={fs} />
      </Animated.View>
    );
  } else {
    const size = unit * (kind === 'sweat' ? 0.075 : kind === 'dust' ? 0.13 : kind === 'zzz' ? 0.09 : 0.085) * sc;
    const Drawing = kind === 'sweat' ? SweatDrop : kind === 'zzz' ? Zed : kind === 'hearts' ? Heart : kind === 'sparkle' ? Sparkle : DustPuff;
    return (
      <Animated.View style={[styles.point, { left, top }]}>
        {Array.from({ length: COUNT[kind] }, (_, i) => (
          <Particle key={i} kind={kind} index={i} cue={cue} clock={clock} unit={unit} headW={headW} size={size} sc={sc}>
            <Drawing size={size} />
          </Particle>
        ))}
      </Animated.View>
    );
  }

  return <Animated.View style={[styles.abs, box, { transformOrigin: origin }, style]}>{body}</Animated.View>;
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', pointerEvents: 'none' },
  point: { position: 'absolute', width: 0, height: 0, pointerEvents: 'none' },
  bubbleSpot: { position: 'absolute', pointerEvents: 'none' },
  bubble: { backgroundColor: colors.surface, borderColor: O },
  bubbleText: { fontFamily: fonts.black, color: colors.text, letterSpacing: 0.5 },
});
