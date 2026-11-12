import type { CowAnimation } from '../rig/types';

/**
 * A long, slow yawn: droop, a deep breath while the head tips back and the mouth gapes,
 * a little stretch at the top (shiver in the ears and tail), then it all sags out and a
 * sleepy blink brings the cow back.
 */
const yawn: CowAnimation = {
  id: 'yawn',
  name: 'Yawn',
  category: 'alive',
  loop: false,
  durationMs: 3400,
  restFrame: 0.48,
  idle: { blink: false, breathe: false },
  expressions: [
    { t: 0, eyes: 'squint', mouth: 'flat', brows: 'none' },
    { t: 0.16, eyes: 'closed', mouth: 'open' },
    { t: 0.7, mouth: 'wavy' },
    { t: 0.8, eyes: 'squint', mouth: 'smile' },
    { t: 0.86, eyes: 'closed' },
    { t: 0.9, eyes: 'open' },
  ],
  tracks: {
    head: [
      { t: 0, rotate: 0, y: 0, x: 0, scaleX: 1, scaleY: 1 },
      { t: 0.14, rotate: 5, y: 0.012, ease: 'inOut' }, // heavy droop
      { t: 0.42, rotate: -15, y: -0.024, x: -0.012, scaleX: 0.97, scaleY: 1.05, ease: 'inOut' }, // tips back
      { t: 0.52, rotate: -18, y: -0.03, x: -0.014, scaleX: 0.96, scaleY: 1.07, ease: 'out' }, // peak stretch
      { t: 0.62, rotate: -16, y: -0.026, x: -0.012, scaleX: 0.97, scaleY: 1.05, ease: 'sine' },
      { t: 0.8, rotate: 5, y: 0.012, x: 0, scaleX: 1.02, scaleY: 0.975, ease: 'inOut' }, // sags
      { t: 0.92, rotate: -1, y: -0.002, scaleX: 1, scaleY: 1, ease: 'out' },
      { t: 1, rotate: 0, y: 0, ease: 'sine' },
    ],
    jaw: [
      { t: 0.14, y: 0 },
      { t: 0.2, y: 0.012, ease: 'out' },
      { t: 0.5, y: 0.05, ease: 'inOut' }, // wide
      { t: 0.62, y: 0.046 },
      { t: 0.72, y: 0.006, ease: 'in' },
      { t: 0.8, y: 0, ease: 'out' },
    ],
    root: [
      { t: 0, scaleX: 1, scaleY: 1, y: 0, rotate: 0 },
      { t: 0.14, scaleX: 1.025, scaleY: 0.965, ease: 'inOut' },
      { t: 0.5, scaleX: 0.96, scaleY: 1.07, rotate: -2.5, ease: 'inOut' }, // big inhale, rises
      { t: 0.62, scaleX: 0.965, scaleY: 1.06, rotate: -2.5 },
      { t: 0.8, scaleX: 1.045, scaleY: 0.945, rotate: 0, ease: 'inOut' }, // sighs out
      { t: 0.94, scaleX: 0.995, scaleY: 1.008, ease: 'out' },
      { t: 1, scaleX: 1, scaleY: 1, ease: 'sine' },
    ],
    // Front legs brace forward, back legs push back: a cat-style stretch.
    legFL: [
      { t: 0.2, rotate: 0 },
      { t: 0.5, rotate: -13, ease: 'inOut' },
      { t: 0.64, rotate: -12 },
      { t: 0.84, rotate: 2, ease: 'inOut' },
      { t: 0.94, rotate: 0 },
    ],
    legFR: [
      { t: 0.22, rotate: 0 },
      { t: 0.52, rotate: -8, ease: 'inOut' },
      { t: 0.64, rotate: -8 },
      { t: 0.86, rotate: 0, ease: 'inOut' },
    ],
    legBL: [
      { t: 0.24, rotate: 0 },
      { t: 0.54, rotate: 11, ease: 'inOut' },
      { t: 0.66, rotate: 10 },
      { t: 0.86, rotate: -2, ease: 'inOut' },
      { t: 0.96, rotate: 0 },
    ],
    legBR: [
      { t: 0.26, rotate: 0 },
      { t: 0.56, rotate: 7, ease: 'inOut' },
      { t: 0.66, rotate: 7 },
      { t: 0.88, rotate: 0, ease: 'inOut' },
    ],
    earL: [
      { t: 0, rotate: 0 },
      { t: 0.16, rotate: -8, ease: 'inOut' },
      { t: 0.44, rotate: 22, ease: 'inOut' }, // laid back
      { t: 0.5, rotate: 27 },
      { t: 0.54, rotate: 20 }, // stretch shiver
      { t: 0.58, rotate: 27 },
      { t: 0.62, rotate: 21 },
      { t: 0.84, rotate: -14, ease: 'inOut' }, // flop
      { t: 0.94, rotate: 4 },
      { t: 1, rotate: 0 },
    ],
    earR: [
      { t: 0, rotate: 0 },
      { t: 0.17, rotate: 8, ease: 'inOut' },
      { t: 0.45, rotate: -22, ease: 'inOut' },
      { t: 0.51, rotate: -27 },
      { t: 0.55, rotate: -20 },
      { t: 0.59, rotate: -27 },
      { t: 0.63, rotate: -21 },
      { t: 0.85, rotate: 14, ease: 'inOut' },
      { t: 0.95, rotate: -4 },
      { t: 1, rotate: 0 },
    ],
    tail: [
      { t: 0.1, rotate: 0 },
      { t: 0.2, rotate: -8, ease: 'inOut' },
      { t: 0.5, rotate: 44, ease: 'inOut' }, // stretches straight out
      { t: 0.54, rotate: 38 },
      { t: 0.58, rotate: 46 },
      { t: 0.62, rotate: 40 },
      { t: 0.84, rotate: -12, ease: 'inOut' },
      { t: 0.94, rotate: 5, ease: 'sine' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    eyes: [
      { t: 0.84, scaleY: 1 },
      { t: 0.86, scaleY: 0.7 },
      { t: 0.92, scaleY: 1, ease: 'out' },
    ],
  },
};

export default yawn;
