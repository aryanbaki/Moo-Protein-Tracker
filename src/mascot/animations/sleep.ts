import type { CowAnimation } from '../rig/types';

/**
 * Asleep on its feet: body sunk, head hanging, eyes shut. Two slow deep breaths per loop
 * (long inhale, quicker sigh); the head, ears and tail ride each breath a beat late.
 */
const sleep: CowAnimation = {
  id: 'sleep',
  name: 'Sleep',
  category: 'alive',
  loop: true,
  durationMs: 6400,
  restFrame: 0.3,
  idle: { blink: false, breathe: false },
  expressions: [{ t: 0, eyes: 'closed', mouth: 'flat', brows: 'none' }],
  props: [{ kind: 'zzz', from: 0, to: 1, repeat: 2 }],
  tracks: {
    root: [
      { t: 0, scaleX: 1.05, scaleY: 0.925, rotate: 1.5 },
      { t: 0.3, scaleX: 1.015, scaleY: 0.975, rotate: 1, ease: 'sine' }, // inhale
      { t: 0.5, scaleX: 1.05, scaleY: 0.925, rotate: 1.5, ease: 'inOut' }, // sigh
      { t: 0.8, scaleX: 1.015, scaleY: 0.975, rotate: 1, ease: 'sine' },
      { t: 1, scaleX: 1.05, scaleY: 0.925, rotate: 1.5, ease: 'inOut' },
    ],
    head: [
      { t: 0, rotate: 14, y: 0.05, x: 0.004 },
      { t: 0.34, rotate: 10, y: 0.036, x: 0.002, ease: 'sine' },
      { t: 0.54, rotate: 14.5, y: 0.052, x: 0.004, ease: 'inOut' },
      { t: 0.84, rotate: 10.5, y: 0.038, x: 0.002, ease: 'sine' },
      { t: 1, rotate: 14, y: 0.05, x: 0.004, ease: 'inOut' },
    ],
    // Lips flutter on the way out.
    jaw: [
      { t: 0, y: 0.004 },
      { t: 0.3, y: 0 },
      { t: 0.4, y: 0.014, ease: 'out' },
      { t: 0.5, y: 0.004, ease: 'sine' },
      { t: 0.8, y: 0 },
      { t: 0.9, y: 0.014, ease: 'out' },
      { t: 1, y: 0.004, ease: 'sine' },
    ],
    earL: [
      { t: 0, rotate: -22 },
      { t: 0.37, rotate: -14, ease: 'sine' },
      { t: 0.58, rotate: -24, ease: 'inOut' },
      { t: 0.7, rotate: -21, ease: 'sine' },
      { t: 0.74, rotate: -6, ease: 'out' }, // a dream twitch
      { t: 0.79, rotate: -19 },
      { t: 0.88, rotate: -15, ease: 'sine' },
      { t: 1, rotate: -22, ease: 'inOut' },
    ],
    earR: [
      { t: 0, rotate: 22 },
      { t: 0.38, rotate: 14, ease: 'sine' },
      { t: 0.6, rotate: 24, ease: 'inOut' },
      { t: 0.88, rotate: 15, ease: 'sine' },
      { t: 1, rotate: 22, ease: 'inOut' },
    ],
    tail: [
      { t: 0, rotate: -12 },
      { t: 0.4, rotate: -7, ease: 'sine' },
      { t: 0.6, rotate: -13, ease: 'sine' },
      { t: 0.9, rotate: -8, ease: 'sine' },
      { t: 1, rotate: -12, ease: 'sine' },
    ],
    // Legs splay a little under the sunk body and give with each breath.
    legFL: [
      { t: 0, rotate: -5 },
      { t: 0.3, rotate: -2.5, ease: 'sine' },
      { t: 0.5, rotate: -5, ease: 'inOut' },
      { t: 0.8, rotate: -2.5, ease: 'sine' },
      { t: 1, rotate: -5, ease: 'inOut' },
    ],
    legBL: [
      { t: 0, rotate: 5 },
      { t: 0.3, rotate: 2.5, ease: 'sine' },
      { t: 0.5, rotate: 5, ease: 'inOut' },
      { t: 0.8, rotate: 2.5, ease: 'sine' },
      { t: 1, rotate: 5, ease: 'inOut' },
    ],
    udder: [
      { t: 0, scaleY: 1.06 },
      { t: 0.32, scaleY: 0.98, ease: 'sine' },
      { t: 0.52, scaleY: 1.06, ease: 'inOut' },
      { t: 0.82, scaleY: 0.98, ease: 'sine' },
      { t: 1, scaleY: 1.06, ease: 'inOut' },
    ],
  },
};

export default sleep;
