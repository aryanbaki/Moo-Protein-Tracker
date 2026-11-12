import type { CowAnimation, EasingName, Key } from '../rig/types';

/**
 * How far the cow must be lifted (cow widths) so it rests on the ground, not in it, while
 * tipped `deg` degrees backwards around its feet. Sized for the tallest skins: a squat
 * one ends a hair above the floor, which nobody can see.
 */
const LIFT: readonly (readonly [number, number])[] = [
  [0, 0],
  [45, 0.15],
  [90, 0.32],
  [135, 0.58],
  [172, 0.68],
  [180, 0.7],
];

function lift(deg: number): number {
  const d = Math.max(0, Math.min(180, deg));
  for (let i = 1; i < LIFT.length; i++) {
    const [d0, y0] = LIFT[i - 1]!;
    const [d1, y1] = LIFT[i]!;
    if (d <= d1) return y0 + ((y1 - y0) * (d - d0)) / (d1 - d0);
  }
  return 0.7;
}

/** Root key for the cow tipped `deg` backwards, `hop` above the ground. */
function tipped(t: number, deg: number, hop = 0, ease: EasingName = 'linear'): Key {
  return { t, rotate: -deg, x: 0.13 * Math.max(0, Math.min(1, deg / 90)), y: -lift(deg) - hop, ease };
}

/** The felled-tree part: rigid, slow to start, accelerating all the way to the floor. */
const FALL_FROM = 0.4;
const FALL_TO = 0.58;
const fall: Key[] = Array.from({ length: 9 }, (_, i) => {
  const u = (i + 1) / 9;
  return tipped(FALL_FROM + (FALL_TO - FALL_FROM) * u, 90 * u * u * u);
});

/** A stiff leg jerking around `base`, dying away. */
function twitch(from: number, base: number, amp: number, offset = 0): Key[] {
  const keys: Key[] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const decay = 1 - (i / n) * 0.75;
    const burst = i === 4 ? 1.6 : 1; // one last bigger kick
    keys.push({ t: Math.min(1, from + offset + ((1 - from - offset) * i) / n), rotate: base + (i % 2 ? amp : -amp) * decay * burst, ease: i % 2 ? 'out' : 'inOut' });
  }
  return keys;
}

/**
 * Goes woozy, sways wider and wider, locks up stiff and tips over backwards like a felled
 * tree, bounces onto its back and stays there, legs in the air, twitching.
 */
