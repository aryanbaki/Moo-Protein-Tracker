/**
 * Moo: an original cartoon dairy cow. Each body part is its own SVG layer inside an
 * animated view, so Reanimated only ever touches transforms and opacity (no SVG
 * re-renders per frame). Artwork lives in art.ts, choreography in poses.ts.
 */
import { useEffect, useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { cowParts, FULL_VB, HEAD_VB, PIVOT } from './art';
import { clampProgress, CowFill } from './CowFill';
import { type Frame, Part } from './Layer';
import { type CowPose, useCowMotion } from './poses';

export interface CowProps {
  /** Rendered width in points; height follows the artwork's aspect ratio. */
  size?: number;
  pose?: CowPose;
  /**
   * When set (0..1+), the cow can show its see-through "fill" view.
   * `showFill` controls which view is visible; the cross-fade is animated.
   */
  progress?: number;
  showFill?: boolean;
  fillColor?: string;
  /** Head-only crop (used for splash / icon-like spots). */
  headOnly?: boolean;
  accessibilityLabel?: string;
  /** Force the static (Reduce Motion) presentation. */
  still?: boolean;
}

export function Cow({ size = 240, pose = 'idle', progress, showFill = false, fillColor, headOnly = false, accessibilityLabel, still = false }: CowProps) {
  const systemReduced = useReducedMotion();
  const reduced = systemReduced || still;
  const rawId = useId();
  const uid = useMemo(() => `moo${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);

  const vb = headOnly ? HEAD_VB : FULL_VB;
  const w = size;
  const h = Math.round((size * vb.h) / vb.w);
  const k = size / vb.w;
  const frame = useMemo<Frame>(() => ({ vb, w, h, uid }), [vb, w, h, uid]);

  const parts = useMemo(() => cowParts(pose), [pose]);
  const m = useCowMotion(pose, reduced);

  const hasFill = showFill || progress != null;
  const fillShown = useSharedValue(showFill ? 1 : 0);
  useEffect(() => {
    fillShown.value = reduced ? (showFill ? 1 : 0) : withTiming(showFill ? 1 : 0, { duration: 420 });
  }, [showFill, reduced, fillShown]);

  const artStyle = useAnimatedStyle(() => ({ opacity: 1 - fillShown.value }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: fillShown.value }));

  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: m.rootY.value * k }, { rotate: `${m.rootRot.value}deg` }],
  }));
  const torsoStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 + m.breath.value * 0.008 }, { scaleY: 1 + m.breath.value * 0.022 }],
  }));
  const tailStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${m.tail.value}deg` }] }));
  const legNFStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${m.legNF.value}deg` }] }));
  const legNRStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${m.legNR.value}deg` }] }));
  const legFFStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${m.legFF.value}deg` }] }));
  const legFRStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${m.legFR.value}deg` }] }));
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (m.headY.value - m.breath.value * 1.2) * k }, { rotate: `${m.headRot.value}deg` }],
  }));
  const earLStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${m.earL.value}deg` }] }));
  const earRStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${m.earR.value}deg` }] }));
  const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 - m.blink.value * 0.9 }] }));
  const jawStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: m.jawX.value * k }, { translateY: m.jawY.value * k }],
  }));
  const muzzleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: m.jawX.value * 0.35 * k }, { translateY: m.jawY.value * 0.12 * k }],
  }));
  const armStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + m.arm.value * 0.07 }, { rotate: `${m.arm.value * -4}deg` }] }));
  const shockStyle = useAnimatedStyle(() => ({ opacity: m.fx.value, transform: [{ scale: 0.92 + m.fx.value * 0.1 }] }));
  const sparkleStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -m.fx.value * 1.5 * k }] }));
  const drop0 = useAnimatedStyle(() => {
    const t = m.fx.value;
    return { opacity: t < 0.75 ? 1 : (1 - t) * 4, transform: [{ translateY: t * 26 * k }] };
  });
  const drop1 = useAnimatedStyle(() => {
    const t = (m.fx.value + 0.45) % 1;
    return { opacity: t < 0.75 ? 1 : (1 - t) * 4, transform: [{ translateY: t * 30 * k }] };
  });
  const drop2 = useAnimatedStyle(() => {
    const t = (m.fx.value + 0.75) % 1;
    return { opacity: t < 0.75 ? 1 : (1 - t) * 4, transform: [{ translateY: t * 22 * k }] };
  });

  const head = (
    <Part frame={frame} pivot={PIVOT.head} style={headStyle}>
      <Part frame={frame} shapes={parts.earL} pivot={PIVOT.earL} style={earLStyle} />
      <Part frame={frame} shapes={parts.earR} pivot={PIVOT.earR} style={earRStyle} />
      <Part frame={frame} shapes={parts.headBase} />
      <Part frame={frame} shapes={parts.eyes} pivot={PIVOT.eyes} style={eyesStyle} />
      <Part frame={frame} shapes={parts.jaw} style={jawStyle} />
      <Part frame={frame} shapes={parts.muzzle} style={muzzleStyle} />
      {parts.headTop.length ? <Part frame={frame} shapes={parts.headTop} style={pose === 'crown' ? sparkleStyle : undefined} /> : null}
    </Part>
  );

  const fx = (
    <>
      {pose === 'sweat' ? (
        <>
          <Part frame={frame} shapes={parts.sweat[0]} style={drop0} />
          <Part frame={frame} shapes={parts.sweat[1]} style={drop1} />
          <Part frame={frame} shapes={parts.sweat[2]} style={drop2} />
        </>
      ) : null}
      {pose === 'shocked' ? <Part frame={frame} shapes={parts.shockLines} pivot={[238, 60]} style={reduced ? undefined : shockStyle} /> : null}
    </>
  );

  const pct = Math.round(clampProgress(progress) * 100);
  const label = accessibilityLabel ?? (showFill && progress != null ? `Moo the cow, ${pct} percent full` : 'Moo the cow');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: w, height: h }}>
      <Animated.View style={[styles.fill, artStyle]}>
        {headOnly ? (
          <>
            {head}
            {fx}
          </>
        ) : (
          <Part frame={frame} pivot={PIVOT.root} style={rootStyle}>
            <Part frame={frame} shapes={parts.tail} pivot={PIVOT.tail} style={tailStyle} />
            <Part frame={frame} shapes={parts.legFarRear} pivot={PIVOT.legFarRear} style={legFRStyle} />
            <Part frame={frame} shapes={parts.legFarFront} pivot={PIVOT.legFarFront} style={legFFStyle} />
            <Part frame={frame} shapes={parts.torso} pivot={PIVOT.torso} style={torsoStyle} />
            <Part frame={frame} shapes={parts.legNearRear} pivot={PIVOT.legNearRear} style={legNRStyle} />
            {pose === 'flex' ? null : <Part frame={frame} shapes={parts.legNearFront} pivot={PIVOT.legNearFront} style={legNFStyle} />}
            {head}
            {pose === 'flex' ? <Part frame={frame} shapes={parts.flexArm} pivot={PIVOT.flexArm} style={armStyle} /> : null}
            {fx}
          </Part>
        )}
      </Animated.View>
      {hasFill ? (
        <Animated.View style={[styles.fill, fillStyle]}>
          <CowFill frame={frame} progress={progress} shown={showFill} color={fillColor} headOnly={headOnly} reduced={reduced} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
