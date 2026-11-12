import type { CowAnimation } from '../rig/types';

/**
 * A big goodbye wave with the head tipped over, then it backs away two small steps,
 * still giving a last little wave, a bit sorry to go.
 */
const waveBye: CowAnimation = {
  id: 'waveBye',
  name: 'Wave bye',
  category: 'entrances',
  loop: false,
  durationMs: 3000,
  restFrame: 0.3,
  expressions: [
    { t: 0.14, eyes: 'happy', mouth: 'open' },
    { t: 0.6, eyes: 'open', mouth: 'smile', brows: 'worried' },
  ],
  tracks: {
    armL: [
      { t: 0, rotate: 0 },
      { t: 0.07, rotate: 12, ease: 'out' }, // dips before it comes up
      { t: 0.19, rotate: -168, ease: 'outBack' },
      { t: 0.27, rotate: -128, ease: 'sine' },
      { t: 0.35, rotate: -176, ease: 'sine' },
      { t: 0.43, rotate: -128, ease: 'sine' },
      { t: 0.51, rotate: -172, ease: 'sine' },
      { t: 0.58, rotate: -134, ease: 'sine' },
      // lower, smaller wave while backing off
      { t: 0.68, rotate: -92, ease: 'inOut' },
      { t: 0.74, rotate: -118, ease: 'sine' },
      { t: 0.8, rotate: -92, ease: 'sine' },
      { t: 0.86, rotate: -112, ease: 'sine' },
      { t: 0.97, rotate: 4, ease: 'inOut' },
      { t: 1, rotate: 0, ease: 'out' },
    ],
    root: [
      { t: 0, x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 },
      { t: 0.07, scaleX: 1.03, scaleY: 0.96, ease: 'out' },
      { t: 0.2, y: -0.012, rotate: -3, scaleX: 0.99, scaleY: 1.03, ease: 'outBack' }, // up on its toes
      // bobs with the wave
      { t: 0.27, y: -0.004, ease: 'sine' },
      { t: 0.35, y: -0.014, ease: 'sine' },
      { t: 0.43, y: -0.004, ease: 'sine' },
      { t: 0.51, y: -0.014, ease: 'sine' },
      { t: 0.6, x: 0, y: 0, rotate: -1, scaleX: 1, scaleY: 1, ease: 'inOut' },
      // step back ...
      { t: 0.66, y: -0.018, ease: 'out' },
      { t: 0.72, x: -0.05, y: 0, rotate: -3, ease: 'in' },
      { t: 0.74, scaleX: 1.03, scaleY: 0.96, ease: 'out' },
      { t: 0.79, scaleX: 1, scaleY: 1 },
      // ... and another, smaller
      { t: 0.84, y: -0.012, ease: 'out' },
      { t: 0.9, x: -0.085, y: 0, rotate: -2, ease: 'in' },
      { t: 0.92, scaleX: 1.02, scaleY: 0.97, ease: 'out' },
      { t: 1, rotate: -1, scaleX: 1, scaleY: 1, ease: 'out' },
    ],
    head: [
      { t: 0, rotate: 0, y: 0 },
      { t: 0.08, rotate: -3, ease: 'out' },
      { t: 0.24, rotate: 12, y: 0.004, ease: 'outBack' }, // tips over towards the wave
      { t: 0.35, rotate: 9, ease: 'sine' },
      { t: 0.45, rotate: 13, ease: 'sine' },
      { t: 0.56, rotate: 10, ease: 'sine' },
      { t: 0.7, rotate: -5, y: 0, ease: 'inOut' }, // straightens, a look back
      { t: 0.88, rotate: 5, y: 0.006, ease: 'inOut' },
      { t: 1, rotate: 4, y: 0.006 },
    ],
    // Ears lag the tilt and end up a little drooped.
    earL: [
      { t: 0.1, rotate: 0 },
      { t: 0.22, rotate: 16, ease: 'out' },
      { t: 0.34, rotate: -16, ease: 'inOut' },
      { t: 0.45, rotate: -8, ease: 'sine' },
      { t: 0.58, rotate: -14, ease: 'sine' },
      { t: 0.75, rotate: 10, ease: 'inOut' },
      { t: 0.94, rotate: -14, ease: 'inOut' },
      { t: 1, rotate: -12 },
    ],
    earR: [
      { t: 0.12, rotate: 0 },
      { t: 0.24, rotate: -14, ease: 'out' },
      { t: 0.36, rotate: 18, ease: 'inOut' },
      { t: 0.47, rotate: 10, ease: 'sine' },
      { t: 0.6, rotate: 16, ease: 'sine' },
      { t: 0.77, rotate: -8, ease: 'inOut' },
      { t: 0.95, rotate: 14, ease: 'inOut' },
      { t: 1, rotate: 12 },
    ],
    brows: [
      { t: 0.6, y: 0.006 },
      { t: 0.68, y: 0, ease: 'out' },
    ],
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.24, rotate: 30, ease: 'out' },
      { t: 0.32, rotate: 4, ease: 'sine' },
      { t: 0.4, rotate: 30, ease: 'sine' },
      { t: 0.48, rotate: 4, ease: 'sine' },
      { t: 0.56, rotate: 26, ease: 'sine' },
      { t: 0.74, rotate: -12, ease: 'inOut' }, // swings forward as it steps back
      { t: 0.84, rotate: 8 },
      { t: 0.93, rotate: -10 },
      { t: 1, rotate: -4 },
    ],
    // The back-away steps: far front and near back, then far back.
    legBL: [
      { t: 0.6, rotate: 0 },
      { t: 0.66, rotate: 20, ease: 'out' },
      { t: 0.73, rotate: 0, ease: 'in' },
      { t: 0.84, rotate: 4 },
      { t: 0.91, rotate: 0 },
    ],
    legFR: [
      { t: 0.62, rotate: 0 },
      { t: 0.68, rotate: 16, ease: 'out' },
      { t: 0.75, rotate: 0, ease: 'in' },
      { t: 0.82, rotate: 0 },
      { t: 0.87, rotate: 12, ease: 'out' },
      { t: 0.93, rotate: 0, ease: 'in' },
    ],
    legBR: [
      { t: 0.8, rotate: 0 },
      { t: 0.85, rotate: 16, ease: 'out' },
      { t: 0.91, rotate: 0, ease: 'in' },
    ],
  },
};

export default waveBye;
