import type { CowAnimation } from '../rig/types';

/**
 * Two bouncy hops, the second one bigger. Squash on every landing (the first landing is
 * the crouch for the second hop), ears flapping a beat behind, tail whipping.
 */
const happyHop: CowAnimation = {
  id: 'happyHop',
  name: 'Happy hop',
  category: 'wins',
  loop: false,
  durationMs: 1800,
  restFrame: 0.62,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'happy', mouth: 'smile' },
    { t: 0.12, mouth: 'open' },
    { t: 0.93, eyes: 'open', mouth: 'smile' },
  ],
  props: [
    { kind: 'dust', from: 0.4, to: 0.56, scale: 0.7 },
    { kind: 'dust', from: 0.8, to: 0.98 },
  ],
  tracks: {
    root: [
      { t: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 },
      { t: 0.09, y: 0, scaleX: 1.09, scaleY: 0.88, ease: 'out' }, // crouch
      { t: 0.135, y: -0.025, scaleX: 0.93, scaleY: 1.12, ease: 'in' }, // spring
      { t: 0.25, y: -0.085, scaleX: 0.98, scaleY: 1.04, rotate: -3, ease: 'out' }, // apex 1
      { t: 0.385, y: 0, scaleX: 0.95, scaleY: 1.08, ease: 'in' },
      { t: 0.43, y: 0, scaleX: 1.14, scaleY: 0.83, rotate: 0, ease: 'out' }, // land = crouch again
      { t: 0.49, y: -0.03, scaleX: 0.91, scaleY: 1.15, ease: 'in' },
      { t: 0.63, y: -0.15, scaleX: 0.98, scaleY: 1.04, rotate: 3.5, ease: 'out' }, // apex 2
      { t: 0.785, y: 0, scaleX: 0.94, scaleY: 1.1, ease: 'in' },
      { t: 0.83, y: 0, scaleX: 1.16, scaleY: 0.81, rotate: 0, ease: 'out' },
      { t: 1, scaleX: 1, scaleY: 1, ease: 'outElastic' },
    ],
    head: [
      { t: 0, y: 0, rotate: 0 },
      { t: 0.09, y: 0.012, rotate: 4, ease: 'out' },
      { t: 0.2, y: -0.014, rotate: -7, ease: 'out' },
      { t: 0.44, y: 0.018, rotate: 5, ease: 'in' }, // keeps falling after the feet stop
      { t: 0.58, y: -0.018, rotate: -9, ease: 'out' },
      { t: 0.845, y: 0.022, rotate: 6, ease: 'in' },
      { t: 1, y: 0, rotate: 0, ease: 'outBack' },
    ],
    // Ears: dragged down on the way up, float up past the apex, slap down on landing.
    earL: [
      { t: 0.06, rotate: 0 },
      { t: 0.15, rotate: -22, ease: 'out' },
      { t: 0.3, rotate: 28, ease: 'inOut' },
      { t: 0.46, rotate: -26, ease: 'in' },
      { t: 0.52, rotate: -20 },
      { t: 0.69, rotate: 36, ease: 'inOut' },
      { t: 0.86, rotate: -30, ease: 'in' },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    earR: [
      { t: 0.07, rotate: 0 },
      { t: 0.16, rotate: 20, ease: 'out' },
      { t: 0.32, rotate: -30, ease: 'inOut' },
      { t: 0.47, rotate: 24, ease: 'in' },
      { t: 0.53, rotate: 18 },
      { t: 0.71, rotate: -38, ease: 'inOut' },
      { t: 0.87, rotate: 28, ease: 'in' },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    tail: [
      { t: 0, rotate: 0 },
      { t: 0.12, rotate: -14, ease: 'out' },
      { t: 0.31, rotate: 42, ease: 'out' },
      { t: 0.47, rotate: -12, ease: 'in' },
      { t: 0.7, rotate: 56, ease: 'out' },
      { t: 0.88, rotate: -16, ease: 'in' },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    legFL: [
      { t: 0.09, rotate: 0 },
      { t: 0.24, rotate: -26, ease: 'out' },
      { t: 0.4, rotate: 0, ease: 'in' },
      { t: 0.47, rotate: -4 },
      { t: 0.62, rotate: -34, ease: 'out' },
      { t: 0.8, rotate: 0, ease: 'in' },
      { t: 0.84, rotate: -7, ease: 'out' },
      { t: 0.94, rotate: 0, ease: 'outBack' },
    ],
    legFR: [
      { t: 0.1, rotate: 0 },
      { t: 0.26, rotate: -14, ease: 'out' },
      { t: 0.4, rotate: 0, ease: 'in' },
      { t: 0.64, rotate: -20, ease: 'out' },
      { t: 0.8, rotate: 0, ease: 'in' },
    ],
    legBL: [
      { t: 0.09, rotate: 0 },
      { t: 0.24, rotate: 22, ease: 'out' },
      { t: 0.4, rotate: 0, ease: 'in' },
      { t: 0.47, rotate: 4 },
      { t: 0.62, rotate: 30, ease: 'out' },
      { t: 0.8, rotate: 0, ease: 'in' },
      { t: 0.84, rotate: 7, ease: 'out' },
      { t: 0.94, rotate: 0, ease: 'outBack' },
    ],
    legBR: [
      { t: 0.1, rotate: 0 },
      { t: 0.26, rotate: 12, ease: 'out' },
      { t: 0.4, rotate: 0, ease: 'in' },
      { t: 0.64, rotate: 18, ease: 'out' },
      { t: 0.8, rotate: 0, ease: 'in' },
    ],
    udder: [
      { t: 0.38, scaleY: 1 },
      { t: 0.45, scaleY: 1.2, ease: 'out' },
      { t: 0.56, scaleY: 0.94 },
      { t: 0.78, scaleY: 1 },
      { t: 0.85, scaleY: 1.24, ease: 'out' },
      { t: 1, scaleY: 1, ease: 'outElastic' },
    ],
  },
};

export default happyHop;
