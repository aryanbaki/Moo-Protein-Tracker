import type { CowAnimation } from '../rig/types';
import { sway } from './_helpers';

/**
 * Startled: crouch, spring off the ground with legs splayed, land in a squash, then
 * stand frozen and trembling. Starts and ends in the same frozen pose so it can loop.
 */
const shockedJump: CowAnimation = {
  id: 'shockedJump',
  name: 'Shocked jump',
  category: 'reactions',
  loop: false,
  durationMs: 2000,
  restFrame: 0.7,
  expressions: [{ t: 0, eyes: 'wide', mouth: 'none', brows: 'raised' }],
  props: [
    { kind: 'shock', from: 0.05, to: 0.9 },
    { kind: 'dust', from: 0.4, to: 0.62 },
  ],
  tracks: {
    root: [
      { t: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.07, y: 0, scaleX: 1.07, scaleY: 0.88, ease: 'out' }, // crouch
      { t: 0.14, y: -0.03, scaleX: 0.92, scaleY: 1.13, ease: 'in' }, // spring
      { t: 0.24, y: -0.115, scaleX: 0.97, scaleY: 1.05, ease: 'out' }, // apex
      { t: 0.39, y: 0, scaleX: 0.95, scaleY: 1.08, ease: 'in' }, // fall
      { t: 0.44, y: 0, scaleX: 1.12, scaleY: 0.84, ease: 'out' }, // squash
      { t: 0.62, y: 0, scaleX: 1, scaleY: 1, ease: 'outElastic' },
      // frozen, trembling
      ...sway('rotate', -0.8, 0.8, 14, 'linear'),
    ],
    head: [
      { t: 0, y: -0.01, rotate: 0 },
      { t: 0.07, y: 0.012, rotate: 3 },
      { t: 0.2, y: -0.022, rotate: -6, ease: 'out' },
      { t: 0.44, y: 0.016, rotate: 4, ease: 'in' }, // head keeps falling after the feet stop
      { t: 0.66, y: -0.01, rotate: 0, ease: 'outBack' },
      { t: 1, y: -0.01, rotate: 0 },
    ],
    jaw: [
      { t: 0, y: 0.034 },
      { t: 0.44, y: 0.046, ease: 'in' },
      { t: 0.62, y: 0.034, ease: 'outBack' },
      { t: 1, y: 0.034 },
    ],
    // Ears drag down on the way up, fly up at the apex, and stay pricked.
    earL: [
      { t: 0, rotate: 24 },
      { t: 0.14, rotate: -14, ease: 'out' },
      { t: 0.3, rotate: 38, ease: 'out' },
      { t: 0.46, rotate: 8 },
      { t: 0.7, rotate: 24, ease: 'outElastic' },
      { t: 1, rotate: 24 },
    ],
    earR: [
      { t: 0, rotate: -24 },
      { t: 0.14, rotate: 14, ease: 'out' },
      { t: 0.3, rotate: -38, ease: 'out' },
      { t: 0.46, rotate: -8 },
      { t: 0.7, rotate: -24, ease: 'outElastic' },
      { t: 1, rotate: -24 },
    ],
    tail: [
      { t: 0, rotate: 38 },
      { t: 0.1, rotate: 10, ease: 'out' },
      { t: 0.26, rotate: 58, ease: 'outBack' },
      { t: 0.46, rotate: 24 },
      { t: 0.66, rotate: 38, ease: 'outElastic' },
      { t: 0.74, rotate: 42 },
      { t: 0.82, rotate: 35 },
      { t: 0.9, rotate: 41 },
      { t: 1, rotate: 38 },
    ],
    legFL: [
      { t: 0.07, rotate: 0 },
      { t: 0.22, rotate: -26, ease: 'out' },
      { t: 0.4, rotate: -8 },
      { t: 0.5, rotate: 0, ease: 'out' },
    ],
    legFR: [
      { t: 0.07, rotate: 0 },
      { t: 0.24, rotate: -14, ease: 'out' },
      { t: 0.42, rotate: 0 },
    ],
    legBL: [
      { t: 0.07, rotate: 0 },
      { t: 0.22, rotate: 24, ease: 'out' },
      { t: 0.4, rotate: 8 },
      { t: 0.5, rotate: 0, ease: 'out' },
    ],
    legBR: [
      { t: 0.07, rotate: 0 },
      { t: 0.24, rotate: 13, ease: 'out' },
      { t: 0.42, rotate: 0 },
    ],
    udder: [
      { t: 0.4, scaleY: 1, y: 0 },
      { t: 0.46, scaleY: 1.2, y: 0.004, ease: 'out' },
      { t: 0.7, scaleY: 1, y: 0, ease: 'outElastic' },
    ],
  },
};

export default shockedJump;
