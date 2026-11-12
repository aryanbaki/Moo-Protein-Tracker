import type { CowAnimation } from '../rig/types';

/** A deliberate double blink with a little nod; the ears follow a beat late. */
const blink: CowAnimation = {
  id: 'blink',
  name: 'Blink',
  category: 'alive',
  loop: false,
  durationMs: 1100,
  restFrame: 0,
  idle: { blink: false },
  tracks: {
    eyes: [
      { t: 0, scaleY: 1 },
      { t: 0.1, scaleY: 1 },
      { t: 0.18, scaleY: 0.08, ease: 'in' },
      { t: 0.3, scaleY: 1, ease: 'out' },
      { t: 0.46, scaleY: 1 },
      { t: 0.53, scaleY: 0.08, ease: 'in' },
      { t: 0.7, scaleY: 1.06, ease: 'out' },
      { t: 0.82, scaleY: 1 },
    ],
    head: [
      { t: 0, y: 0, rotate: 0 },
      { t: 0.2, y: 0.006, rotate: 1.5, ease: 'out' },
      { t: 0.36, y: 0, rotate: 0 },
      { t: 0.55, y: 0.006, rotate: 1.5, ease: 'out' },
      { t: 0.85, y: 0, rotate: 0, ease: 'outBack' },
    ],
    brows: [
      { t: 0, y: 0 },
      { t: 0.18, y: 0.006 },
      { t: 0.7, y: -0.006, ease: 'out' },
      { t: 1, y: 0 },
    ],
    earL: [
      { t: 0.2, rotate: 0 },
      { t: 0.32, rotate: -7, ease: 'out' },
      { t: 0.62, rotate: 6 },
      { t: 0.95, rotate: 0, ease: 'outBack' },
    ],
    earR: [
      { t: 0.24, rotate: 0 },
      { t: 0.36, rotate: 7, ease: 'out' },
      { t: 0.66, rotate: -6 },
      { t: 1, rotate: 0, ease: 'outBack' },
    ],
  },
};

export default blink;
