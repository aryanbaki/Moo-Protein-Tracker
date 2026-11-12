/**
 * Bar chart of a single series against a dashed goal line.
 * Bars that reach the goal use colors.good; the rest use colors.fill. The goal
 * line and the read-out carry the same information, so colour is never alone.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, fonts, radius, spacing } from '../theme';
import { AppText } from './index';

export interface BarDatum {
  key: string;
  /** Short x-axis label; pass '' to leave the tick unlabelled. */
  label: string;
  /** Longer name used in the read-out and for screen readers, e.g. "Tue 10 Nov". */
  name: string;
  value: number;
  /** Marks "today" (or the current month). */
  highlight?: boolean;
  /** No data for this slot (as opposed to a real zero). */
  empty?: boolean;
}

export interface BarChartProps {
  data: BarDatum[];
  goal: number;
  unit?: string;
  height?: number;
  /** Text equivalent of the whole chart for screen readers. */
  summary: string;
  /** Replaces the read-out line when nothing is selected (default: the highlighted bar). */
  hint?: string;
  /** Turns off tapping/hovering (used behind the premium lock). */
  inert?: boolean;
}

const GUTTER_LEFT = 34;
const PAD_RIGHT = 6;
const PAD_TOP = 18;
const PAD_BOTTOM = 22;
const MAX_BAR = 24;

