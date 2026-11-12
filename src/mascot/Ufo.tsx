/**
 * Comic flying saucer with a tractor beam. When `active`, the cow goes limp, rises
 * into the beam and turns slowly while the saucer hovers and wobbles.
 */
import { useEffect, useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '../theme';
import { art } from './art';
import { Cow } from './Cow';

export interface UfoSceneProps {
  size?: number;
  /** When true the beam is on and the cow is lifted and slowly spinning. */
  active?: boolean;
}

const SAUCER_W = 200;
const SAUCER_H = 104;
const LIGHTS: readonly [number, number][] = [
  [38, 68],
  [69, 76],
  [100, 79],
  [131, 76],
  [162, 68],
];
const LIGHT_COLORS = [art.gold, colors.bad, colors.beam, colors.bad, art.gold];

function Light({ index, k, on, reduced }: { index: number; k: number; on: SharedValue<number>; reduced: boolean }) {
  const [x, y] = LIGHTS[index] as [number, number];
  const style = useAnimatedStyle(() => {
    if (reduced) return { opacity: 1 };
    // A chase: each light peaks a fifth of a cycle after its neighbour.
    const t = (on.value + index / LIGHTS.length) % 1;
    return { opacity: 0.35 + 0.65 * Math.max(0, 1 - Math.abs(t - 0.5) * 4) };
  });
  const r = 6.5 * k;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x * k - r,
          top: y * k - r,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          borderWidth: Math.max(1.5, 2.5 * k),
          borderColor: art.outline,
          backgroundColor: LIGHT_COLORS[index],
        },
        style,
      ]}
    />
  );
}

function Saucer({ width, on, reduced }: { width: number; on: SharedValue<number>; reduced: boolean }) {
  const k = width / SAUCER_W;
  const O = art.outline;
  return (
    <View style={{ width, height: SAUCER_H * k }}>
      <Svg width={width} height={SAUCER_H * k} viewBox={`0 0 ${SAUCER_W} ${SAUCER_H}`}>
        {/* antenna */}
        <Path d="M 100 20 L 100 8" stroke={O} strokeWidth={4} strokeLinecap="round" />
        <Ellipse cx={100} cy={7} rx={5} ry={5} fill={colors.bad} stroke={O} strokeWidth={3} />
        {/* dome */}
        <Path d="M 58 60 C 58 6 142 6 142 60 Z" fill="#CDEBFA" stroke={O} strokeWidth={5} strokeLinejoin="round" />
        {/* little green pilot */}
        <Path d="M 80 60 C 78 34 122 34 120 60 Z" fill={colors.beam} stroke={O} strokeWidth={3.5} strokeLinejoin="round" />
        <Ellipse cx={92} cy={48} rx={5} ry={6.5} fill={O} />
        <Ellipse cx={108} cy={48} rx={5} ry={6.5} fill={O} />
        <Ellipse cx={93.5} cy={46} rx={1.6} ry={1.6} fill="#FFFFFF" />
        <Ellipse cx={109.5} cy={46} rx={1.6} ry={1.6} fill="#FFFFFF" />
        <Path d="M 70 34 C 74 24 84 20 92 20" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.9} />
        {/* hull */}
        <Path d="M 6 66 C 6 50 60 44 100 44 C 140 44 194 50 194 66 C 194 82 150 92 100 92 C 50 92 6 82 6 66 Z" fill={colors.ufo} stroke={O} strokeWidth={5} strokeLinejoin="round" />
        <Path d="M 22 58 C 50 50 150 50 178 58" stroke="#C3CBDA" strokeWidth={5} strokeLinecap="round" fill="none" />
        {/* beam emitter */}
        <Path d="M 70 90 C 74 102 126 102 130 90 Z" fill="#6B7689" stroke={O} strokeWidth={5} strokeLinejoin="round" />
      </Svg>
      {LIGHTS.map((_, i) => (
        <Light key={i} index={i} k={k} on={on} reduced={reduced} />
      ))}
    </View>
  );
}

