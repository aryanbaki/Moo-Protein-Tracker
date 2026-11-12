import type { CowAnimation } from '../rig/types';

/** Wind up, crack the tail high, and let it whip itself out. The cow glances back at it. */
const tailSwish: CowAnimation = {
  id: 'tailSwish',
  name: 'Tail swish',
  category: 'alive',
  loop: false,
  durationMs: 1700,
  restFrame: 0.3,
  tracks: {
    tail: [
      { t: 0, rotate: 0 },
      { t: 0.14, rotate: -16, ease: 'out' }, // anticipation: tuck in
      { t: 0.3, rotate: 46, ease: 'outBack' }, // the swish
      { t: 0.46, rotate: -20 },
      { t: 0.6, rotate: 24 },
      { t: 0.74, rotate: -9 },
      { t: 0.87, rotate: 7 },
      { t: 1, rotate: 0 },
    ],
    body: [
      { t: 0, scaleX: 1 },
      { t: 0.14, scaleX: 1.012 },
      { t: 0.3, scaleX: 0.99, ease: 'out' },
      { t: 0.6, scaleX: 1 },
    ],
    head: [
      { t: 0, rotate: 0, x: 0 },
      { t: 0.24, rotate: -5, x: -0.008, ease: 'out' },
      { t: 0.62, rotate: -4, x: -0.006 },
      { t: 0.9, rotate: 0, x: 0, ease: 'outBack' },
    ],
    pupils: [
      { t: 0.05, x: 0 },
      { t: 0.2, x: -0.012, ease: 'out' },
      { t: 0.66, x: -0.012 },
      { t: 0.82, x: 0 },
    ],
    earL: [
      { t: 0.2, rotate: 0 },
      { t: 0.34, rotate: 14, ease: 'out' },
      { t: 0.6, rotate: -5 },
      { t: 0.85, rotate: 0 },
    ],
    legBL: [
      { t: 0.14, rotate: 0 },
      { t: 0.3, rotate: 4, ease: 'out' },
      { t: 0.55, rotate: 0 },
    ],
  },
};

export default tailSwish;
