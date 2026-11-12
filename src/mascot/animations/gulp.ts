import type { CowAnimation } from '../rig/types';

/**
 * Bottoms up: cheeks full, the head tips back, and one big swallow travels down. The
 * head pinches first, then the body bulges and the udder bounces as it lands. Ahh.
 */
const gulp: CowAnimation = {
  id: 'gulp',
  name: 'Big gulp',
  category: 'eating',
  loop: false,
  durationMs: 2400,
  restFrame: 0.3,
  idle: { blink: false, breathe: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'flat', brows: 'none' },
    { t: 0.16, eyes: 'closed' },
    { t: 0.62, eyes: 'happy', mouth: 'open' },
    { t: 0.9, mouth: 'smile' },
    { t: 0.94, eyes: 'open' },
  ],
  props: [{ kind: 'sparkle', from: 0.64, to: 0.96 }],
  tracks: {
    head: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.1, rotate: 5, y: 0.01, scaleX: 1.06, scaleY: 0.96, ease: 'out' }, // cheeks full, dip
      { t: 0.28, rotate: -17, x: -0.012, y: -0.02, scaleX: 1.07, scaleY: 0.97, ease: 'outBack' }, // tips back
      { t: 0.36, rotate: -18, x: -0.012, y: -0.022, scaleX: 1.08, scaleY: 0.96 }, // hold, brimming
      { t: 0.43, rotate: -15, x: -0.01, y: -0.006, scaleX: 0.9, scaleY: 1.1, ease: 'in' }, // GULP: pinches thin
      { t: 0.54, rotate: -13, x: -0.008, y: -0.016, scaleX: 1, scaleY: 1, ease: 'outBack' },
      { t: 0.68, rotate: 4, x: 0, y: 0.006, ease: 'inOut' }, // comes down, satisfied
      { t: 0.84, rotate: -3, y: -0.004, ease: 'sine' },
      { t: 1, rotate: 0, y: 0, ease: 'sine' },
    ],
    // The swallow reaches the body a beat after it leaves the head.
    root: [
      { t: 0, scaleX: 1, scaleY: 1, y: 0 },
      { t: 0.1, scaleX: 1.02, scaleY: 0.97, ease: 'out' },
      { t: 0.3, scaleX: 0.975, scaleY: 1.04, ease: 'outBack' }, // stretches up to drink
      { t: 0.4, scaleX: 0.97, scaleY: 1.045 },
      { t: 0.52, scaleX: 1.09, scaleY: 0.9, ease: 'out' }, // it lands
      { t: 0.66, scaleX: 0.975, scaleY: 1.035, ease: 'inOut' },
      { t: 0.8, scaleX: 1.012, scaleY: 0.988, ease: 'sine' },
      { t: 0.92, scaleX: 1, scaleY: 1, ease: 'sine' },
    ],
    udder: [
      { t: 0.46, scaleY: 1, y: 0 },
      { t: 0.57, scaleY: 1.24, y: 0.006, ease: 'out' },
      { t: 0.68, scaleY: 0.9, y: 0 },
      { t: 0.78, scaleY: 1.08 },
      { t: 0.9, scaleY: 1, ease: 'out' },
    ],
    jaw: [
      { t: 0.36, y: 0 },
      { t: 0.43, y: 0.018, ease: 'in' },
      { t: 0.5, y: 0, ease: 'out' },
      { t: 0.62, y: 0 },
      { t: 0.68, y: 0.024, ease: 'out' }, // "ahh"
      { t: 0.86, y: 0.016 },
      { t: 0.92, y: 0 },
    ],
    earL: [
      { t: 0.08, rotate: 0 },
      { t: 0.2, rotate: -12, ease: 'out' },
      { t: 0.34, rotate: 20, ease: 'inOut' }, // laid back with the head
      { t: 0.42, rotate: 20 },
      { t: 0.48, rotate: 34, ease: 'out' }, // jolt on the swallow
      { t: 0.58, rotate: 10 },
      { t: 0.74, rotate: -16, ease: 'inOut' },
      { t: 0.86, rotate: 6 },
      { t: 0.96, rotate: 0 },
    ],
    earR: [
      { t: 0.09, rotate: 0 },
      { t: 0.21, rotate: 12, ease: 'out' },
      { t: 0.35, rotate: -20, ease: 'inOut' },
      { t: 0.43, rotate: -20 },
      { t: 0.49, rotate: -34, ease: 'out' },
      { t: 0.59, rotate: -10 },
      { t: 0.75, rotate: 16, ease: 'inOut' },
      { t: 0.87, rotate: -6 },
      { t: 0.97, rotate: 0 },
    ],
    legFL: [
      { t: 0.44, rotate: 0 },
      { t: 0.53, rotate: -7, ease: 'out' },
      { t: 0.68, rotate: 0, ease: 'outBack' },
    ],
    legBL: [
      { t: 0.44, rotate: 0 },
      { t: 0.53, rotate: 7, ease: 'out' },
      { t: 0.68, rotate: 0, ease: 'outBack' },
    ],
    // The wave runs out through the tail last.
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.3, rotate: -10, ease: 'inOut' },
      { t: 0.5, rotate: -12 },
      { t: 0.6, rotate: 42, ease: 'out' },
      { t: 0.72, rotate: -8, ease: 'inOut' },
      { t: 0.82, rotate: 22, ease: 'sine' },
      { t: 0.91, rotate: 4, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
  },
};

export default gulp;
