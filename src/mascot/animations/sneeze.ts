import type { CowAnimation } from '../rig/types';

/**
 * Ah... ah... CHOO. Two hitching inhales tip the head further and further back, a held
 * breath, then the whole cow snaps forward and skids back from the recoil. Ends dazed:
 * wonky eyes, a wobble, and a blink back to normal.
 */
const sneeze: CowAnimation = {
  id: 'sneeze',
  name: 'Sneeze',
  category: 'reactions',
  loop: false,
  durationMs: 3000,
  restFrame: 0.5,
  idle: { blink: false, breathe: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'flat', brows: 'worried' },
    { t: 0.1, eyes: 'squint', mouth: 'open' },
    { t: 0.36, eyes: 'closed' },
    { t: 0.455, mouth: 'wavy', brows: 'none' },
    { t: 0.6, eyes: 'wonky' },
    { t: 0.88, eyes: 'closed', mouth: 'flat' },
    { t: 0.92, eyes: 'open' },
    { t: 0.97, mouth: 'smile' },
  ],
  props: [
    { kind: 'dust', from: 0.455, to: 0.66 },
    { kind: 'bubble', text: 'CHOO', from: 0.455, to: 0.64, dx: 0.03 },
  ],
  tracks: {
    head: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.08, rotate: 2, y: 0.004, ease: 'out' }, // nose twitch
      { t: 0.18, rotate: -9, x: -0.008, y: -0.016, ease: 'out' }, // ah
      { t: 0.24, rotate: -6, x: -0.006, y: -0.01, ease: 'inOut' },
      { t: 0.33, rotate: -18, x: -0.018, y: -0.03, ease: 'out' }, // AH
      { t: 0.42, rotate: -21, x: -0.022, y: -0.036, scaleX: 0.97, scaleY: 1.04, ease: 'sine' }, // hanging there
      { t: 0.47, rotate: 26, x: 0.03, y: 0.07, scaleX: 1.1, scaleY: 0.88, ease: 'in' }, // CHOO
      { t: 0.56, rotate: 10, x: 0.008, y: 0.02, scaleX: 1, scaleY: 1, ease: 'outBack' },
      // dazed wobble
      { t: 0.66, rotate: -6, x: -0.006, y: -0.004, ease: 'sine' },
      { t: 0.75, rotate: 5, x: 0.005, y: 0, ease: 'sine' },
      { t: 0.84, rotate: -3, x: -0.002, ease: 'sine' },
      { t: 0.92, rotate: 1, x: 0, ease: 'sine' },
      { t: 1, rotate: 0, y: 0, ease: 'sine' },
    ],
    jaw: [
      { t: 0.08, y: 0 },
      { t: 0.18, y: 0.022, ease: 'out' },
      { t: 0.24, y: 0.014 },
      { t: 0.33, y: 0.04, ease: 'out' },
      { t: 0.43, y: 0.046 },
      { t: 0.47, y: 0, ease: 'in' },
    ],
    // Inflates with each inhale and leans back; the sneeze squashes it and shoves it backwards.
    root: [
      { t: 0, scaleX: 1, scaleY: 1, rotate: 0, x: 0, y: 0 },
      { t: 0.18, scaleX: 0.985, scaleY: 1.03, rotate: -1.5, ease: 'out' },
      { t: 0.24, scaleX: 0.995, scaleY: 1.015, rotate: -1 },
      { t: 0.33, scaleX: 0.965, scaleY: 1.06, rotate: -3.5, ease: 'out' },
      { t: 0.42, scaleX: 0.955, scaleY: 1.075, rotate: -4.5, ease: 'sine' },
      { t: 0.47, scaleX: 1.13, scaleY: 0.84, rotate: 6, x: 0.012, ease: 'in' },
      { t: 0.53, scaleX: 0.97, scaleY: 1.04, rotate: -2, x: -0.05, y: -0.016, ease: 'out' }, // knocked back, feet leave the ground
      { t: 0.59, scaleX: 1.05, scaleY: 0.94, rotate: 0, x: -0.058, y: 0, ease: 'in' },
      { t: 0.68, scaleX: 1, scaleY: 1, x: -0.058, ease: 'outBack' },
      { t: 0.84, x: -0.058, rotate: 0 },
      { t: 1, x: 0, ease: 'inOut' }, // shuffles back to its spot
    ],
    earL: [
      { t: 0.08, rotate: 0 },
      { t: 0.2, rotate: 12, ease: 'out' },
      { t: 0.26, rotate: 6 },
      { t: 0.35, rotate: 24, ease: 'out' },
      { t: 0.44, rotate: 26 },
      { t: 0.49, rotate: 48, ease: 'out' }, // left behind by the snap
      { t: 0.57, rotate: -34, ease: 'inOut' }, // then thrown forward
      { t: 0.66, rotate: 16 },
      { t: 0.75, rotate: -10 },
      { t: 0.84, rotate: 6 },
      { t: 0.92, rotate: -3 },
      { t: 1, rotate: 0 },
    ],
    earR: [
      { t: 0.09, rotate: 0 },
      { t: 0.21, rotate: -12, ease: 'out' },
      { t: 0.27, rotate: -6 },
      { t: 0.36, rotate: -24, ease: 'out' },
      { t: 0.44, rotate: -26 },
      { t: 0.5, rotate: -48, ease: 'out' },
      { t: 0.58, rotate: 34, ease: 'inOut' },
      { t: 0.67, rotate: -16 },
      { t: 0.76, rotate: 10 },
      { t: 0.85, rotate: -6 },
      { t: 0.93, rotate: 3 },
      { t: 1, rotate: 0 },
    ],
    tail: [
      { t: 0.08, rotate: 0 },
      { t: 0.2, rotate: -8, ease: 'out' },
      { t: 0.35, rotate: -18, ease: 'out' },
      { t: 0.44, rotate: -20 },
      { t: 0.51, rotate: 66, ease: 'out' }, // cracks like a whip
      { t: 0.6, rotate: -14, ease: 'inOut' },
      { t: 0.69, rotate: 28 },
      { t: 0.78, rotate: -8 },
      { t: 0.88, rotate: 10 },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    legFL: [
      { t: 0.24, rotate: 0 },
      { t: 0.42, rotate: 6, ease: 'out' },
      { t: 0.48, rotate: -26, ease: 'out' }, // braces against the blast
      { t: 0.6, rotate: -8 },
      { t: 0.7, rotate: 0, ease: 'outBack' },
      { t: 0.86, rotate: 0 },
      { t: 0.93, rotate: -14, ease: 'inOut' }, // step back to its spot
      { t: 1, rotate: 0, ease: 'inOut' },
    ],
    legFR: [
      { t: 0.42, rotate: 0 },
      { t: 0.49, rotate: -16, ease: 'out' },
      { t: 0.66, rotate: 0, ease: 'outBack' },
    ],
    legBL: [
      { t: 0.42, rotate: 0 },
      { t: 0.5, rotate: 22, ease: 'out' },
      { t: 0.62, rotate: 6 },
      { t: 0.72, rotate: 0, ease: 'outBack' },
      { t: 0.84, rotate: 0 },
      { t: 0.91, rotate: 12, ease: 'inOut' },
      { t: 0.98, rotate: 0, ease: 'inOut' },
    ],
    legBR: [
      { t: 0.42, rotate: 0 },
      { t: 0.51, rotate: 13, ease: 'out' },
      { t: 0.68, rotate: 0, ease: 'outBack' },
    ],
    udder: [
      { t: 0.44, scaleY: 1 },
      { t: 0.52, scaleY: 1.22, ease: 'out' },
      { t: 0.72, scaleY: 1, ease: 'outElastic' },
    ],
  },
};

export default sneeze;
