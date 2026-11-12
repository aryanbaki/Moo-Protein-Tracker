import type { CowAnimation } from '../rig/types';

/**
 * "Nope.": eyes shut, a small wind-up, then three shakes that die away. The eyes and
 * ears trail each swing; the body counter-twists a little. Ends on a flat stare.
 */
const headShake: CowAnimation = {
  id: 'headShake',
  name: 'Head shake',
  category: 'reactions',
  loop: false,
  durationMs: 1900,
  restFrame: 0.22,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'squint', mouth: 'flat', brows: 'none' },
    { t: 0.1, eyes: 'closed' },
    { t: 0.76, eyes: 'squint' },
    { t: 0.97, eyes: 'open', mouth: 'smile' },
  ],
  tracks: {
    // In a front view a turn reads as a slide plus a tilt into it.
    head: [
      { t: 0, x: 0, rotate: 0, y: 0 },
      { t: 0.1, x: 0.01, rotate: 3, y: 0.004, ease: 'out' }, // wind-up
      { t: 0.22, x: -0.04, rotate: -11, ease: 'inOut' }, // 1
      { t: 0.36, x: 0.036, rotate: 10, ease: 'inOut' },
      { t: 0.48, x: -0.027, rotate: -7.5, ease: 'inOut' }, // 2
      { t: 0.59, x: 0.02, rotate: 5.5, ease: 'inOut' },
      { t: 0.69, x: -0.012, rotate: -3.5, ease: 'inOut' }, // 3
      { t: 0.78, x: 0.005, rotate: 1.5, ease: 'inOut' },
      { t: 0.9, x: 0, rotate: 0, y: 0.004, ease: 'sine' },
      { t: 1, y: 0, ease: 'sine' },
    ],
    root: [
      { t: 0, rotate: 0, scaleY: 1, scaleX: 1 },
      { t: 0.1, rotate: -0.6, scaleY: 0.98, scaleX: 1.012, ease: 'out' },
      { t: 0.25, rotate: 2.2, ease: 'inOut' },
      { t: 0.39, rotate: -2, ease: 'inOut' },
      { t: 0.51, rotate: 1.4, ease: 'inOut' },
      { t: 0.62, rotate: -1, ease: 'inOut' },
      { t: 0.72, rotate: 0.6, ease: 'inOut' },
      { t: 0.84, rotate: 0, scaleY: 1, scaleX: 1, ease: 'sine' },
    ],
    // Both ears swing the same way, a beat behind the skull, and ring on after it stops.
    earL: [
      { t: 0.1, rotate: 0 },
      { t: 0.19, rotate: 26, ease: 'out' },
      { t: 0.33, rotate: -30, ease: 'inOut' },
      { t: 0.46, rotate: 24, ease: 'inOut' },
      { t: 0.57, rotate: -18, ease: 'inOut' },
      { t: 0.67, rotate: 13, ease: 'inOut' },
      { t: 0.77, rotate: -9, ease: 'inOut' },
      { t: 0.86, rotate: 5, ease: 'sine' },
      { t: 0.94, rotate: -2, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    earR: [
      { t: 0.11, rotate: 0 },
      { t: 0.21, rotate: 22, ease: 'out' },
      { t: 0.35, rotate: -32, ease: 'inOut' },
      { t: 0.48, rotate: 22, ease: 'inOut' },
      { t: 0.59, rotate: -20, ease: 'inOut' },
      { t: 0.69, rotate: 12, ease: 'inOut' },
      { t: 0.79, rotate: -10, ease: 'inOut' },
      { t: 0.88, rotate: 5, ease: 'sine' },
      { t: 0.95, rotate: -2, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    // Loose lips drag across.
    jaw: [
      { t: 0.1, x: 0 },
      { t: 0.25, x: 0.02, ease: 'inOut' },
      { t: 0.39, x: -0.02, ease: 'inOut' },
      { t: 0.51, x: 0.014, ease: 'inOut' },
      { t: 0.62, x: -0.01, ease: 'inOut' },
      { t: 0.72, x: 0.006, ease: 'inOut' },
      { t: 0.82, x: 0, ease: 'sine' },
    ],
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.28, rotate: 20, ease: 'inOut' },
      { t: 0.42, rotate: -16, ease: 'inOut' },
      { t: 0.54, rotate: 14, ease: 'inOut' },
      { t: 0.65, rotate: -10, ease: 'inOut' },
      { t: 0.76, rotate: 7, ease: 'inOut' },
      { t: 0.9, rotate: -3, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    pupils: [
      { t: 0.76, x: 0, y: 0 },
      { t: 1, x: 0, y: 0 },
    ],
  },
};

export default headShake;
