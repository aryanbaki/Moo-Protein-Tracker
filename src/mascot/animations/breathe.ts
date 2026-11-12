import type { CowAnimation } from '../rig/types';

/** The resting loop: slow head sway, lazy tail, an ear flick now and then. */
const tailBeat = (i: number) => [
  { t: i / 3, rotate: -9, ease: 'sine' as const },
  { t: (i + 0.5) / 3, rotate: 11, ease: 'sine' as const },
];

const breathe: CowAnimation = {
  id: 'breathe',
  name: 'Breathe',
  category: 'alive',
  loop: true,
  durationMs: 5400,
  restFrame: 0,
  tracks: {
    head: [
      { t: 0, rotate: -1.5 },
      { t: 0.5, rotate: 2, ease: 'sine' },
      { t: 1, rotate: -1.5, ease: 'sine' },
    ],
    tail: [...tailBeat(0), ...tailBeat(1), ...tailBeat(2), { t: 1, rotate: -9, ease: 'sine' }],
    // A quick flick, then a small overshoot the other way before it settles.
    earL: [
      { t: 0.6, rotate: 0 },
      { t: 0.617, rotate: 20, ease: 'out' },
      { t: 0.64, rotate: -6 },
      { t: 0.675, rotate: 0 },
    ],
    earR: [
      { t: 0.86, rotate: 0 },
      { t: 0.877, rotate: -18, ease: 'out' },
      { t: 0.9, rotate: 5 },
      { t: 0.935, rotate: 0 },
    ],
  },
};

export default breathe;
