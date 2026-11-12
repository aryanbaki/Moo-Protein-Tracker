import type { CowAnimation } from '../rig/types';

/**
 * Grazing: a look at the ground, the front end dips and the head goes down for a bite, a
 * tug rips the grass free, and the cow comes up chewing sideways with it in its mouth.
 */
const munchGrass: CowAnimation = {
  id: 'munchGrass',
  name: 'Munch grass',
  category: 'eating',
  loop: false,
  durationMs: 3400,
  restFrame: 0.62,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'smile', brows: 'none' },
    { t: 0.16, mouth: 'open' },
    { t: 0.29, eyes: 'squint', mouth: 'none' },
    { t: 0.46, eyes: 'happy' },
    { t: 0.93, mouth: 'smile' },
    { t: 0.95, eyes: 'open' },
  ],
  props: [{ kind: 'grass', from: 0.29, to: 0.93 }],
  tracks: {
    head: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.09, rotate: -5, y: -0.012, ease: 'out' }, // lifts first
      { t: 0.27, rotate: 24, x: 0.02, y: 0.118, ease: 'inOut' }, // down to the grass
      { t: 0.3, rotate: 25, x: 0.02, y: 0.126, scaleX: 1.06, scaleY: 0.93, ease: 'out' }, // chomp
      { t: 0.36, rotate: 22, x: 0.014, y: 0.114, scaleX: 0.98, scaleY: 1.04, ease: 'inOut' }, // tug
      { t: 0.39, rotate: 25, x: 0.02, y: 0.122, scaleX: 1, scaleY: 1 },
      { t: 0.58, rotate: -7, x: 0, y: -0.012, ease: 'outBack' }, // rips free, swings up
      { t: 0.7, rotate: -3, y: -0.004, ease: 'sine' },
      { t: 0.84, rotate: 2, y: 0.002, ease: 'sine' },
      { t: 1, rotate: 0, y: 0, ease: 'sine' },
    ],
    // Bite, then sideways chewing (down on every beat, side to side every two).
    jaw: [
      { t: 0.14, y: 0, x: 0 },
      { t: 0.25, y: 0.03, ease: 'out' },
      { t: 0.3, y: 0, ease: 'in' },
      { t: 0.46, y: 0.004, x: 0 },
      { t: 0.51, y: 0.028, x: -0.012, ease: 'sine' },
      { t: 0.56, y: 0.004, x: 0, ease: 'sine' },
      { t: 0.61, y: 0.028, x: 0.012, ease: 'sine' },
      { t: 0.66, y: 0.004, x: 0, ease: 'sine' },
      { t: 0.71, y: 0.028, x: -0.012, ease: 'sine' },
      { t: 0.76, y: 0.004, x: 0, ease: 'sine' },
      { t: 0.81, y: 0.026, x: 0.012, ease: 'sine' },
      { t: 0.86, y: 0.004, x: 0, ease: 'sine' },
      { t: 0.9, y: 0.016, x: -0.006, ease: 'sine' },
      { t: 0.94, y: 0, x: 0, ease: 'sine' },
    ],
    root: [
      { t: 0, rotate: 0, scaleX: 1, scaleY: 1 },
      { t: 0.09, rotate: -1, scaleY: 1.015, scaleX: 0.99, ease: 'out' },
      { t: 0.28, rotate: 6, scaleY: 0.955, scaleX: 1.03, ease: 'inOut' }, // bows forward
      { t: 0.39, rotate: 6.5, scaleY: 0.95, scaleX: 1.03 },
      { t: 0.56, rotate: -1.5, scaleY: 1.03, scaleX: 0.985, ease: 'outBack' },
      { t: 0.72, rotate: 0, scaleY: 1, scaleX: 1, ease: 'sine' },
    ],
    legFL: [
      { t: 0.09, rotate: 0 },
      { t: 0.28, rotate: -9, ease: 'inOut' }, // braces
      { t: 0.39, rotate: -9 },
      { t: 0.56, rotate: 2, ease: 'out' },
      { t: 0.68, rotate: 0 },
    ],
    legFR: [
      { t: 0.1, rotate: 0 },
      { t: 0.29, rotate: -6, ease: 'inOut' },
      { t: 0.4, rotate: -6 },
      { t: 0.58, rotate: 0, ease: 'out' },
    ],
    legBL: [
      { t: 0.1, rotate: 0 },
      { t: 0.29, rotate: -5, ease: 'inOut' },
      { t: 0.4, rotate: -5 },
      { t: 0.58, rotate: 0, ease: 'out' },
    ],
    legBR: [
      { t: 0.1, rotate: 0 },
      { t: 0.29, rotate: -4, ease: 'inOut' },
      { t: 0.4, rotate: -4 },
      { t: 0.58, rotate: 0, ease: 'out' },
    ],
    // Ears fly up as the head drops, flop forward at the bottom, whip back on the way up.
    earL: [
      { t: 0.09, rotate: 0 },
      { t: 0.22, rotate: 22, ease: 'out' },
      { t: 0.34, rotate: -16, ease: 'inOut' },
      { t: 0.4, rotate: -12 },
      { t: 0.52, rotate: -30, ease: 'out' },
      { t: 0.64, rotate: 12, ease: 'inOut' },
      { t: 0.72, rotate: -4 },
      { t: 0.8, rotate: 3 },
      { t: 0.9, rotate: 0 },
    ],
    earR: [
      { t: 0.1, rotate: 0 },
      { t: 0.23, rotate: -22, ease: 'out' },
      { t: 0.35, rotate: 16, ease: 'inOut' },
      { t: 0.41, rotate: 12 },
      { t: 0.53, rotate: 30, ease: 'out' },
      { t: 0.65, rotate: -12, ease: 'inOut' },
      { t: 0.73, rotate: 4 },
      { t: 0.81, rotate: -3 },
      { t: 0.91, rotate: 0 },
    ],
    // The back end tips up, so the tail lifts, then wags while chewing.
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.32, rotate: 32, ease: 'inOut' },
      { t: 0.42, rotate: 26 },
      { t: 0.6, rotate: -12, ease: 'inOut' },
      { t: 0.7, rotate: 16, ease: 'sine' },
      { t: 0.8, rotate: -8, ease: 'sine' },
      { t: 0.9, rotate: 10, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
  },
};

export default munchGrass;
