import type { CowAnimation } from '../rig/types';

/**
 * Deadpan. The head does not move; the smile drops, the eyes slide slowly sideways, one
 * brow climbs, a long slow blink, and it keeps staring. Then back to normal as if
 * nothing happened.
 */
const sideEye: CowAnimation = {
  id: 'sideEye',
  name: 'Side-eye',
  category: 'reactions',
  loop: false,
  durationMs: 3600,
  restFrame: 0.5,
  idle: { blink: false },
  expressions: [
    { t: 0.07, mouth: 'flat' },
    { t: 0.17, eyes: 'squint' }, // lids drop to half-mast (swapped at the bottom of a half blink)
    { t: 0.38, brows: 'raised' },
    { t: 0.925, eyes: 'open', mouth: 'smile', brows: 'none' },
  ],
  tracks: {
    pupils: [
      { t: 0.19, x: 0, y: 0 },
      { t: 0.23, x: 0.004, ease: 'out' }, // a tiny start the other way
      { t: 0.36, x: -0.014, y: 0.001, ease: 'inOut' },
      { t: 0.86, x: -0.014, y: 0.001 },
      { t: 0.94, x: 0, y: 0, ease: 'inOut' },
    ],
    eyes: [
      { t: 0.13, scaleY: 1 },
      { t: 0.17, scaleY: 0.3, ease: 'in' },
      { t: 0.21, scaleY: 1, ease: 'out' },
      { t: 0.54, scaleY: 1 },
      { t: 0.63, scaleY: 0.08, ease: 'inOut' }, // the slow blink
      { t: 0.66, scaleY: 0.08 },
      { t: 0.76, scaleY: 1, ease: 'inOut' },
      { t: 0.9, scaleY: 1 },
      { t: 0.925, scaleY: 0.1, ease: 'out' },
      { t: 0.96, scaleY: 1, ease: 'out' },
    ],
    brows: [
      { t: 0.38, y: 0.008, rotate: 0 },
      { t: 0.45, y: -0.012, rotate: -9, ease: 'outBack' }, // one side cocked higher
      { t: 0.86, y: -0.01, rotate: -8 },
      { t: 0.925, y: 0, rotate: 0, ease: 'in' },
    ],
    // The head stays put: only the faintest lean away from whatever it is looking at.
    head: [
      { t: 0.14, rotate: 0, x: 0 },
      { t: 0.34, rotate: 1.6, x: 0.003, ease: 'inOut' },
      { t: 0.86, rotate: 2, x: 0.003 },
      { t: 0.97, rotate: 0, x: 0, ease: 'outBack' },
    ],
    // One ear turns towards it, slowly; the other gives a single bored flick.
    earL: [
      { t: 0.2, rotate: 0 },
      { t: 0.4, rotate: 13, ease: 'out' },
      { t: 0.86, rotate: 11 },
      { t: 0.98, rotate: 0, ease: 'outBack' },
    ],
    earR: [
      { t: 0.42, rotate: 0 },
      { t: 0.455, rotate: 22, ease: 'out' },
      { t: 0.5, rotate: -6 },
      { t: 0.55, rotate: 0, ease: 'out' },
    ],
    tail: [
      { t: 0.3, rotate: 0 },
      { t: 0.44, rotate: 16, ease: 'out' },
      { t: 0.52, rotate: -8, ease: 'in' },
      { t: 0.6, rotate: 0, ease: 'out' },
      { t: 0.76, rotate: 0 },
      { t: 0.82, rotate: 14, ease: 'out' },
      { t: 0.9, rotate: -5, ease: 'in' },
      { t: 0.98, rotate: 0, ease: 'out' },
    ],
  },
};

export default sideEye;