const faint: CowAnimation = {
  id: 'faint',
  name: 'Faint',
  category: 'reactions',
  loop: false,
  durationMs: 3400,
  restFrame: 1,
  idle: { breathe: false, blink: false },
  expressions: [
    { t: 0.05, eyes: 'wonky', mouth: 'wavy', brows: 'worried' },
    { t: 0.36, mouth: 'flat' },
    { t: 0.68, mouth: 'tongue', brows: 'none' },
  ],
  props: [{ kind: 'dust', from: 0.575, to: 0.8, dx: -0.02, scale: 1.3 }],
  tracks: {
    root: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.05, scaleX: 1.03, scaleY: 0.97, ease: 'out' }, // the wobble hits
      // woozy sway, each swing a bit wider
      { t: 0.11, rotate: 2.5, scaleX: 1, scaleY: 1, ease: 'sine' },
      { t: 0.19, rotate: -4, ease: 'sine' },
      { t: 0.27, rotate: 5.5, ease: 'sine' },
      { t: 0.34, rotate: -2, ease: 'sine' },
      // locks up stiff, tips the wrong way for a beat ...
      { t: 0.4, rotate: 3, x: 0, y: 0, scaleX: 0.96, scaleY: 1.05, ease: 'out' },
      // ... and goes over
      ...fall,
      { t: 0.585, scaleX: 0.96, scaleY: 1.05 },
      { t: 0.6, scaleX: 1.07, scaleY: 0.92, ease: 'out' }, // rump hits
      tipped(0.635, 136, 0.05, 'out'), // bounces over onto its back
      { t: 0.64, scaleX: 1, scaleY: 1 },
      tipped(0.69, 176, 0, 'in'),
      { t: 0.71, scaleX: 1.08, scaleY: 0.9, ease: 'out' },
      tipped(0.74, 167, 0.03, 'out'),
      tipped(0.79, 172, 0, 'in'),
      { t: 0.86, scaleX: 1, scaleY: 1, ease: 'outElastic' },
    ],
    // The head lolls behind the sway, whips on impact, then flops.
    head: [
      { t: 0, rotate: 0, y: 0 },
      { t: 0.15, rotate: -5, y: 0.004, ease: 'sine' },
      { t: 0.23, rotate: 7, ease: 'sine' },
      { t: 0.31, rotate: -8, y: 0.008, ease: 'sine' },
      { t: 0.4, rotate: 3, y: -0.004, ease: 'out' },
      { t: 0.56, rotate: 9, ease: 'in' },
      { t: 0.63, rotate: -14, y: 0.01, ease: 'out' },
      { t: 0.72, rotate: 16, ease: 'out' },
      { t: 0.86, rotate: 10, y: 0.004, ease: 'outBack' },
    ],
    pupils: [
      { t: 0.05, x: 0, y: 0 },
      { t: 0.12, x: 0.008, y: -0.006, ease: 'sine' },
      { t: 0.19, x: -0.008, y: -0.004, ease: 'sine' },
      { t: 0.26, x: 0.006, y: 0.006, ease: 'sine' },
      { t: 0.33, x: -0.006, y: 0.004, ease: 'sine' },
      { t: 0.4, x: 0, y: -0.008, ease: 'out' }, // eyes roll up
    ],
    jaw: [
      { t: 0.6, y: 0 },
      { t: 0.7, y: 0.022, ease: 'out' },
      { t: 0.86, y: 0.014, ease: 'outBack' },
    ],
    earL: [
      { t: 0.05, rotate: 0 },
      { t: 0.14, rotate: -16, ease: 'out' },
      { t: 0.3, rotate: -8, ease: 'sine' },
      { t: 0.4, rotate: 14, ease: 'out' }, // pricks as it locks up
      { t: 0.57, rotate: -24, ease: 'in' }, // left behind by the fall
      { t: 0.66, rotate: 40, ease: 'out' },
      { t: 0.74, rotate: 12 },
      { t: 0.9, rotate: 28, ease: 'outElastic' },
    ],
    earR: [
      { t: 0.05, rotate: 0 },
      { t: 0.15, rotate: 18, ease: 'out' },
      { t: 0.31, rotate: 8, ease: 'sine' },
      { t: 0.4, rotate: -14, ease: 'out' },
      { t: 0.58, rotate: -30, ease: 'in' },
      { t: 0.67, rotate: -44, ease: 'out' },
      { t: 0.75, rotate: -10 },
      { t: 0.92, rotate: -26, ease: 'outElastic' },
    ],
    tail: [
      { t: 0, rotate: 0 },
      { t: 0.14, rotate: -8, ease: 'sine' },
      { t: 0.22, rotate: 10, ease: 'sine' },
      { t: 0.3, rotate: -12, ease: 'sine' },
      { t: 0.4, rotate: 30, ease: 'out' }, // sticks out stiff
      { t: 0.58, rotate: 42, ease: 'in' },
      { t: 0.66, rotate: -20, ease: 'out' },
      { t: 0.76, rotate: 62, ease: 'out' },
      { t: 0.92, rotate: 48, ease: 'outElastic' },
    ],
    legFL: [{ t: 0.4, rotate: 0 }, { t: 0.6, rotate: 0 }, { t: 0.7, rotate: -30, ease: 'out' }, ...twitch(0.76, -18, 9)],
    legFR: [{ t: 0.4, rotate: 0 }, { t: 0.61, rotate: 0 }, { t: 0.72, rotate: -4, ease: 'out' }, ...twitch(0.76, -2, 7, 0.02)],
    legBL: [{ t: 0.4, rotate: 0 }, { t: 0.6, rotate: 0 }, { t: 0.7, rotate: 28, ease: 'out' }, ...twitch(0.76, 16, -10, 0.01)],
    legBR: [{ t: 0.4, rotate: 0 }, { t: 0.61, rotate: 0 }, { t: 0.72, rotate: 6, ease: 'out' }, ...twitch(0.76, 3, -6, 0.03)],
    udder: [
      { t: 0.58, scaleY: 1, rotate: 0 },
      { t: 0.62, scaleY: 1.2, rotate: -8, ease: 'out' },
      { t: 0.72, scaleY: 0.9, rotate: 8 },
      { t: 0.9, scaleY: 1, rotate: 0, ease: 'outElastic' },
    ],
  },
};

export default faint;
