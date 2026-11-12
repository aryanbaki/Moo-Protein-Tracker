import type { CowAnimation } from '../rig/types';

/**
 * A crown falls out of the sky: the cow looks up, takes the hit (head squashes, ears
 * flap, knees give), springs back, and stands proud with it on. Holds its last frame.
 */
const crownDrop: CowAnimation = {
  id: 'crownDrop',
  name: 'Crown drop',
  category: 'wins',
  loop: false,
  durationMs: 2200,
  restFrame: 1,
  expressions: [
    { t: 0, brows: 'raised' },
    { t: 0.17, eyes: 'closed', brows: 'none', mouth: 'flat' },
    { t: 0.36, eyes: 'happy', mouth: 'open' },
    { t: 0.8, eyes: 'open', mouth: 'smile' },
  ],
  props: [
    { kind: 'crown', from: 0.06, to: 1 },
    { kind: 'sparkle', from: 0.3, to: 1, repeat: 3, dy: -0.07, scale: 1.1 },
  ],
  tracks: {
    head: [
      { t: 0, rotate: 0, y: 0, scaleY: 1, scaleX: 1 },
      { t: 0.1, rotate: -8, y: -0.006, ease: 'out' }, // looks up
      { t: 0.145, rotate: -8, y: -0.006, scaleY: 1, scaleX: 1 },
      { t: 0.19, rotate: 5, y: 0.026, scaleY: 0.86, scaleX: 1.08, ease: 'out' }, // bonk
      { t: 0.42, rotate: -4, y: 0, scaleY: 1, scaleX: 1, ease: 'outElastic' },
      { t: 0.7, rotate: -5, y: -0.004 },
      { t: 1, rotate: -3, y: 0 },
    ],
    pupils: [
      { t: 0, y: 0 },
      { t: 0.09, y: -0.011, ease: 'out' },
      { t: 0.8, y: 0, ease: 'hold' },
    ],
    root: [
      { t: 0.145, scaleY: 1, scaleX: 1, y: 0 },
      { t: 0.2, scaleY: 0.92, scaleX: 1.05, ease: 'out' },
      { t: 0.3, scaleY: 1.04, scaleX: 0.98, y: -0.014, ease: 'out' },
      { t: 0.4, scaleY: 0.98, scaleX: 1.01, y: 0, ease: 'in' },
      { t: 0.5, scaleY: 1, scaleX: 1, ease: 'out' },
    ],
    earL: [
      { t: 0.145, rotate: 0 },
      { t: 0.2, rotate: 30, ease: 'out' }, // flung up by the hit
      { t: 0.3, rotate: -22 },
      { t: 0.42, rotate: 12 },
      { t: 0.56, rotate: -5 },
      { t: 0.7, rotate: 0 },
    ],
    earR: [
      { t: 0.145, rotate: 0 },
      { t: 0.2, rotate: -30, ease: 'out' },
      { t: 0.3, rotate: 22 },
      { t: 0.42, rotate: -12 },
      { t: 0.56, rotate: 5 },
      { t: 0.7, rotate: 0 },
    ],
    legFL: [
      { t: 0.145, rotate: 0 },
      { t: 0.21, rotate: -7, ease: 'out' },
      { t: 0.36, rotate: 0, ease: 'outBack' },
    ],
    legBL: [
      { t: 0.145, rotate: 0 },
      { t: 0.21, rotate: 7, ease: 'out' },
      { t: 0.36, rotate: 0, ease: 'outBack' },
    ],
    tail: [
      { t: 0.145, rotate: 0 },
      { t: 0.22, rotate: 34, ease: 'out' },
      { t: 0.4, rotate: -6 },
      { t: 0.5, rotate: 22 },
      { t: 0.6, rotate: -4 },
      { t: 0.7, rotate: 20 },
      { t: 0.8, rotate: -2 },
      { t: 0.9, rotate: 12 },
      { t: 1, rotate: 4 },
    ],
  },
};

export default crownDrop;