function niceMax(value: number): number {
  if (!(value > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * pow >= value) return m * pow;
  return 10 * pow;
}

/** Column with a rounded data-end and a square baseline. */
function barPath(x: number, yTop: number, w: number, yBase: number): string {
  const h = yBase - yTop;
  const r = Math.max(0, Math.min(4, w / 2, h));
  return `M${x},${yBase} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + w - r},${yTop} Q${x + w},${yTop} ${x + w},${yTop + r} L${x + w},${yBase} Z`;
}

const fmt = (v: number) => String(Math.round(v));

export function BarChart({ data, goal, unit = 'g', height = 210, summary, hint, inert }: BarChartProps) {
  const [width, setWidth] = useState(0);
  const [pressed, setPressed] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const selected = hovered ?? pressed;

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const geo = useMemo(() => {
    const maxValue = data.reduce((m, d) => Math.max(m, d.value), 0);
    const yMax = niceMax(Math.max(maxValue, goal * 1.15));
    const plotW = Math.max(0, width - GUTTER_LEFT - PAD_RIGHT);
    const plotH = height - PAD_TOP - PAD_BOTTOM;
    const slot = data.length ? plotW / data.length : 0;
    const barW = Math.max(2, Math.min(MAX_BAR, slot - 2, slot * 0.62));
    const y = (v: number) => PAD_TOP + plotH - (Math.min(v, yMax) / yMax) * plotH;
    return { yMax, plotW, plotH, slot, barW, y, base: PAD_TOP + plotH };
  }, [data, goal, width, height]);

  // Numbers only: the selected bar, else today's (the highlighted one).
  const sel = data.find((d) => d.key === selected) ?? (hint === undefined ? data.find((d) => d.highlight) : undefined) ?? null;
  const readout = sel ? `${sel.name} · ${sel.empty ? '—' : `${fmt(sel.value)} ${unit}`}` : (hint ?? ' ');

  const ticks = [0, geo.yMax / 2, geo.yMax];
  const goalY = geo.y(goal);
  const perBarA11y = !inert && data.length <= 12;

  return (
    <View accessible={!perBarA11y} accessibilityRole={perBarA11y ? undefined : 'image'} accessibilityLabel={summary}>
      <AppText variant="caption" style={styles.readout} numberOfLines={1} accessibilityLiveRegion="polite">
        {readout}
      </AppText>
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 ? (
          <>
            <Svg width={width} height={height}>
              {data.map((d, i) =>
                d.highlight ? (
                  <Rect key={`h-${d.key}`} x={GUTTER_LEFT + i * geo.slot + 1} y={PAD_TOP - 6} width={Math.max(0, geo.slot - 2)} height={geo.plotH + 6 + PAD_BOTTOM - 2} rx={Math.min(8, geo.slot / 2)} fill={colors.surfaceAlt} />
                ) : null,
              )}
              {ticks.map((t) => (
                <Line key={`g-${t}`} x1={GUTTER_LEFT} x2={width - PAD_RIGHT} y1={geo.y(t)} y2={geo.y(t)} stroke={colors.border} strokeWidth={1} />
              ))}
              {ticks.map((t) => (
                <SvgText key={`t-${t}`} x={GUTTER_LEFT - 6} y={geo.y(t) + 4} fontSize={11} fontFamily={fonts.medium} fill={colors.textSecondary} textAnchor="end">
                  {fmt(t)}
                </SvgText>
              ))}
              {data.map((d, i) => {
                if (d.empty || d.value <= 0) return null;
                const x = GUTTER_LEFT + i * geo.slot + (geo.slot - geo.barW) / 2;
                const met = goal > 0 && d.value >= goal;
                return (
                  <Path
                    key={d.key}
                    d={barPath(x, geo.y(d.value), geo.barW, geo.base)}
                    fill={met ? colors.good : colors.fill}
                    opacity={selected && selected !== d.key ? 0.45 : 1}
                  />
                );
              })}
              {goal > 0 ? (
                <>
                  <Line x1={GUTTER_LEFT} x2={width - PAD_RIGHT} y1={goalY} y2={goalY} stroke={colors.text} strokeWidth={1.5} strokeDasharray="5 4" />
                </>
              ) : null}
              {data.map((d, i) =>
                d.label ? (
                  <SvgText
                    key={`l-${d.key}`}
                    x={GUTTER_LEFT + i * geo.slot + geo.slot / 2}
                    y={height - 6}
                    fontSize={11}
                    fontFamily={d.highlight ? fonts.black : fonts.medium}
                    fill={d.highlight ? colors.text : colors.textSecondary}
                    textAnchor="middle"
                  >
                    {d.label}
                  </SvgText>
                ) : null,
              )}
            </Svg>
            {inert
              ? null
              : data.map((d, i) => (
                  <Pressable
                    key={`p-${d.key}`}
                    accessible={perBarA11y}
                    accessibilityRole="button"
                    accessibilityLabel={d.empty ? `${d.name}: nothing logged` : `${d.name}: ${fmt(d.value)} ${unit}${goal > 0 && d.value >= goal ? ', goal met' : ''}`}
                    onPress={() => setPressed((s) => (s === d.key ? null : d.key))}
                    onHoverIn={() => setHovered(d.key)}
                    onHoverOut={() => setHovered((s) => (s === d.key ? null : s))}
                    style={[styles.hit, { left: GUTTER_LEFT + i * geo.slot, width: geo.slot, height }]}
                  />
                ))}
          </>
        ) : null}
      </View>
      {inert ? null : (
        <View style={styles.legend}>
          {goal > 0 ? (
            <View style={styles.legendKey}>
              <Svg width={20} height={12}>
                <Line x1={0} x2={20} y1={6} y2={6} stroke={colors.text} strokeWidth={1.5} strokeDasharray="5 4" />
              </Svg>
              <AppText variant="small">{`Goal ${fmt(goal)} ${unit}`}</AppText>
            </View>
          ) : null}
          <View style={styles.legendKey}>
            <View style={[styles.swatch, { backgroundColor: colors.good }]} />
            <AppText variant="small">Met</AppText>
          </View>
          <View style={styles.legendKey}>
            <View style={[styles.swatch, { backgroundColor: colors.fill }]} />
            <AppText variant="small">Under</AppText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { minHeight: 20, marginBottom: spacing.xs, borderRadius: radius.sm },
  hit: { position: 'absolute', top: 0 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xs, justifyContent: 'center', marginTop: spacing.sm },
  legendKey: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
});
