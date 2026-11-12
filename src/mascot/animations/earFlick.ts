import type { CowAnimation } from '../rig/types';

/**
 * A fly on the ear: it twitches twice (the second one sharper), the head tips toward it
 * and the eyes glance over. The other ear only gives a small sympathetic wobble.
 */
const earFlick: CowAnimation = {
  id: 'earFlick',
  name: 'Ear flick',
  category: 'alive',
  loop: false,
  durationMs: 1500,
  restFrame: 0.45,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'smile' },
    { t: 0.14, mouth: 'flat' },
    { t: 0.42, eyes: 'squint' },
    { t: 0.56, eyes: 'open' },
    { t: 0.78, mouth: 'smile' },
  ],
  tracks: {
    earR: [
      { t: 0, rotate: 0, scaleY: 1 },
      { t: 0.1, rotate: 7, scaleY: 0.94, ease: 'out' }, // flattens first
      { t: 0.17, rotate: -34, scaleY: 1.08, ease: 'out' }, // flick 1
      { t: 0.26, rotate: 12, scaleY: 1, ease: 'inOut' },
      { t: 0.33, rotate: -4 },
      { t: 0.4, rotate: 8, scaleY: 0.92, ease: 'out' }, // flattens harder
      { t: 0.46, rotate: -44, scaleY: 1.12, ease: 'out' }, // flick 2
      { t: 0.56, rotate: 16, scaleY: 1, ease: 'inOut' },
      { t: 0.66, rotate: -9 },
      { t: 0.77, rotate: 4 },
      { t: 0.9, rotate: 0 },
    ],
    earL: [
      { t: 0.18, rotate: 0 },
      { t: 0.27, rotate: 6, ease: 'out' },
      { t: 0.37, rotate: 0 },
      { t: 0.48, rotate: 0 },
      { t: 0.58, rotate: 10, ease: 'out' },
      { t: 0.7, rotate: -4 },
      { t: 0.84, rotate: 0 },
    ],
    head: [
      { t: 0, rotate: 0, y: 0, x: 0 },
      { t: 0.12, rotate: -1.5, ease: 'out' },
      { t: 0.22, rotate: 4, x: 0.004, ease: 'outBack' },
      { t: 0.4, rotate: 3, x: 0.003 },
      { t: 0.5, rotate: 7.5, x: 0.008, y: 0.004, ease: 'outBack' },
      { t: 0.68, rotate: 6, x: 0.006, y: 0.003 },
      { t: 0.9, rotate: -1, x: 0, y: 0, ease: 'inOut' },
      { t: 1, rotate: 0, ease: 'out' },
    ],
    pupils: [
      { t: 0.08, x: 0, y: 0 },
      { t: 0.15, x: 0.011, y: -0.007, ease: 'out' },
      { t: 0.7, x: 0.011, y: -0.007 },
      { t: 0.8, x: 0, y: 0, ease: 'out' },
    ],
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.3, rotate: 14, ease: 'out' },
      { t: 0.5, rotate: -6, ease: 'sine' },
      { t: 0.66, rotate: 18, ease: 'out' },
      { t: 0.85, rotate: -4, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
  },
};

export default earFlick;
