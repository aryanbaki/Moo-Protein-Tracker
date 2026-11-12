import type { CowAnimation } from '../rig/types';

/**
 * Yum: the tongue pops out and sweeps across the lips while the head rolls the other way
 * to meet it, then back again, and a happy little wiggle to finish.
 */
const lickLips: CowAnimation = {
  id: 'lickLips',
  name: 'Lick lips',
  category: 'eating',
  loop: false,
  durationMs: 2000,
  restFrame: 0.34,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'smile', brows: 'none' },
    { t: 0.12, eyes: 'happy', mouth: 'tongue' },
    { t: 0.7, mouth: 'smile' },
    { t: 0.92, eyes: 'open' },
  ],
  props: [{ kind: 'hearts', from: 0.62, to: 0.98 }],
  tracks: {
    // The mouth (and with it the tongue) rides the jaw: out one side, across, tuck away.
    jaw: [
      { t: 0.06, x: 0, y: 0 },
      { t: 0.12, x: -0.03, y: 0.004, ease: 'in' },
      { t: 0.2, x: -0.05, y: 0.012, ease: 'out' },
      { t: 0.4, x: 0.05, y: 0.016, ease: 'inOut' }, // the long sweep
      { t: 0.46, x: 0.05, y: 0.008 },
      { t: 0.62, x: -0.036, y: 0.012, ease: 'inOut' }, // and back
      { t: 0.7, x: 0, y: 0, ease: 'in' },
      { t: 0.76, x: 0, y: 0.01, ease: 'out' }, // lip smack
      { t: 0.84, x: 0, y: 0 },
    ],
    head: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.1, rotate: -3, y: -0.006, ease: 'out' },
      { t: 0.2, rotate: -8, x: -0.006, y: -0.006, ease: 'out' },
      { t: 0.42, rotate: 9, x: 0.008, y: -0.01, ease: 'inOut' }, // rolls with the lick
      { t: 0.48, rotate: 9.5, x: 0.008, y: -0.01 },
      { t: 0.64, rotate: -6, x: -0.005, y: -0.004, ease: 'inOut' },
      { t: 0.72, rotate: 0, x: 0, y: 0.006, scaleX: 1.04, scaleY: 0.96, ease: 'in' }, // smack
      { t: 0.84, rotate: 0, y: -0.004, scaleX: 1, scaleY: 1, ease: 'outBack' },
      { t: 1, rotate: 0, y: 0, ease: 'sine' },
    ],
    root: [
      { t: 0, scaleX: 1, scaleY: 1, rotate: 0 },
      { t: 0.1, scaleX: 1.015, scaleY: 0.98, ease: 'out' },
      { t: 0.24, scaleX: 0.985, scaleY: 1.025, rotate: -1.2, ease: 'out' },
      { t: 0.44, rotate: 1.4, ease: 'inOut' },
      { t: 0.66, scaleX: 0.99, scaleY: 1.015, rotate: -0.8, ease: 'inOut' },
      { t: 0.74, scaleX: 1.035, scaleY: 0.955, rotate: 0, ease: 'in' },
      { t: 0.86, scaleX: 0.99, scaleY: 1.015, ease: 'out' },
      { t: 1, scaleX: 1, scaleY: 1, ease: 'sine' },
    ],
    earL: [
      { t: 0.1, rotate: 0 },
      { t: 0.26, rotate: 14, ease: 'out' },
      { t: 0.48, rotate: -18, ease: 'inOut' },
      { t: 0.7, rotate: 12, ease: 'inOut' },
      { t: 0.78, rotate: -14, ease: 'out' },
      { t: 0.88, rotate: 5 },
      { t: 0.96, rotate: 0 },
    ],
    earR: [
      { t: 0.12, rotate: 0 },
      { t: 0.28, rotate: 12, ease: 'out' },
      { t: 0.5, rotate: -16, ease: 'inOut' },
      { t: 0.72, rotate: 10, ease: 'inOut' },
      { t: 0.8, rotate: 14, ease: 'out' },
      { t: 0.9, rotate: -5 },
      { t: 0.98, rotate: 0 },
    ],
    // Excited wag that speeds up, then winds down.
    tail: [
      { t: 0, rotate: 0 },
      { t: 0.16, rotate: 24, ease: 'sine' },
      { t: 0.3, rotate: -8, ease: 'sine' },
      { t: 0.42, rotate: 30, ease: 'sine' },
      { t: 0.52, rotate: -8, ease: 'sine' },
      { t: 0.62, rotate: 32, ease: 'sine' },
      { t: 0.72, rotate: -6, ease: 'sine' },
      { t: 0.84, rotate: 18, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
  },
};

export default lickLips;
