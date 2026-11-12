import type { CowAnimation } from '../rig/types';

/**
 * "Oh, come on.": a flat stare, a sigh, then the front hoof swings up as the head drops
 * to meet it with a thud. A tiny defeated shake against the hoof, hold, and let go.
 * (`armL` drives a real arm when the skin has one, otherwise the near front leg.)
 */
const facepalm: CowAnimation = {
  id: 'facepalm',
  name: 'Facepalm',
  category: 'reactions',
  loop: false,
  durationMs: 2800,
  restFrame: 0.5,
  idle: { blink: false, breathe: false },
  expressions: [
    { t: 0, eyes: 'squint', mouth: 'flat', brows: 'none' },
    { t: 0.24, eyes: 'closed', mouth: 'wavy', brows: 'worried' },
    { t: 0.86, eyes: 'squint', mouth: 'flat', brows: 'none' },
    { t: 0.97, eyes: 'open', mouth: 'smile' },
  ],
  tracks: {
    armL: [
      { t: 0.1, rotate: 0, y: 0 },
      { t: 0.18, rotate: 12, ease: 'out' }, // swings back first
      { t: 0.33, rotate: -168, y: -0.01, ease: 'out' }, // up to the face
      { t: 0.38, rotate: -150, ease: 'inOut' }, // gives under the weight of the head
      { t: 0.44, rotate: -156 },
      { t: 0.76, rotate: -154 },
      { t: 0.92, rotate: 8, y: 0, ease: 'inOut' },
      { t: 1, rotate: 0, ease: 'out' },
    ],
    head: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.14, rotate: -5, y: -0.012, ease: 'inOut' }, // looks to the sky
      { t: 0.24, rotate: -6, y: -0.014 },
      { t: 0.34, rotate: 22, x: 0.012, y: 0.07, scaleX: 1.06, scaleY: 0.93, ease: 'in' }, // drops into the hoof
      { t: 0.4, rotate: 19, x: 0.01, y: 0.062, scaleX: 1, scaleY: 1, ease: 'out' },
      // a tiny, slow shake
      { t: 0.48, rotate: 16, x: 0.002 },
      { t: 0.55, rotate: 22, x: 0.018 },
      { t: 0.62, rotate: 17, x: 0.004 },
      { t: 0.68, rotate: 20.5, x: 0.014 },
      { t: 0.76, rotate: 19, x: 0.01, y: 0.064 },
      { t: 0.92, rotate: -2, x: 0, y: -0.004, ease: 'inOut' },
      { t: 1, rotate: 0, y: 0, ease: 'sine' },
    ],
    root: [
      { t: 0, scaleX: 1, scaleY: 1, rotate: 0 },
      { t: 0.14, scaleX: 0.98, scaleY: 1.035, ease: 'inOut' }, // deep breath in
      { t: 0.24, scaleX: 0.98, scaleY: 1.035 },
      { t: 0.36, scaleX: 1.06, scaleY: 0.91, rotate: 2.5, ease: 'in' }, // slumps
      { t: 0.44, scaleX: 1.04, scaleY: 0.94, rotate: 2, ease: 'out' },
      { t: 0.76, scaleX: 1.045, scaleY: 0.935, rotate: 2, ease: 'sine' },
      { t: 0.92, scaleX: 0.995, scaleY: 1.01, rotate: 0, ease: 'inOut' },
      { t: 1, scaleX: 1, scaleY: 1, ease: 'sine' },
    ],
    earL: [
      { t: 0.14, rotate: 0 },
      { t: 0.3, rotate: 26, ease: 'out' }, // left in the air as the head falls
      { t: 0.42, rotate: -30, ease: 'inOut' }, // flop
      { t: 0.5, rotate: -20 },
      { t: 0.57, rotate: -27 },
      { t: 0.64, rotate: -21 },
      { t: 0.76, rotate: -24 },
      { t: 0.9, rotate: 10, ease: 'inOut' },
      { t: 1, rotate: 0 },
    ],
    earR: [
      { t: 0.15, rotate: 0 },
      { t: 0.31, rotate: -26, ease: 'out' },
      { t: 0.43, rotate: 30, ease: 'inOut' },
      { t: 0.51, rotate: 20 },
      { t: 0.58, rotate: 27 },
      { t: 0.65, rotate: 21 },
      { t: 0.77, rotate: 24 },
      { t: 0.91, rotate: -10, ease: 'inOut' },
      { t: 1, rotate: 0 },
    ],
    tail: [
      { t: 0.14, rotate: 0 },
      { t: 0.3, rotate: 16, ease: 'out' },
      { t: 0.46, rotate: -18, ease: 'inOut' }, // hangs limp
      { t: 0.76, rotate: -16 },
      { t: 0.92, rotate: 8, ease: 'inOut' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    legBL: [
      { t: 0.24, rotate: 0 },
      { t: 0.38, rotate: 5, ease: 'in' },
      { t: 0.76, rotate: 5 },
      { t: 0.92, rotate: 0 },
    ],
  },
};

export default facepalm;
