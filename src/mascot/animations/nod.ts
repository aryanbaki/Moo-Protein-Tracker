import type { CowAnimation } from '../rig/types';

/**
 * "Yes!": the chin lifts, then two firm nods (the second a little smaller). The body dips
 * with each one, the ears whip up as the head drops and slap down after it stops.
 */
const nod: CowAnimation = {
  id: 'nod',
  name: 'Nod',
  category: 'reactions',
  loop: false,
  durationMs: 1700,
  restFrame: 0.3,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'smile', brows: 'raised' },
    { t: 0.22, eyes: 'happy', brows: 'none' },
    { t: 0.86, eyes: 'open' },
  ],
  tracks: {
    head: [
      { t: 0, rotate: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.13, rotate: -7, y: -0.016, scaleY: 1.03, scaleX: 0.985, ease: 'out' }, // chin up
      { t: 0.28, rotate: 15, y: 0.034, scaleY: 0.95, scaleX: 1.03, ease: 'in' }, // nod 1
      { t: 0.34, rotate: 13, y: 0.03, scaleY: 1, scaleX: 1, ease: 'out' },
      { t: 0.48, rotate: -5, y: -0.012, scaleY: 1.02, scaleX: 0.99, ease: 'inOut' },
      { t: 0.62, rotate: 12, y: 0.027, scaleY: 0.96, scaleX: 1.025, ease: 'in' }, // nod 2
      { t: 0.68, rotate: 10.5, y: 0.024, scaleY: 1, scaleX: 1, ease: 'out' },
      { t: 0.86, rotate: -2, y: -0.004, ease: 'inOut' },
      { t: 1, rotate: 0, y: 0, ease: 'sine' },
    ],
    root: [
      { t: 0, scaleX: 1, scaleY: 1 },
      { t: 0.13, scaleX: 0.99, scaleY: 1.02, ease: 'out' },
      { t: 0.3, scaleX: 1.03, scaleY: 0.955, ease: 'in' },
      { t: 0.48, scaleX: 0.99, scaleY: 1.015, ease: 'inOut' },
      { t: 0.64, scaleX: 1.025, scaleY: 0.965, ease: 'in' },
      { t: 0.84, scaleX: 0.996, scaleY: 1.006, ease: 'inOut' },
      { t: 1, scaleX: 1, scaleY: 1, ease: 'sine' },
    ],
    earL: [
      { t: 0.04, rotate: 0 },
      { t: 0.16, rotate: -12, ease: 'out' }, // lag the lift
      { t: 0.27, rotate: 26, ease: 'inOut' }, // left behind as the head drops
      { t: 0.37, rotate: -24, ease: 'inOut' }, // slap down after the stop
      { t: 0.5, rotate: -8 },
      { t: 0.61, rotate: 22, ease: 'inOut' },
      { t: 0.71, rotate: -20, ease: 'inOut' },
      { t: 0.82, rotate: 9 },
      { t: 0.92, rotate: -4 },
      { t: 1, rotate: 0 },
    ],
    earR: [
      { t: 0.05, rotate: 0 },
      { t: 0.17, rotate: 12, ease: 'out' },
      { t: 0.28, rotate: -26, ease: 'inOut' },
      { t: 0.38, rotate: 24, ease: 'inOut' },
      { t: 0.51, rotate: 8 },
      { t: 0.62, rotate: -22, ease: 'inOut' },
      { t: 0.72, rotate: 20, ease: 'inOut' },
      { t: 0.83, rotate: -9 },
      { t: 0.93, rotate: 4 },
      { t: 1, rotate: 0 },
    ],
    legFL: [
      { t: 0.13, rotate: 0 },
      { t: 0.3, rotate: -5, ease: 'in' },
      { t: 0.48, rotate: 0 },
      { t: 0.64, rotate: -4, ease: 'in' },
      { t: 0.84, rotate: 0 },
    ],
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.24, rotate: -8, ease: 'out' },
      { t: 0.38, rotate: 28, ease: 'out' },
      { t: 0.54, rotate: 2, ease: 'sine' },
      { t: 0.72, rotate: 24, ease: 'out' },
      { t: 0.88, rotate: -4, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    udder: [
      { t: 0.28, scaleY: 1 },
      { t: 0.34, scaleY: 1.12, ease: 'out' },
      { t: 0.5, scaleY: 0.97 },
      { t: 0.68, scaleY: 1.1, ease: 'out' },
      { t: 0.9, scaleY: 1, ease: 'outBack' },
    ],
  },
};

export default nod;
