import type { CowAnimation, Key } from '../rig/types';

const GO = 0.42; // the moment it actually leaves

/** Legs: wind-up lift, a frantic scramble on the spot, then the trot away. `phase` 1 or -1 picks the diagonal. */
function legs(phase: 1 | -1, reach: number, lift: number): Key[] {
  const keys: Key[] = [
    { t: 0.16, rotate: 0 },
    { t: 0.3, rotate: lift, ease: 'out' },
  ];
  // scramble (3 quick swings, feet slipping), then 5 longer strides off-screen
  const beats = [0.33, 0.36, 0.39, GO, 0.5, 0.59, 0.68, 0.77, 0.86, 0.95];
  beats.forEach((t, i) => keys.push({ t, rotate: (i % 2 ? reach : -reach) * phase * (t < GO ? 0.8 : 1), ease: 'sine' }));
  return keys;
}

/** Ears, tail, udder: bounce in time with the strides around a streamed-back pose. */
function flap(base: number, amp: number, lag: number): Key[] {
  const keys: Key[] = [];
  for (let i = 0; i <= 6; i++) keys.push({ t: Math.min(1, GO + 0.04 + lag + i * 0.09), rotate: base + (i % 2 ? amp : -amp), ease: 'sine' });
  return keys;
}

/**
 * Spots something off to the right, winds up (leans right back, one leg cocked), scrambles
 * on the spot for a beat, then shoots off to the right leaving a puff of dust.
 */
const trotOut: CowAnimation = {
  id: 'trotOut',
  name: 'Trot out',
  category: 'entrances',
  loop: false,
  durationMs: 2100,
  restFrame: 0.3,
  idle: { blink: false },
  expressions: [
    { t: 0.05, eyes: 'wide', brows: 'raised' },
    { t: 0.17, eyes: 'open', mouth: 'flat', brows: 'angry' },
    { t: GO, eyes: 'happy', mouth: 'open', brows: 'none' },
  ],
  props: [
    { kind: 'dust', from: 0.32, to: 0.46, dx: -0.06, scale: 0.8 },
    { kind: 'dust', from: 0.42, to: 0.74, dx: -0.1, scale: 1.5 },
  ],
  tracks: {
    root: [
      { t: 0, x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, opacity: 1 },
      { t: 0.08, rotate: 2, ease: 'out' }, // leans towards it
      { t: 0.16, x: 0.01, rotate: 2.5, scaleX: 1, scaleY: 1 },
      // wind-up: rocks right back onto its haunches
      { t: 0.31, x: -0.085, rotate: -9, scaleX: 1.07, scaleY: 0.92, ease: 'out' },
      { t: 0.39, x: -0.095, rotate: -10, scaleX: 1.08, scaleY: 0.91 },
      // go: stretched out flat, accelerating away
      { t: 0.46, rotate: 7, scaleX: 1.12, scaleY: 0.92, ease: 'in' },
      { t: 0.6, rotate: 5, scaleX: 1.04, scaleY: 0.98 },
      { t: GO, x: -0.09 },
      { t: 0.62, x: 0.12, ease: 'in' },
      { t: 1, x: 1.45, ease: 'linear' }, // flat out by now
      { t: 0.94, opacity: 1 },
      { t: 1, opacity: 0 },

      { t: GO, y: 0 },
      { t: 0.46, y: -0.035, ease: 'out' },
      { t: 0.5, y: 0, ease: 'in' },
      { t: 0.545, y: -0.04, ease: 'out' },
      { t: 0.59, y: 0, ease: 'in' },
      { t: 0.635, y: -0.04, ease: 'out' },
      { t: 0.68, y: 0, ease: 'in' },
      { t: 0.725, y: -0.04, ease: 'out' },
      { t: 0.77, y: 0, ease: 'in' },
      { t: 0.815, y: -0.04, ease: 'out' },
      { t: 0.86, y: 0, ease: 'in' },
    ],
    legFL: legs(1, 30, -34),
    legBR: legs(1, 24, 6),
    legFR: legs(-1, 26, -8),
    legBL: legs(-1, 28, 10),
    head: [
      { t: 0, rotate: 0, y: 0 },
      { t: 0.07, rotate: -5, y: -0.006, ease: 'out' }, // head up: what's that?
      { t: 0.16, rotate: -4 },
      { t: 0.31, rotate: 9, y: 0.01, ease: 'out' }, // head down, eyes on the target
      { t: 0.4, rotate: 10 },
      { t: 0.48, rotate: -10, y: -0.008, ease: 'out' }, // snaps back as it launches
      { t: 0.62, rotate: 2, y: 0, ease: 'inOut' },
      { t: 0.71, rotate: -4, ease: 'sine' },
      { t: 0.8, rotate: 3, ease: 'sine' },
      { t: 0.89, rotate: -4, ease: 'sine' },
    ],
    pupils: [
      { t: 0.03, x: 0 },
      { t: 0.07, x: 0.012, ease: 'out' },
      { t: 0.4, x: 0.012 },
      { t: 0.45, x: 0, ease: 'out' },
    ],
    earL: [{ t: 0, rotate: 0 }, { t: 0.08, rotate: 24, ease: 'outBack' }, { t: 0.17, rotate: 18 }, { t: 0.32, rotate: 32, ease: 'out' }, { t: 0.4, rotate: 26 }, ...flap(-26, 9, 0.02)],
    earR: [{ t: 0, rotate: 0 }, { t: 0.09, rotate: -24, ease: 'outBack' }, { t: 0.18, rotate: -18 }, { t: 0.33, rotate: 20, ease: 'out' }, { t: 0.41, rotate: 14 }, ...flap(-32, 8, 0.035)],
    tail: [
      { t: 0, rotate: 0 },
      { t: 0.1, rotate: 14, ease: 'out' },
      { t: 0.31, rotate: -30, ease: 'out' }, // curls under in the wind-up
      { t: 0.36, rotate: -20, ease: 'sine' },
      { t: 0.4, rotate: -32, ease: 'sine' },
      ...flap(56, 10, 0.03),
    ],
    udder: [{ t: 0.3, rotate: 0 }, ...flap(8, 7, 0)],
  },
};

export default trotOut;
