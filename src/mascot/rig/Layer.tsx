import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { ClipPath, Defs, Path } from 'react-native-svg';

import type { Pt, Shape, ViewBox } from './types';

export interface Frame {
  vb: ViewBox;
  /** Rendered size in points. */
  w: number;
  h: number;
  /** Points per viewBox unit. */
  k: number;
  /** Points per "cow width" (the unit animations use for x / y). */
  unit: number;
  /** Unique id prefix for clip paths. */
  uid: string;
  clips?: Record<string, string>;
}

/** One static SVG layer filling the frame. Never re-renders unless its shapes change. */
export const Layer = memo(function Layer({ shapes, frame }: { shapes: readonly Shape[]; frame: Frame }) {
  const { vb, w, h, uid, clips } = frame;
  const used = clips ? [...new Set(shapes.map((s) => s.clip).filter((c): c is string => !!c && c in clips))] : [];
  return (
    <Svg width={w} height={h} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} style={styles.fill}>
      {used.length ? (
        <Defs>
          {used.map((name) => (
            <ClipPath key={name} id={`${uid}-${name}`}>
              <Path d={(clips as Record<string, string>)[name]} />
            </ClipPath>
          ))}
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
          clipPath={s.clip && used.includes(s.clip) ? `url(#${uid}-${s.clip})` : undefined}
        />
      ))}
    </Svg>
  );
});

/** CSS transform-origin for a pivot given in viewBox units. */
export function originOf(frame: Frame, pivot: Pt): string {
  const x = ((pivot[0] - frame.vb.x) / frame.vb.w) * 100;
  const y = ((pivot[1] - frame.vb.y) / frame.vb.h) * 100;
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}

export const fillStyle = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' },
}).fill;

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0 },
});
