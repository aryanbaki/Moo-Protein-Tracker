import type { CowAnimation, EasingName, Key } from '../rig/types';

/**
 * The cow turns around its own vertical axis by flipping the root's scaleX. Its pivot is
 * not on the cow's centre line, so slide it sideways as it flips to spin on the spot.
 */
const OFF_CENTRE = 0.1125;
function turned(t: number, scaleX: number, ease: EasingName = 'sine'): Key {
  return { t, scaleX, x: ((1 - scaleX) / 2) * OFF_CENTRE, ease };
}

/**
 * Wind-up twist the wrong way, then one whip-fast 360 off the ground with ears and tail
 * flung out, a landing that overshoots, and a wobble back to centre.
 */
const spin: CowAnimation = {
  id: 'spin',
  name: 'Spin',
  category: 'wins',
  loop: false,
  durationMs: 1900,
  restFrame: 0.33,
  idle: { blink: false },
  expressions: [
    { t: 0.06, brows: 'angry', mouth: 'flat' },
    { t: 0.25, eyes: 'happy', mouth: 'open', brows: 'none' },
    { t: 0.92, eyes: 'open', mouth: 'smile' },
  ],
  props: [{ kind: 'dust', from: 0.63, to: 0.86, scale: 1.1 }],
  tracks: {
    root: [
      { t: 0, rotate: 0, y: 0, scaleY: 1 },
      turned(0, 1),
      // wind-up: sink and twist away
      { t: 0.18, rotate: 5, scaleY: 0.88, ease: 'out' },
      turned(0.18, 1.1, 'out'),
      { t: 0.23, y: 0, scaleY: 0.86 },
      turned(0.23, 1.12),
      // release
      { t: 0.27, rotate: -2, y: -0.02, scaleY: 1.12, ease: 'in' },
      turned(0.27, 0.9, 'in'),
      { t: 0.42, y: -0.075, scaleY: 1.05, ease: 'out' },
      turned(0.44, -1), // back to us
      { t: 0.6, y: 0, rotate: -2, scaleY: 1.06, ease: 'in' },
      turned(0.61, 1), // all the way round
      // lands still carrying the spin: overshoots, rocks back
      { t: 0.66, rotate: 6, scaleY: 0.85, ease: 'out' },
      turned(0.66, 1.14, 'out'),
      { t: 0.77, rotate: -3, scaleY: 1.03, ease: 'inOut' },
      turned(0.77, 0.97, 'inOut'),
      { t: 0.9, rotate: 0, scaleY: 1, ease: 'outBack' },
      turned(0.9, 1, 'out'),
    ],
    head: [
      { t: 0, rotate: 0, y: 0 },
      { t: 0.2, rotate: 7, y: 0.012, ease: 'out' },
      { t: 0.3, rotate: -6, y: -0.01, ease: 'out' },
      { t: 0.6, rotate: -4, y: -0.006 },
      { t: 0.69, rotate: 9, y: 0.018, ease: 'out' },
      { t: 0.8, rotate: -4, y: -0.004 },
      { t: 0.95, rotate: 0, y: 0, ease: 'outBack' },
    ],
    // Flung straight out by the spin, then whipped past centre when it stops.
    earL: [
      { t: 0.05, rotate: 0 },
      { t: 0.2, rotate: -16, ease: 'out' },
      { t: 0.33, rotate: 26, ease: 'out' },
      { t: 0.62, rotate: 24 },
      { t: 0.7, rotate: -30, ease: 'out' },
      { t: 0.8, rotate: 14 },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    earR: [
      { t: 0.06, rotate: 0 },
      { t: 0.21, rotate: 16, ease: 'out' },
      { t: 0.35, rotate: -28, ease: 'out' },
      { t: 0.63, rotate: -24 },
      { t: 0.72, rotate: 30, ease: 'out' },
      { t: 0.82, rotate: -12 },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    tail: [
      { t: 0, rotate: 0 },
      { t: 0.2, rotate: -18, ease: 'out' },
      { t: 0.36, rotate: 62, ease: 'out' },
      { t: 0.63, rotate: 58 },
      { t: 0.73, rotate: -24, ease: 'out' },
      { t: 0.84, rotate: 20 },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    legFL: [
      { t: 0.1, rotate: 0 },
      { t: 0.22, rotate: 6, ease: 'out' },
      { t: 0.36, rotate: -24, ease: 'out' },
      { t: 0.58, rotate: -20 },
      { t: 0.66, rotate: -8, ease: 'in' },
      { t: 0.8, rotate: 0, ease: 'outBack' },
    ],
    legFR: [
      { t: 0.24, rotate: 0 },
      { t: 0.38, rotate: -12, ease: 'out' },
      { t: 0.64, rotate: 0, ease: 'in' },
    ],
    legBL: [
      { t: 0.1, rotate: 0 },
      { t: 0.22, rotate: -6, ease: 'out' },
      { t: 0.36, rotate: 22, ease: 'out' },
      { t: 0.58, rotate: 18 },
      { t: 0.66, rotate: 8, ease: 'in' },
      { t: 0.8, rotate: 0, ease: 'outBack' },
    ],
    legBR: [
      { t: 0.24, rotate: 0 },
      { t: 0.38, rotate: 11, ease: 'out' },
      { t: 0.64, rotate: 0, ease: 'in' },
    ],
    udder: [
      { t: 0.6, scaleY: 1, rotate: 0 },
      { t: 0.68, scaleY: 1.2, rotate: -8, ease: 'out' },
      { t: 0.8, rotate: 5 },
      { t: 0.96, scaleY: 1, rotate: 0, ease: 'outElastic' },
    ],
  },
};

export default spin;
