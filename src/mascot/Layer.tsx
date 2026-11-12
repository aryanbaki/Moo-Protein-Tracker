import { type ComponentProps, memo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';

import { BODY_D, SKULL_D, type Shape, type ViewBox } from './art';

export interface Frame {
  vb: ViewBox;
  /** Rendered size in points. */
  w: number;
  h: number;
  /** Unique id prefix for clip paths. */
  uid: string;
}

/** One static SVG layer filling the frame. Never re-renders unless its shapes change. */
export const Layer = memo(function Layer({ shapes, frame }: { shapes: Shape[]; frame: Frame }) {
  const { vb, w, h, uid } = frame;
  const clipsBody = shapes.some((s) => s.clip === 'body');
  const clipsSkull = shapes.some((s) => s.clip === 'skull');
  return (
    <Svg width={w} height={h} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} style={styles.fill}>
      {clipsBody || clipsSkull ? (
        <Defs>
          {clipsBody ? (
            <ClipPath id={`${uid}-body`}>
              <Path d={BODY_D} />
            </ClipPath>
          ) : null}
          {clipsSkull ? (
            <ClipPath id={`${uid}-skull`}>
              <Path d={SKULL_D} />
            </ClipPath>
          ) : null}
        </Defs>
      ) : null}
      {shapes.map((s, i) => (
        <Path
          key={i}
          d={s.d}
          fill={s.fill ?? 'none'}
          stroke={s.stroke}
          strokeWidth={s.stroke ? (s.sw ?? 5) : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={s.opacity}
          clipPath={s.clip ? `url(#${uid}-${s.clip})` : undefined}
        />
      ))}
    </Svg>
  );
});

export function originOf(frame: Frame, pivot: readonly [number, number] | readonly number[]): string {
  const x = (((pivot[0] as number) - frame.vb.x) / frame.vb.w) * 100;
  const y = (((pivot[1] as number) - frame.vb.y) / frame.vb.h) * 100;
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}

interface PartProps {
  frame: Frame;
  shapes?: Shape[];
  pivot?: readonly number[];
  style?: ComponentProps<typeof Animated.View>['style'];
  children?: ReactNode;
}

/** An animated group: a full-frame view that transforms around `pivot`. */
export function Part({ frame, shapes, pivot, style, children }: PartProps) {
  return (
    <Animated.View style={[styles.fill, pivot ? { transformOrigin: originOf(frame, pivot) } : null, style]}>
      {shapes && shapes.length ? <Layer shapes={shapes} frame={frame} /> : null}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
