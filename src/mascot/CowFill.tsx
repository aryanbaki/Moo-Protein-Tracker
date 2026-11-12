/**
 * The see-through "fill" view: a pale cow silhouette with liquid rising from the
 * hooves to `progress`, clipped to the cow's outline, with a gently rolling surface.
 */
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';
import { ghostFace, silhouette } from './art';
import type { Frame } from './Layer';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const GHOST_LINE = '#C9C4B4';
const TWO_PI = Math.PI * 2;

/** Vertical extent of the liquid in art units (hooves .. horn tips). */
const RANGE = { full: { top: 36, bottom: 242 }, head: { top: 36, bottom: 156 } } as const;

export function clampProgress(p: number | undefined): number {
  if (p == null || Number.isNaN(p)) return 0;
  return Math.max(0, Math.min(1, p));
}

/** Surface height (art units) for a progress value. */
export function levelFor(progress: number | undefined, headOnly = false): number {
  const { top, bottom } = headOnly ? RANGE.head : RANGE.full;
  const p = clampProgress(progress);
  if (p <= 0) return bottom + 14;
  if (p >= 1) return top - 14;
  return bottom - p * (bottom - top);
}

function wavePath(level: number, phase: number, amp: number, length: number, x0: number, x1: number, floor: number): string {
  'worklet';
  let d = '';
  const step = 10;
  for (let x = x0; x <= x1 + step; x += step) {
    const y = level + amp * Math.sin((x / length) * TWO_PI + phase);
    d += `${x === x0 ? 'M' : 'L'} ${x} ${Math.round(y * 10) / 10} `;
  }
  return `${d}L ${x1 + step} ${floor} L ${x0} ${floor} Z`;
}

interface Props {
  frame: Frame;
  progress?: number;
  /** Whether the fill view is currently the visible one. */
  shown: boolean;
  color?: string;
  headOnly?: boolean;
  reduced: boolean;
}

export const CowFill = memo(function CowFill({ frame, progress, shown, color = colors.fill, headOnly = false, reduced }: Props) {
  const { vb, w, h, uid } = frame;
  const range = headOnly ? RANGE.head : RANGE.full;
  const empty = range.bottom + 14;
  const target = levelFor(progress, headOnly);

  const level = useSharedValue(shown ? target : empty);
  const phase = useSharedValue(0);

  // Rise from the hooves when the view appears; spring to new levels while it is up.
  useEffect(() => {
    if (!shown) return;
    if (reduced) {
      level.value = target;
      return;
    }
    level.value = empty;
    level.value = withDelay(180, withTiming(target, { duration: 1100, easing: Easing.out(Easing.cubic) }));
    // Only on becoming visible; level changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, reduced]);

  useEffect(() => {
    if (!shown) return;
    level.value = reduced ? target : withSpring(target, { damping: 16, stiffness: 70, mass: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => {
    if (shown && !reduced) {
      phase.value = 0;
      phase.value = withRepeat(withTiming(TWO_PI, { duration: 2400, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(phase);
    }
    return () => cancelAnimation(phase);
  }, [shown, reduced, phase]);

  const x0 = vb.x;
  const x1 = vb.x + vb.w;
  const floor = vb.y + vb.h;
  const amp = reduced ? 0 : headOnly ? 3 : 4.5;

  const backProps = useAnimatedProps(() => ({
    d: wavePath(level.value - 3, -phase.value + 1.6, amp * 0.8, 150, x0, x1, floor),
  }));
  const frontProps = useAnimatedProps(() => ({
    d: wavePath(level.value, phase.value, amp, 110, x0, x1, floor),
  }));

  const outline = useMemo(() => silhouette(headOnly), [headOnly]);
  const face = useMemo(() => ghostFace(), []);
  const clipId = `${uid}-sil`;

  return (
    <Svg width={w} height={h} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} style={styles.fill}>
      <Defs>
        <ClipPath id={clipId}>
          {outline.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </ClipPath>
      </Defs>
      {/* Union outline: fat strokes underneath, fills on top hide the inner lines. */}
      {outline.map((d, i) => (
        <Path key={`o${i}`} d={d} fill={GHOST_LINE} stroke={GHOST_LINE} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      <G clipPath={`url(#${clipId})`}>
        <Rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={colors.cowGhost} />
        <AnimatedPath animatedProps={backProps} fill={color} opacity={0.45} />
        <AnimatedPath animatedProps={frontProps} fill={color} />
      </G>
      {face.map((s, i) => (
        <Path
          key={`f${i}`}
          d={s.d}
          fill={s.fill ?? 'none'}
          stroke={s.stroke}
          strokeWidth={s.stroke ? s.sw : undefined}
          strokeLinecap="round"
          opacity={0.42}
        />
      ))}
    </Svg>
  );
});

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0 },
});
