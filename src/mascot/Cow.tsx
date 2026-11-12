/**
 * Moo, the app's cow. A thin wrapper over the rig: picks a skin and an animation,
 * and cross-fades to the see-through "fill" view when asked.
 */
import { useEffect, useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { ANIMATIONS, getAnimation } from './animations';
import { clampProgress, CowFill } from './CowFill';
import { CowRig } from './rig/CowRig';
import type { Frame } from './rig/Layer';
import { getSkin } from './skins';

export type CowPose = 'idle' | 'wave' | 'chew' | 'flex' | 'shocked' | 'shrug' | 'dance' | 'sweat' | 'crown' | 'abducted';

export const ALL_POSES: readonly CowPose[] = ['idle', 'wave', 'chew', 'flex', 'shocked', 'shrug', 'dance', 'sweat', 'crown', 'abducted'];

/** The original poses, as animations. Poses loop except the crown, which drops once and stays on. */
const POSE_ANIMATION: Record<CowPose, { id: string; loop: boolean }> = {
  idle: { id: 'breathe', loop: true },
  wave: { id: 'wave', loop: true },
  chew: { id: 'chew', loop: true },
  flex: { id: 'flex', loop: true },
  shocked: { id: 'shockedJump', loop: true },
  shrug: { id: 'shrug', loop: true },
  dance: { id: 'dance', loop: true },
  sweat: { id: 'sweat', loop: true },
  crown: { id: 'crownDrop', loop: false },
  abducted: { id: 'abducted', loop: true },
};

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
  /** Skin id from src/mascot/skins (defaults to the app's cow). */
  skin?: string;
  /** Animation id from src/mascot/animations. Wins over `pose`. */
  animation?: string;
  /** Overrides the animation's own loop setting. */
  loop?: boolean;
  /** Called when a play-once animation finishes (it then holds its last frame). */
  onAnimationDone?: () => void;
}

export function Cow({
  size = 240,
  pose = 'idle',
  progress,
  showFill = false,
  fillColor,
  headOnly = false,
  accessibilityLabel,
  still = false,
  skin: skinId,
  animation,
  loop,
  onAnimationDone,
}: CowProps) {
  const systemReduced = useReducedMotion();
  const reduced = systemReduced || still;
  const rawId = useId();
  const uid = useMemo(() => `moo${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);

  const skin = getSkin(skinId);
  const known = animation != null && ANIMATIONS.some((a) => a.id === animation);
  const anim = getAnimation(known ? animation : POSE_ANIMATION[pose].id);
  const loops = loop ?? (known ? undefined : POSE_ANIMATION[pose].loop);

  const vb = headOnly ? skin.headBox : skin.viewBox;
  const w = size;
  const h = Math.round((size * vb.h) / vb.w);
  const frame = useMemo<Frame>(() => ({ vb, w, h, k: w / vb.w, unit: (skin.viewBox.w * w) / vb.w, uid }), [vb, w, h, uid, skin.viewBox.w]);

  const hasFill = showFill || progress != null;
  const fillShown = useSharedValue(showFill ? 1 : 0);
  useEffect(() => {
    fillShown.value = reduced ? (showFill ? 1 : 0) : withTiming(showFill ? 1 : 0, { duration: 420 });
  }, [showFill, reduced, fillShown]);

  const artStyle = useAnimatedStyle(() => ({ opacity: 1 - fillShown.value }));
  const fillStyle = useAnimatedStyle(() => ({ opacity: fillShown.value }));

  const pct = Math.round(clampProgress(progress) * 100);
  const label = accessibilityLabel ?? (showFill && progress != null ? `Moo the cow, ${pct} percent full` : 'Moo the cow');

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: w, height: h }}>
      <Animated.View style={[styles.fill, artStyle]}>
        <CowRig skin={skin} animation={anim} size={size} headOnly={headOnly} loop={loops} onDone={onAnimationDone} reduced={reduced} uid={uid} />
      </Animated.View>
      {hasFill ? (
        <Animated.View style={[styles.fill, fillStyle]}>
          <CowFill frame={frame} skin={skin} progress={progress} shown={showFill} color={fillColor} headOnly={headOnly} reduced={reduced} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
