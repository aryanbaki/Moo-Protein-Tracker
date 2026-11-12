import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors, radius, shadow, spacing } from '../theme';
import { AppText } from './index';

export interface ComparisonChartProps {
  title?: string;
  /** Label for the rising line. */
  withLabel?: string;
  /** Label for the flat, wobbly line. */
  withoutLabel?: string;
  /** What "up" means. */
  axisLabel?: string;
  startLabel?: string;
  endLabel?: string;
  /** Honesty note. Always shown; this chart is a drawing, not measured data. */
  caption?: string;
  /** Draw-on duration in ms. */
  duration?: number;
}

// Drawing space. Shapes are hand-placed: this is an illustration, not a plot of data.
const VB_W = 320;
const VB_H = 160;
const X0 = 10;
const X1 = 310;
const BASE_Y = 150;

type Pt = readonly [number, number];
const RISING: Pt[] = [
  [X0, 128],
  [52, 122],
  [96, 108],
  [140, 92],
  [182, 72],
  [224, 54],
  [268, 36],
  [X1, 22],
];
const WOBBLY: Pt[] = [
  [X0, 128],
  [52, 118],
  [96, 134],
  [140, 121],
  [182, 137],
  [224, 124],
  [268, 135],
  [X1, 126],
];

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(points: readonly Pt[]): string {
  const first = points[0];
  if (!first) return '';
  let d = `M${first[0]} ${first[1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)] as Pt;
    const p1 = points[i] as Pt;
    const p2 = points[i + 1] as Pt;
    const p3 = points[Math.min(points.length - 1, i + 2)] as Pt;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const RISING_D = smoothPath(RISING);
const WOBBLY_D = smoothPath(WOBBLY);
const RISING_END = RISING[RISING.length - 1] as Pt;
const WOBBLY_END = WOBBLY[WOBBLY.length - 1] as Pt;
const WEEK_TICKS = Array.from({ length: 8 }, (_, i) => X0 + ((X1 - X0) * i) / 7);

/**
 * "With vs without" illustration: a rising green line against a wobbly flat
 * red one, drawn on from left to right. It deliberately has no numbers and
 * always carries a caption saying it is an illustration.
 */
export function ComparisonChart({
  title = 'Tracking beats guessing',
  withLabel = 'With Moo',
  withoutLabel = 'Winging it',
  axisLabel = 'Days hitting your protein goal',
  startLabel = 'Week 1',
  endLabel = 'Week 8',
  caption = 'Illustration, not data from a study',
  duration = 1600,
}: ComparisonChartProps) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const height = (width * VB_H) / VB_W;
  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  const labels = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (width === 0) return;
    if (reduceMotion) {
      reveal.value = 1;
      labels.value = 1;
      return;
    }
    reveal.value = withDelay(250, withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) }));
    labels.value = withDelay(250 + duration - 150, withTiming(1, { duration: 300 }));
  }, [width, reduceMotion, duration, reveal, labels]);

  const clipStyle = useAnimatedStyle(() => ({ width: width * reveal.value }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: labels.value }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const scale = width / VB_W;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${title}. ${caption}. ${axisLabel}, ${startLabel} to ${endLabel}: the "${withLabel}" line climbs steadily, the "${withoutLabel}" line wobbles and stays flat.`}
      style={styles.card}
    >
      <AppText variant="label" style={styles.title}>
        {title}
      </AppText>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.good }]} />
          <AppText variant="small" color={colors.text}>
            {withLabel}
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.swatchDashed}>
            <View style={[styles.dash, { backgroundColor: colors.bad }]} />
            <View style={[styles.dash, { backgroundColor: colors.bad }]} />
            <View style={[styles.dash, { backgroundColor: colors.bad }]} />
          </View>
          <AppText variant="small" color={colors.text}>
            {withoutLabel}
          </AppText>
        </View>
      </View>

      <AppText variant="small" style={styles.axisLabel}>
        ↑ {axisLabel}
      </AppText>

      <View onLayout={onLayout} style={[styles.plot, { height: height || undefined, aspectRatio: height ? undefined : VB_W / VB_H }]}>
        {width > 0 ? (
          <>
            {/* Static frame: baseline and one tick per week. No value scale on purpose. */}
            <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`} style={StyleSheet.absoluteFill}>
              <Line x1={X0} y1={BASE_Y} x2={X1} y2={BASE_Y} stroke={colors.border} strokeWidth={2} strokeLinecap="round" />
              {WEEK_TICKS.map((x) => (
                <Circle key={x} cx={x} cy={BASE_Y} r={2.5} fill={colors.border} />
              ))}
            </Svg>

            {/* Lines, revealed left to right. */}
            <Animated.View style={[styles.clip, { height }, clipStyle]}>
              <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
                <Path d={WOBBLY_D} stroke={colors.bad} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 6" fill="none" />
                <Path d={RISING_D} stroke={colors.good} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </Animated.View>

            {/* End markers and direct labels appear once the lines arrive. */}
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, labelStyle]}>
              <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`} style={StyleSheet.absoluteFill}>
                <Circle cx={WOBBLY_END[0]} cy={WOBBLY_END[1]} r={5} fill={colors.bad} stroke={colors.surface} strokeWidth={2} />
                <Circle cx={RISING_END[0]} cy={RISING_END[1]} r={6} fill={colors.good} stroke={colors.surface} strokeWidth={2} />
              </Svg>
              <View style={[styles.tag, { right: (VB_W - RISING_END[0]) * scale + 12, top: RISING_END[1] * scale - 12 }]}>
                <AppText variant="small" color={colors.text} style={styles.tagText}>
                  {withLabel}
                </AppText>
              </View>
              <View style={[styles.tag, { right: (VB_W - WOBBLY_END[0]) * scale + 12, top: WOBBLY_END[1] * scale - 34 }]}>
                <AppText variant="small" color={colors.text} style={styles.tagText}>
                  {withoutLabel}
                </AppText>
              </View>
            </Animated.View>
          </>
        ) : null}
      </View>

      <View style={styles.xAxis}>
        <AppText variant="small">{startLabel}</AppText>
        <AppText variant="small">…</AppText>
        <AppText variant="small">{endLabel}</AppText>
      </View>

      <AppText variant="small" center style={styles.caption}>
        {caption}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, ...shadow.card },
  title: { fontSize: 20 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 18, height: 4, borderRadius: 2 },
  swatchDashed: { width: 18, flexDirection: 'row', justifyContent: 'space-between' },
  dash: { width: 4, height: 3, borderRadius: 2 },
  axisLabel: { marginTop: spacing.xs },
  plot: { width: '100%' },
  clip: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  tag: { position: 'absolute', backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 12 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between' },
  caption: { marginTop: spacing.xs, fontStyle: 'italic' },
});
