import type { CowAnimation, Key } from '../rig/types';

/*
 * One loop: glide backwards to the left (A), snap-spin to face the other way, glide
 * backwards to the right (B), spin back. Legs do a FORWARD walk while the body slides
 * backwards, which is the whole trick.
 */
const A0 = 0;
const A1 = 0.4;
const B0 = 0.5;
const B1 = 0.9;
const STEPS = 4;
const REACH = 0.13; // how far each glide travels either side of centre
const OFF_CENTRE = 0.1125; // the root pivot is not on the cow's centre line; see spin.ts

/** Repeat a 0..1 pattern `times` across [from, to]. */
function span(pattern: Key[], from: number, to: number, times: number): Key[] {
  const keys: Key[] = [];
  for (let i = 0; i < times; i++) {
    for (const k of pattern) {
      if (i > 0 && k.t === 0) continue;
      keys.push({ ...k, t: from + ((i + k.t) / times) * (to - from) });
    }
  }
  return keys;
}

/** Both glides, as the same pattern played in A and in B. */
function both(pattern: Key[], times: number): Key[] {
  return [...span(pattern, A0, A1, times), ...span(pattern, B0, B1, times)];
}

/** The body slides in pulses, one per step. `dir` -1 = towards the left. */
function glide(from: number, to: number, x0: number, dir: number): Key[] {
  return Array.from({ length: STEPS + 1 }, (_, i) => ({ t: from + ((to - from) * i) / STEPS, x: x0 + dir * ((2 * REACH * i) / STEPS), ease: 'inOut' as const }));
}

// A leg: long slow slide back along the floor, quick lifted snap forward.
const slideFirst: Key[] = [
  { t: 0, rotate: -17, y: 0 },
  { t: 0.68, rotate: 19, y: 0, ease: 'sine' },
  { t: 0.84, y: -0.014, ease: 'out' },
  { t: 1, rotate: -17, y: 0, ease: 'inOut' },
];
// The other pair, half a cycle later.
const snapFirst: Key[] = [
  { t: 0, rotate: 6, y: 0 },
  { t: 0.18, rotate: 19, ease: 'out' },
  { t: 0.34, y: -0.014, ease: 'out' },
  { t: 0.5, rotate: -17, y: 0, ease: 'inOut' },
  { t: 1, rotate: 6, ease: 'in' },
];
/** What a part does through the two spins (peaking `lag` after mid-spin), ending back on `rest`. */
const spins = (rotate: number, rest: number, lag = 0): Key[] => [
  { t: 0.45 + lag, rotate, ease: 'out' },
  { t: 0.95 + lag, rotate, ease: 'out' },
  { t: 1, rotate: rest, ease: 'in' },
];

const moonwalk: CowAnimation = {
  id: 'moonwalk',
  name: 'Moonwalk',
  category: 'wins',
  loop: true,
  durationMs: 4200,
  restFrame: 0.17,
  idle: { blink: false },
  expressions: [{ t: 0, eyes: 'squint', mouth: 'smile', brows: 'raised' }],
  tracks: {
    root: [
      // A: facing right, sliding left
      { t: A0, scaleX: 1 },
      ...glide(A0, A1, REACH, -1),
      { t: A1, scaleX: 1 },
      // spin to face left (the flipped cow sits OFF_CENTRE further right)
      { t: B0, scaleX: -1, x: -REACH + OFF_CENTRE, ease: 'sine' },
      // B: facing left, sliding right
      ...glide(B0, B1, -REACH + OFF_CENTRE, 1),
      { t: B1, scaleX: -1 },
      { t: 1, scaleX: 1, x: REACH, ease: 'sine' },

      // leans "forwards" while going backwards; the lean swaps with the spin
      { t: A0, rotate: 4 },
      { t: A1, rotate: 4 },
      { t: 0.45, rotate: 0, ease: 'out' },
      { t: B0, rotate: -4, ease: 'in' },
      { t: B1, rotate: -4 },
      { t: 0.95, rotate: 0, ease: 'out' },
      { t: 1, rotate: 4, ease: 'in' },

      // a small dip on every step, a hop for each spin
      ...both(
        [
          { t: 0, y: 0 },
          { t: 0.5, y: 0.012, ease: 'sine' },
          { t: 1, y: 0, ease: 'sine' },
        ],
        STEPS,
      ),
      { t: 0.45, y: -0.045, ease: 'out' },
      { t: 0.95, y: -0.045, ease: 'out' },
      { t: 1, y: 0, ease: 'in' },

      { t: 0, scaleY: 0.93 },
      { t: 0.04, scaleY: 1, ease: 'out' },
      { t: 0.37, scaleY: 1 },
      { t: 0.405, scaleY: 0.92, ease: 'out' },
      { t: 0.45, scaleY: 1.07, ease: 'out' },
      { t: 0.5, scaleY: 0.93, ease: 'in' },
      { t: 0.54, scaleY: 1, ease: 'out' },
      { t: 0.87, scaleY: 1 },
      { t: 0.905, scaleY: 0.92, ease: 'out' },
      { t: 0.95, scaleY: 1.07, ease: 'out' },
      { t: 1, scaleY: 0.93, ease: 'in' },
    ],
    legFL: [...both(slideFirst, STEPS / 2), ...spins(-12, -17)],
    legBR: [...both(slideFirst, STEPS / 2), ...spins(-4, -17)],
    legFR: [...both(snapFirst, STEPS / 2), ...spins(-4, 6)],
    legBL: [...both(snapFirst, STEPS / 2), ...spins(16, 6)],
    // Head pecks on the beat; chin up through the spin.
    head: [
      ...both(
        [
          { t: 0, rotate: -3, y: 0 },
          { t: 0.5, rotate: 5, y: 0.006, ease: 'out' },
          { t: 1, rotate: -3, y: 0, ease: 'inOut' },
        ],
        STEPS,
      ),
      ...spins(-9, -3),
    ],
    earL: [
      ...both(
        [
          { t: 0, rotate: 6 },
          { t: 0.6, rotate: -10, ease: 'sine' },
          { t: 1, rotate: 6, ease: 'sine' },
        ],
        STEPS,
      ),
      ...spins(30, 6, 0.01),
    ],
    earR: [
      ...both(
        [
          { t: 0, rotate: -4 },
          { t: 0.65, rotate: 11, ease: 'sine' },
          { t: 1, rotate: -4, ease: 'sine' },
        ],
        STEPS,
      ),
      ...spins(-30, -4, 0.02),
    ],
    tail: [
      ...both(
        [
          { t: 0, rotate: -6 },
          { t: 0.55, rotate: 20, ease: 'sine' },
          { t: 1, rotate: -6, ease: 'sine' },
        ],
        STEPS,
      ),
      ...spins(58, -6, 0.01),
    ],
    udder: both(
      [
        { t: 0, rotate: -4 },
        { t: 0.5, rotate: 5, ease: 'sine' },
        { t: 1, rotate: -4, ease: 'sine' },
      ],
      STEPS,
    ),
  },
};

export default moonwalk;