export function UfoScene({ size = 280, active = false }: UfoSceneProps) {
  const reduced = useReducedMotion();
  const rawId = useId();
  const gid = useMemo(() => `beam${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);

  const W = size;
  const H = Math.round(size * 1.3);
  const saucerW = W * 0.74;
  const saucerH = (saucerW * SAUCER_H) / SAUCER_W;
  const cowW = W * 0.5;
  const cowH = cowW * 0.8;
  const groundY = H - W * 0.06;
  const beamTop = saucerH * 0.9;
  const lift = -(groundY - cowH - (beamTop + W * 0.16));

  const hover = useSharedValue(0);
  const wobble = useSharedValue(0);
  const chase = useSharedValue(0);
  const beam = useSharedValue(active ? 1 : 0);
  const pulse = useSharedValue(0);
  const rise = useSharedValue(active ? 1 : 0);
  const bob = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    const ease = Easing.inOut(Easing.sin);
    hover.value = withRepeat(withTiming(1, { duration: 1300, easing: ease }), -1, true);
    wobble.value = withRepeat(withSequence(withTiming(1, { duration: 900, easing: ease }), withTiming(-1, { duration: 900, easing: ease })), -1, true);
    chase.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: 700, easing: ease }), -1, true);
    return () => {
      for (const sv of [hover, wobble, chase, pulse]) cancelAnimation(sv);
    };
  }, [reduced, hover, wobble, chase, pulse]);

  useEffect(() => {
    const ease = Easing.inOut(Easing.sin);
    if (reduced) {
      beam.value = active ? 1 : 0;
      rise.value = active ? 1 : 0;
      spin.value = 0;
      bob.value = 0;
      return;
    }
    if (active) {
      beam.value = withTiming(1, { duration: 300 });
      rise.value = withDelay(250, withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.cubic) }));
      bob.value = withDelay(1900, withRepeat(withTiming(1, { duration: 1100, easing: ease }), -1, true));
      spin.value = 0;
      spin.value = withDelay(500, withRepeat(withTiming(360, { duration: 6500, easing: Easing.linear }), -1, false));
    } else {
      cancelAnimation(bob);
      cancelAnimation(spin);
      beam.value = withDelay(350, withTiming(0, { duration: 300 }));
      rise.value = withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) });
      bob.value = withTiming(0, { duration: 300 });
      // Unwind the shortest way so the cow lands on its feet.
      spin.value = withTiming(spin.value > 180 ? 360 : 0, { duration: 500 });
    }
  }, [active, reduced, beam, rise, bob, spin]);

  const saucerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hover.value * W * 0.025 }, { translateX: wobble.value * W * 0.012 }, { rotate: `${wobble.value * 2.5}deg` }],
  }));
  const beamStyle = useAnimatedStyle(() => ({
    opacity: beam.value * (0.82 + pulse.value * 0.18),
    transform: [{ scaleX: 0.96 + pulse.value * 0.04 }],
  }));
  const cowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: rise.value * lift + bob.value * W * 0.03 },
      { rotate: `${spin.value}deg` },
      { scale: 1 - rise.value * 0.12 },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.16 * (1 - rise.value * 0.6),
    transform: [{ scale: 1 - rise.value * 0.45 }],
  }));

  const topW = saucerW * 0.3;
  const botW = W * 0.86;
  const bx = W / 2;
  const beamPath = `M ${bx - topW / 2} ${beamTop} L ${bx + topW / 2} ${beamTop} L ${bx + botW / 2} ${groundY} Q ${bx} ${groundY + W * 0.07} ${bx - botW / 2} ${groundY} Z`;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={active ? 'A flying saucer beaming up Moo the cow' : 'A flying saucer hovering over Moo the cow'}
      style={{ width: W, height: H }}
    >
      <Animated.View style={[styles.abs, beamStyle]}>
        <Svg width={W} height={H}>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.beam} stopOpacity={0.95} />
              <Stop offset="1" stopColor={colors.beam} stopOpacity={0.3} />
            </LinearGradient>
          </Defs>
          <Path d={beamPath} fill={`url(#${gid})`} />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          { position: 'absolute', left: (W - cowW * 0.8) / 2, top: groundY - W * 0.035, width: cowW * 0.8, height: W * 0.06, borderRadius: W * 0.03, backgroundColor: art.outline },
          shadowStyle,
        ]}
      />

      <Animated.View style={[{ position: 'absolute', left: (W - cowW) / 2, top: groundY - cowH, width: cowW, height: cowH }, cowStyle]}>
        <Cow size={cowW} pose={active ? 'abducted' : 'idle'} />
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', left: (W - saucerW) / 2, top: 0 }, saucerStyle]}>
        <Saucer width={saucerW} on={chase} reduced={reduced} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
