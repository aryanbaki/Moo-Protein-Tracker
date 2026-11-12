/** Simple single-series line chart (used for the weight log). */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { colors, fonts, spacing } from '../theme';
import { AppText } from './index';

export interface LinePoint {
  key: string;
  /** Position along the x axis (e.g. day offset). Points must be sorted by x. */
  x: number;
  value: number;
  /** Name used in the read-out, e.g. "10 Nov". */
  name: string;
}

export interface LineChartProps {
  points: LinePoint[];
  formatValue: (v: number) => string;
  height?: number;
  color?: string;
  /** Text equivalent for screen readers. */
  summary: string;
}

const GUTTER_LEFT = 40;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

export function LineChart({ points, formatValue, height = 150, color = colors.primary, summary }: LineChartProps) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const geo = useMemo(() => {
    const values = points.map((p) => p.value);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = Math.max((hi - lo) * 0.25, Math.abs(hi) * 0.01, 0.5);
    const yMin = lo - pad;
    const yMax = hi + pad;
    const x0 = points[0]?.x ?? 0;
    const x1 = points[points.length - 1]?.x ?? 0;
    const plotW = Math.max(0, width - GUTTER_LEFT - PAD_RIGHT);
    const plotH = height - PAD_TOP - PAD_BOTTOM;
    const px = (x: number) => (x1 === x0 ? GUTTER_LEFT + plotW / 2 : GUTTER_LEFT + ((x - x0) / (x1 - x0)) * plotW);
    const py = (v: number) => PAD_TOP + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    return { lo, hi, px, py, plotW };
  }, [points, width, height]);

  if (points.length === 0) return null;

  const last = points[points.length - 1];
  const sel = points.find((p) => p.key === selected) ?? last;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${geo.px(p.x).toFixed(1)},${geo.py(p.value).toFixed(1)}`).join(' ');
  const showAllDots = points.length <= 16;
  const ticks = geo.hi === geo.lo ? [geo.lo] : [geo.lo, geo.hi];

  const onPress = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    let best = points[0];
    for (const p of points) if (Math.abs(geo.px(p.x) - x) < Math.abs(geo.px(best.x) - x)) best = p;
    setSelected(best.key);
  };

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
      <AppText variant="caption" style={styles.readout} numberOfLines={1}>
        {`${sel.name} · ${formatValue(sel.value)}`}
      </AppText>
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={height}>
              {ticks.map((t) => (
                <Line key={`g-${t}`} x1={GUTTER_LEFT} x2={width - PAD_RIGHT} y1={geo.py(t)} y2={geo.py(t)} stroke={colors.border} strokeWidth={1} />
              ))}
              {ticks.map((t) => (
                <SvgText key={`t-${t}`} x={GUTTER_LEFT - 6} y={geo.py(t) + 4} fontSize={11} fontFamily={fonts.medium} fill={colors.textSecondary} textAnchor="end">
                  {String(Math.round(t * 10) / 10)}
                </SvgText>
              ))}
              {points.length > 1 ? <Path d={path} stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" fill="none" /> : null}
              {points.map((p) =>
                showAllDots || p.key === last.key || p.key === sel.key ? (
                  <Circle key={p.key} cx={geo.px(p.x)} cy={geo.py(p.value)} r={p.key === sel.key ? 5.5 : 4} fill={color} stroke={colors.surface} strokeWidth={2} />
                ) : null,
              )}
              <SvgText x={points.length > 1 ? GUTTER_LEFT : geo.px(points[0].x)} y={height - 6} fontSize={11} fontFamily={fonts.medium} fill={colors.textSecondary} textAnchor={points.length > 1 ? 'start' : 'middle'}>
                {points[0].name}
              </SvgText>
              {points.length > 1 ? (
                <SvgText x={width - PAD_RIGHT} y={height - 6} fontSize={11} fontFamily={fonts.medium} fill={colors.textSecondary} textAnchor="end">
                  {last.name}
                </SvgText>
              ) : null}
            </Svg>
            <Pressable accessible={false} onPress={onPress} style={StyleSheet.absoluteFill} />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { minHeight: 20, marginBottom: spacing.xs },
});
