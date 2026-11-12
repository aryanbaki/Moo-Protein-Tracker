import type { CowAnimation, Key } from '../rig/types';
import { tile } from './_helpers';

/** One tap: the hoof lifts slowly and slaps down fast; the last half of the beat is a hold. */
const tap: Key[] = [
  { t: 0, rotate: 0, y: 0 },
  { t: 0.42, rotate: -22, y: -0.012, ease: 'out' },
  { t: 0.6, rotate: 0, y: 0, ease: 'in' },
  { t: 1, rotate: 0, y: 0 },
];

/** The shoulder takes each slap: a tiny squash that lands with the hoof. */
const jolt: Key[] = [
  { t: 0, scaleY: 1, scaleX: 1 },
  { t: 0.42, scaleY: 1.008, scaleX: 0.996, ease: 'out' },
  { t: 0.62, scaleY: 0.982, scaleX: 1.012, ease: 'in' },
  { t: 1, scaleY: 1, scaleX: 1, ease: 'out' },
];

const headBob: Key[] = [
  { t: 0, y: 0 },
  { t: 0.45, y: -0.003, ease: 'sine' },
  { t: 0.68, y: 0.004, ease: 'in' },
  { t: 1, y: 0, ease: 'out' },
];

/**
 * Bored and waiting: weight on one hip, head tipped, eyes slid to the side under a flat
 * mouth, one front hoof drumming. The tail snaps irritably off the beat. Loops.
 */
const footTap: CowAnimation = {
  id: 'footTap',
  name: 'Foot tap',
  category: 'alive',
  loop: true,
  durationMs: 2400,
  restFrame: 0.1,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'squint', mouth: 'flat', brows: 'none' },
    { t: 0.5, eyes: 'closed' }, // slow, unimpressed blink
    { t: 0.56, eyes: 'squint' },
  ],
  tracks: {
    legFL: tile(tap, 4),
    root: [
      ...tile(jolt, 4),
      { t: 0, rotate: -2 },
      { t: 0.5, rotate: -2.6, ease: 'sine' },
      { t: 1, rotate: -2, ease: 'sine' },
    ],
    head: [
      ...tile(headBob, 4),
      { t: 0, rotate: 7, x: 0.004 },
      { t: 0.5, rotate: 8.5, x: 0.004, ease: 'sine' },
      { t: 1, rotate: 7, x: 0.004, ease: 'sine' },
    ],
    // Side-eye, with one glance at the offending hoof and back.
    pupils: [
      { t: 0, x: -0.012, y: 0 },
      { t: 0.5, x: -0.012, y: 0 },
      { t: 0.56, x: 0.004, y: 0.008, ease: 'hold' },
      { t: 0.74, x: 0.004, y: 0.008 },
      { t: 0.82, x: -0.012, y: 0, ease: 'out' },
      { t: 1, x: -0.012, y: 0 },
    ],
    // Rest, rest, WHIP, ring out, back to rest.
    tail: [
      { t: 0, rotate: -6 },
      { t: 0.3, rotate: -10, ease: 'sine' }, // wind-up
      { t: 0.38, rotate: 40, ease: 'out' },
      { t: 0.48, rotate: -16, ease: 'inOut' },
      { t: 0.57, rotate: 12 },
      { t: 0.66, rotate: -9 },
      { t: 0.8, rotate: -11, ease: 'sine' },
      { t: 0.87, rotate: 30, ease: 'out' },
      { t: 0.95, rotate: -12, ease: 'inOut' },
      { t: 1, rotate: -6 },
    ],
    earL: [
      { t: 0, rotate: -10 },
      { t: 0.36, rotate: -10 },
      { t: 0.42, rotate: -24, ease: 'out' },
      { t: 0.52, rotate: -6 },
      { t: 0.62, rotate: -10 },
      { t: 1, rotate: -10 },
    ],
    earR: [
      { t: 0, rotate: 12 },
      { t: 0.84, rotate: 12 },
      { t: 0.9, rotate: 26, ease: 'out' },
      { t: 0.96, rotate: 8 },
      { t: 1, rotate: 12 },
    ],
    // The hip it leans on.
    legBL: [{ t: 0, rotate: 4 }],
    legBR: [{ t: 0, rotate: 3 }],
  },
};

export default footTap;
