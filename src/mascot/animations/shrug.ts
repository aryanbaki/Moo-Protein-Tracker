import type { CowAnimation } from '../rig/types';

/** "Dunno": a small dip, shoulders and arms pop up, head tips, hold, and let it all drop. */
const shrug: CowAnimation = {
  id: 'shrug',
  name: 'Shrug',
  category: 'reactions',
  loop: false,
  durationMs: 2000,
  restFrame: 0.5,
  expressions: [
    { t: 0.14, mouth: 'flat', brows: 'raised' },
    { t: 0.86, mouth: 'smile', brows: 'none' },
  ],
  tracks: {
    root: [
      { t: 0, y: 0, scaleY: 1 },
      { t: 0.14, y: 0, scaleY: 0.96, ease: 'out' },
      { t: 0.32, y: -0.018, scaleY: 1.03, ease: 'outBack' },
      { t: 0.7, y: -0.014, scaleY: 1.02 },
      { t: 0.86, y: 0, scaleY: 0.985, ease: 'in' },
      { t: 1, y: 0, scaleY: 1, ease: 'out' },
    ],
    armL: [
      { t: 0, rotate: 0 },
      { t: 0.14, rotate: 10, ease: 'out' },
      { t: 0.34, rotate: -78, ease: 'outBack' },
      { t: 0.7, rotate: -68 },
      { t: 0.9, rotate: 6, ease: 'in' },
      { t: 1, rotate: 0, ease: 'out' },
    ],
    armR: [
      { t: 0.03, rotate: 0 },
      { t: 0.17, rotate: 6, ease: 'out' },
      { t: 0.38, rotate: -40, ease: 'outBack' },
      { t: 0.72, rotate: -34 },
      { t: 0.92, rotate: 0, ease: 'in' },
    ],
    head: [
      { t: 0, rotate: 0, y: 0 },
      { t: 0.14, rotate: 3, y: 0.006, ease: 'out' },
      { t: 0.36, rotate: -11, y: -0.008, ease: 'outBack' },
      { t: 0.7, rotate: -8, y: -0.006 },
      { t: 0.92, rotate: 1.5, y: 0.003 },
      { t: 1, rotate: 0, y: 0 },
    ],
    // Ears lag behind the head tilt, then droop.
    earL: [
      { t: 0.14, rotate: 0 },
      { t: 0.3, rotate: 10, ease: 'out' },
      { t: 0.48, rotate: -18 },
      { t: 0.72, rotate: -14 },
      { t: 0.96, rotate: 0, ease: 'outBack' },
    ],
    earR: [
      { t: 0.14, rotate: 0 },
      { t: 0.3, rotate: -10, ease: 'out' },
      { t: 0.48, rotate: 18 },
      { t: 0.72, rotate: 14 },
      { t: 0.96, rotate: 0, ease: 'outBack' },
    ],
    brows: [
      { t: 0.14, y: 0.008 },
      { t: 0.34, y: -0.006, ease: 'outBack' },
      { t: 0.8, y: 0 },
    ],
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.36, rotate: 20, ease: 'out' },
      { t: 0.7, rotate: 12 },
      { t: 0.9, rotate: -8 },
      { t: 1, rotate: 0 },
    ],
  },
};

export default shrug;
