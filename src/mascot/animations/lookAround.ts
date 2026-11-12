import type { CowAnimation } from '../rig/types';

/**
 * Curious glance: the eyes dart first, the head follows, the ears arrive late and
 * overshoot. Hold, then the same the other way (bigger, with a lean), and back to centre.
 */
const lookAround: CowAnimation = {
  id: 'lookAround',
  name: 'Look around',
  category: 'alive',
  loop: false,
  durationMs: 3200,
  restFrame: 0.24,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'smile', brows: 'none' },
    { t: 0.5, brows: 'raised' },
    { t: 0.84, brows: 'none' },
  ],
  tracks: {
    // Eyes lead every move by ~0.05 t.
    pupils: [
      { t: 0, x: 0, y: 0 },
      { t: 0.07, x: -0.012, y: -0.002, ease: 'out' },
      { t: 0.4, x: -0.012, y: -0.002 },
      { t: 0.47, x: 0.012, y: -0.004, ease: 'inOut' },
      { t: 0.8, x: 0.012, y: -0.004 },
      { t: 0.87, x: 0, y: 0, ease: 'out' },
    ],
    // A blink covers the big swing across.
    eyes: [
      { t: 0.42, scaleY: 1 },
      { t: 0.455, scaleY: 0.1, ease: 'in' },
      { t: 0.5, scaleY: 1, ease: 'out' },
    ],
    head: [
      { t: 0.04, rotate: 0, x: 0, y: 0 },
      { t: 0.09, rotate: 2, x: 0.004, ease: 'out' }, // tiny counter-move
      { t: 0.21, rotate: -9, x: -0.022, y: -0.006, ease: 'outBack' },
      { t: 0.42, rotate: -7.5, x: -0.02, y: -0.004, ease: 'sine' }, // drifting hold
      { t: 0.47, rotate: -9.5, x: -0.024, y: 0.002, ease: 'out' }, // dip before the swing
      { t: 0.62, rotate: 10, x: 0.026, y: -0.008, ease: 'outBack' },
      { t: 0.83, rotate: 8.5, x: 0.023, y: -0.006, ease: 'sine' },
      { t: 0.95, rotate: -1, x: -0.002, y: 0.002, ease: 'inOut' },
      { t: 1, rotate: 0, x: 0, y: 0, ease: 'out' },
    ],
    root: [
      { t: 0.44, rotate: 0, scaleY: 1, scaleX: 1 },
      { t: 0.5, rotate: -0.8, scaleY: 0.985, scaleX: 1.01, ease: 'out' },
      { t: 0.64, rotate: 1.8, scaleY: 1.012, scaleX: 0.994, ease: 'out' }, // leans into the second look
      { t: 0.84, rotate: 1.5, scaleY: 1.008, scaleX: 0.996 },
      { t: 0.97, rotate: 0, scaleY: 1, scaleX: 1 },
    ],
    earL: [
      { t: 0.09, rotate: 0 },
      { t: 0.18, rotate: 14, ease: 'out' }, // dragged behind
      { t: 0.29, rotate: -12, ease: 'inOut' },
      { t: 0.37, rotate: 3 },
      { t: 0.47, rotate: 0 },
      { t: 0.58, rotate: -20, ease: 'out' },
      { t: 0.7, rotate: 14, ease: 'inOut' },
      { t: 0.78, rotate: -4 },
      { t: 0.86, rotate: 2 },
      { t: 0.94, rotate: -8 },
      { t: 1, rotate: 0, ease: 'outBack' },
    ],
    earR: [
      { t: 0.1, rotate: 0 },
      { t: 0.2, rotate: 12, ease: 'out' },
      { t: 0.31, rotate: -10, ease: 'inOut' },
      { t: 0.39, rotate: 2 },
      { t: 0.48, rotate: 0 },
      { t: 0.6, rotate: -18, ease: 'out' },
      { t: 0.72, rotate: 16, ease: 'inOut' },
      { t: 0.8, rotate: -5 },
      { t: 0.88, rotate: 2 },
      { t: 0.95, rotate: -7 },
      { t: 1, rotate: 0, ease: 'outBack' },
    ],
    tail: [
      { t: 0, rotate: 0 },
      { t: 0.3, rotate: 12, ease: 'sine' },
      { t: 0.55, rotate: -8, ease: 'sine' },
      { t: 0.72, rotate: 22, ease: 'out' },
      { t: 0.88, rotate: -5, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
  },
};

export default lookAround;
