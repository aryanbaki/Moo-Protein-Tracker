/**
 * Pose choreography. Every animated part of the cow is driven by one shared value;
 * `applyPose` points those values at the right loop (or a static value when the
 * user has Reduce Motion on).
 */
import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type CowPose = 'idle' | 'wave' | 'chew' | 'flex' | 'shocked' | 'shrug' | 'dance' | 'sweat' | 'crown' | 'abducted';

export const ALL_POSES: readonly CowPose[] = ['idle', 'wave', 'chew', 'flex', 'shocked', 'shrug', 'dance', 'sweat', 'crown', 'abducted'];

const KEYS = [
  'rootY',
  'rootRot',
  'breath',
  'tail',
  'earL',
  'earR',
  'blink',
  'headRot',
  'headY',
  'jawY',
  'jawX',
  'legNF',
  'legNR',
  'legFF',
  'legFR',
  'arm',
  'fx',
] as const;

type Key = (typeof KEYS)[number];
export type CowMotion = Record<Key, SharedValue<number>>;

const ease = Easing.inOut(Easing.sin);

/** Ping-pong between two values forever. */
function swing(sv: SharedValue<number>, from: number, to: number, duration: number, delay = 0) {
  sv.value = from;
  const loop = withRepeat(withTiming(to, { duration, easing: ease }), -1, true);
  sv.value = delay ? withDelay(delay, loop) : loop;
}

function to(sv: SharedValue<number>, value: number, duration = 260) {
  sv.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
}

/** Static values per pose: where each part rests (also the Reduce Motion look). */
const REST: Record<CowPose, Partial<Record<Key, number>>> = {
  idle: {},
  wave: { legNF: -68, headRot: 5 },
  chew: { jawY: 5 },
  flex: { headRot: -3 },
  shocked: { jawY: 11, earL: 24, earR: -24, tail: 38, headY: -3 },
  shrug: { headRot: -8, legNF: -34, earL: -16, earR: 16 },
  dance: { rootRot: -4, headRot: 6, legNF: -22, legNR: 14 },
  sweat: { earL: -14, earR: 14, fx: 0.35 },
  crown: { headRot: -3 },
  abducted: { headRot: 10, earL: -22, earR: 22, tail: -30, jawY: 7, legNF: -12, legNR: 14, legFF: -4, legFR: 6 },
};

export function applyPose(m: CowMotion, pose: CowPose, reduced: boolean) {
  for (const k of KEYS) cancelAnimation(m[k]);
  const rest = REST[pose];

  if (reduced) {
    for (const k of KEYS) m[k].value = rest[k] ?? 0;
    return;
  }

  // Settle into the pose's resting values first; loops below override what moves.
  for (const k of KEYS) to(m[k], rest[k] ?? 0);

  const limp = pose === 'abducted';
  const startled = pose === 'shocked';

  if (!limp) {
    swing(m.breath, 0, 1, 1700);
    if (pose !== 'dance') {
      // Blink: one blink, a pause, then a quick double blink.
      const shut = () => withTiming(1, { duration: 70 });
      const open = () => withTiming(0, { duration: 110 });
      m.blink.value = withRepeat(
        withSequence(withDelay(2300, shut()), open(), withDelay(3100, shut()), open(), withDelay(160, shut()), open(), withDelay(900, withTiming(0, { duration: 1 }))),
        -1,
      );
    }
  }

  if (!limp && !startled) {
    if (pose === 'dance') swing(m.tail, -24, 20, 210);
    else swing(m.tail, -9, 11, 900);
  }

  if (pose === 'idle' || pose === 'wave' || pose === 'chew' || pose === 'flex' || pose === 'crown') {
    // Ear flick: mostly still, then a quick twitch.
    m.earL.value = withRepeat(
      withSequence(withDelay(3600, withTiming(20, { duration: 90 })), withTiming(-6, { duration: 120 }), withTiming(0, { duration: 180 })),
      -1,
    );
    m.earR.value = withRepeat(
      withSequence(withDelay(5300, withTiming(-18, { duration: 90 })), withTiming(5, { duration: 120 }), withTiming(0, { duration: 180 })),
      -1,
    );
  }

  switch (pose) {
    case 'idle':
      swing(m.headRot, -1.5, 2, 2400);
      break;
    case 'wave':
      swing(m.legNF, -52, -86, 330);
      swing(m.headRot, 3, 7, 660);
      break;
    case 'chew':
      swing(m.jawY, 1, 8, 250);
      swing(m.jawX, -3, 3, 500);
      swing(m.headRot, -1, 1.5, 1000);
      break;
    case 'flex':
      swing(m.arm, 0, 1, 380);
      swing(m.rootY, 0, -3, 380);
      break;
    case 'shocked':
      m.rootY.value = withRepeat(
        withSequence(
          withTiming(-24, { duration: 150, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 420, easing: Easing.bounce }),
          withDelay(1500, withTiming(0, { duration: 1 })),
        ),
        -1,
      );
      swing(m.rootRot, -0.8, 0.8, 70);
      swing(m.tail, 34, 42, 80);
      swing(m.fx, 0.6, 1, 260);
      break;
    case 'shrug':
      swing(m.rootY, 0, -5, 800);
      swing(m.legNF, -24, -42, 800);
      swing(m.headRot, -5, -11, 800);
      break;
    case 'dance':
      swing(m.rootY, 0, -11, 250);
      swing(m.rootRot, -5, 5, 500);
      swing(m.headRot, 8, -8, 500);
      swing(m.legNF, 0, -30, 250);
      swing(m.legNR, 22, 0, 250);
      swing(m.legFF, -18, 0, 250);
      swing(m.legFR, 0, 16, 250);
      break;
    case 'sweat':
      m.fx.value = 0;
      m.fx.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.in(Easing.quad) }), -1, false);
      swing(m.rootRot, -0.7, 0.7, 90);
      break;
    case 'crown':
      swing(m.headRot, -4, 2, 1500);
      swing(m.fx, 0, 1, 900);
      break;
    case 'abducted':
      swing(m.legNF, -16, -4, 1100);
      swing(m.legNR, 18, 6, 1250);
      swing(m.legFF, -2, -14, 1300, 200);
      swing(m.legFR, 4, 16, 1150, 350);
      swing(m.tail, -34, -22, 1400);
      swing(m.headRot, 8, 13, 1700);
      break;
  }
}

export function useCowMotion(pose: CowPose, reduced: boolean): CowMotion {
  // Hooks in a fixed-length loop are stable across renders.
  const m = {} as CowMotion;
  for (const k of KEYS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    m[k] = useSharedValue(reduced ? (REST[pose][k] ?? 0) : 0);
  }
  useEffect(() => {
    applyPose(m, pose, reduced);
    // Shared values are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, reduced]);
  useEffect(
    () => () => {
      for (const k of KEYS) cancelAnimation(m[k]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return m;
}
