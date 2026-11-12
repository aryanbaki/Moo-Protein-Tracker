import type { CowAnimation } from '../rig/types';

/**
 * Something smells good: the nose stretches out and up, two quick sniffs (the muzzle
 * pulls in, the whole cow gives a tiny inhale pop), a pleased pause, then settle.
 */
const sniff: CowAnimation = {
  id: 'sniff',
  name: 'Sniff',
  category: 'alive',
  loop: false,
  durationMs: 2200,
  restFrame: 0.4,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'smile', brows: 'none' },
    { t: 0.1, mouth: 'flat', brows: 'raised' },
    { t: 0.62, eyes: 'happy', brows: 'none', mouth: 'smile' },
    { t: 0.9, eyes: 'open' },
  ],
  tracks: {
    head: [
      { t: 0, rotate: 0, x: 0, y: 0, scale: 1 },
      { t: 0.08, rotate: 3, x: -0.006, y: 0.008, scale: 0.98, ease: 'out' }, // pull back
      { t: 0.24, rotate: -10, x: 0.024, y: -0.03, scale: 1.05, ease: 'outBack' }, // nose out and up
      { t: 0.31, rotate: -10, x: 0.024, y: -0.03, scale: 1.05 },
      { t: 0.35, rotate: -14, x: 0.028, y: -0.042, scale: 1.07, ease: 'out' }, // sniff 1
      { t: 0.42, rotate: -9.5, x: 0.023, y: -0.028, scale: 1.045, ease: 'inOut' },
      { t: 0.46, rotate: -15, x: 0.03, y: -0.046, scale: 1.08, ease: 'out' }, // sniff 2
      { t: 0.55, rotate: -10, x: 0.024, y: -0.03, scale: 1.05, ease: 'inOut' },
      { t: 0.74, rotate: -11, x: 0.024, y: -0.032, scale: 1.05, ease: 'sine' }, // savour
      { t: 0.92, rotate: 1.5, x: -0.002, y: 0.004, scale: 0.995, ease: 'inOut' },
      { t: 1, rotate: 0, x: 0, y: 0, scale: 1, ease: 'out' },
    ],
    // The muzzle scrunches up on each sniff (negative jaw y lifts muzzle and mouth).
    jaw: [
      { t: 0.31, y: 0 },
      { t: 0.35, y: -0.03, ease: 'out' },
      { t: 0.42, y: 0.008 },
      { t: 0.46, y: -0.034, ease: 'out' },
      { t: 0.55, y: 0.006 },
      { t: 0.62, y: 0 },
    ],
    root: [
      { t: 0, scaleY: 1, scaleX: 1, rotate: 0 },
      { t: 0.08, scaleY: 0.975, scaleX: 1.015, ease: 'out' },
      { t: 0.24, scaleY: 1.02, scaleX: 0.99, rotate: 1.5, ease: 'outBack' }, // leans toward the smell
      { t: 0.31, scaleY: 1.02, scaleX: 0.99 },
      { t: 0.35, scaleY: 1.045, scaleX: 0.975, ease: 'out' },
      { t: 0.42, scaleY: 1.015, scaleX: 0.995 },
      { t: 0.46, scaleY: 1.05, scaleX: 0.972, ease: 'out' },
      { t: 0.56, scaleY: 1.02, scaleX: 0.99 },
      { t: 0.74, scaleY: 1.02, scaleX: 0.99, rotate: 1.5 },
      { t: 0.92, scaleY: 0.985, scaleX: 1.008, rotate: 0, ease: 'inOut' },
      { t: 1, scaleY: 1, scaleX: 1, ease: 'out' },
    ],
    pupils: [
      { t: 0.08, x: 0, y: 0 },
      { t: 0.2, x: 0.006, y: -0.01, ease: 'out' },
      { t: 0.6, x: 0.006, y: -0.01 },
      { t: 0.9, x: 0, y: 0, ease: 'hold' },
    ],
    earL: [
      { t: 0.08, rotate: 0 },
      { t: 0.2, rotate: 16, ease: 'out' }, // trail the push
      { t: 0.3, rotate: -14, ease: 'inOut' }, // then prick up
      { t: 0.37, rotate: -22, ease: 'out' },
      { t: 0.43, rotate: -12 },
      { t: 0.48, rotate: -24, ease: 'out' },
      { t: 0.58, rotate: -12 },
      { t: 0.76, rotate: -12 },
      { t: 0.9, rotate: 8, ease: 'inOut' },
      { t: 1, rotate: 0, ease: 'outBack' },
    ],
    earR: [
      { t: 0.09, rotate: 0 },
      { t: 0.21, rotate: -16, ease: 'out' },
      { t: 0.31, rotate: 14, ease: 'inOut' },
      { t: 0.38, rotate: 22, ease: 'out' },
      { t: 0.44, rotate: 12 },
      { t: 0.49, rotate: 24, ease: 'out' },
      { t: 0.59, rotate: 12 },
      { t: 0.77, rotate: 12 },
      { t: 0.91, rotate: -8, ease: 'inOut' },
      { t: 1, rotate: 0, ease: 'outBack' },
    ],
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.3, rotate: 26, ease: 'out' },
      { t: 0.4, rotate: 18 },
      { t: 0.5, rotate: 30, ease: 'out' },
      { t: 0.62, rotate: 20 },
      { t: 0.7, rotate: 34, ease: 'sine' }, // happy wag
      { t: 0.78, rotate: 12, ease: 'sine' },
      { t: 0.86, rotate: 26, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    legFL: [
      { t: 0.08, rotate: 0 },
      { t: 0.24, rotate: 4, ease: 'out' },
      { t: 0.74, rotate: 4 },
      { t: 0.92, rotate: 0 },
    ],
  },
};

export default sniff;
