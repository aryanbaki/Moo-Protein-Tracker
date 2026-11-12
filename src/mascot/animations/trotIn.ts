import type { CowAnimation, Key } from '../rig/types';

const TROT_END = 0.5; // the cow is still trotting until here
const STRIDES = 5;

/** Repeat a 0..1 pattern across the trot. */
function trot(pattern: Key[], times = STRIDES): Key[] {
  const keys: Key[] = [];
  for (let i = 0; i < times; i++) {
    for (const k of pattern) {
      if (i > 0 && k.t === 0) continue;
      keys.push({ ...k, t: ((i + k.t) / times) * TROT_END });
    }
  }
  return keys;
}

/** A trotting leg: `a` and `b` are its two extremes. Diagonal pairs move together. */
const stride = (a: number, b: number): Key[] => [
  { t: 0, rotate: a },
  { t: 0.5, rotate: b, ease: 'sine' },
  { t: 1, rotate: a, ease: 'sine' },
];

/**
 * Bounces in from off-screen left at a happy trot, sees it is about to overshoot, slams
 * on the brakes (legs braced, leaning back, dust), tips forward past the mark and rocks
 * back onto it.
 */
const trotIn: CowAnimation = {
  id: 'trotIn',
  name: 'Trot in',
  category: 'entrances',
  loop: false,
  durationMs: 2200,
  restFrame: 0.62,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'happy', mouth: 'open' },
    { t: 0.5, eyes: 'wide', mouth: 'wavy', brows: 'raised' },
    { t: 0.88, eyes: 'open', mouth: 'smile', brows: 'none' },
  ],
  props: [{ kind: 'dust', from: 0.53, to: 0.8, dx: 0.1, scale: 1.4 }],
  tracks: {
    root: [
      { t: 0, x: -1.25, opacity: 0 },
      { t: 0.04, opacity: 1 },
      { t: TROT_END, x: -0.07, ease: 'linear' }, // steady pace across the floor
      { t: 0.66, x: 0.075, ease: 'out' }, // skids past the mark
      { t: 0.82, x: -0.012, ease: 'inOut' },
      { t: 0.92, x: 0, ease: 'out' },

      // one bounce per stride
      ...trot([
        { t: 0, y: 0, scaleX: 1.05, scaleY: 0.94 },
        { t: 0.5, y: -0.04, scaleX: 0.97, scaleY: 1.05, ease: 'out' },
        { t: 1, y: 0, scaleX: 1.05, scaleY: 0.94, ease: 'in' },
      ]),
      ...trot(
        [
          { t: 0, rotate: 4 },
          { t: 0.5, rotate: 1, ease: 'sine' },
          { t: 1, rotate: 4, ease: 'sine' },
        ],
        STRIDES,
      ),
      // brakes: sits back hard, tips forward over its toes, rocks back
      { t: 0.57, rotate: -9, scaleX: 1.09, scaleY: 0.91, ease: 'out' },
      { t: 0.66, rotate: -6, scaleX: 1.04, scaleY: 0.96 },
      { t: 0.76, rotate: 7, scaleX: 0.98, scaleY: 1.03, ease: 'inOut' },
      { t: 0.86, rotate: -2, scaleX: 1, scaleY: 1, ease: 'inOut' },
      { t: 0.95, rotate: 0, ease: 'out' },
    ],
    legFL: [
      ...trot(stride(-28, 24)),
      { t: 0.56, rotate: -32, ease: 'out' }, // all four braced out in front
      { t: 0.67, rotate: -28 },
      { t: 0.77, rotate: 6, ease: 'inOut' },
      { t: 0.9, rotate: 0, ease: 'outBack' },
    ],
    legBR: [...trot(stride(-22, 22)), { t: 0.57, rotate: -20, ease: 'out' }, { t: 0.68, rotate: -16 }, { t: 0.8, rotate: 4, ease: 'inOut' }, { t: 0.92, rotate: 0, ease: 'out' }],
    legFR: [...trot(stride(22, -24)), { t: 0.57, rotate: -24, ease: 'out' }, { t: 0.68, rotate: -20 }, { t: 0.79, rotate: 4, ease: 'inOut' }, { t: 0.92, rotate: 0, ease: 'out' }],
    legBL: [
      ...trot(stride(26, -24)),
      { t: 0.56, rotate: -26, ease: 'out' },
      { t: 0.67, rotate: -22 },
      { t: 0.78, rotate: 6, ease: 'inOut' },
      { t: 0.9, rotate: 0, ease: 'outBack' },
    ],
    // Head bobs half a beat behind; thrown forward by the stop.
    head: [
      ...trot([
        { t: 0, rotate: -4, y: -0.006 },
        { t: 0.6, rotate: 5, y: 0.008, ease: 'sine' },
        { t: 1, rotate: -4, y: -0.006, ease: 'sine' },
      ]),
      { t: 0.57, rotate: -10, y: -0.01, ease: 'out' }, // rears back from the edge
      { t: 0.7, rotate: 12, y: 0.016, ease: 'inOut' }, // whiplash
      { t: 0.84, rotate: -4, y: -0.004, ease: 'inOut' },
      { t: 0.96, rotate: 0, y: 0, ease: 'outBack' },
    ],
    // Ears and tail stream out behind, then get flung forward.
    earL: [
      ...trot([
        { t: 0, rotate: -22 },
        { t: 0.65, rotate: -4, ease: 'sine' },
        { t: 1, rotate: -22, ease: 'sine' },
      ]),
      { t: 0.6, rotate: -34, ease: 'out' },
      { t: 0.73, rotate: 34, ease: 'inOut' },
      { t: 0.84, rotate: -12 },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    earR: [
      ...trot([
        { t: 0, rotate: -26 },
        { t: 0.7, rotate: -8, ease: 'sine' },
        { t: 1, rotate: -26, ease: 'sine' },
      ]),
      { t: 0.61, rotate: -36, ease: 'out' },
      { t: 0.75, rotate: 32, ease: 'inOut' },
      { t: 0.86, rotate: -12 },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    tail: [
      ...trot([
        { t: 0, rotate: 50 },
        { t: 0.6, rotate: 30, ease: 'sine' },
        { t: 1, rotate: 50, ease: 'sine' },
      ]),
      { t: 0.6, rotate: 64, ease: 'out' },
      { t: 0.76, rotate: -34, ease: 'inOut' },
      { t: 0.87, rotate: 18 },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    udder: [
      ...trot([
        { t: 0, rotate: -7, scaleY: 1.1 },
        { t: 0.5, rotate: 7, scaleY: 0.94, ease: 'sine' },
        { t: 1, rotate: -7, scaleY: 1.1, ease: 'sine' },
      ]),
      { t: 0.6, rotate: 12, scaleY: 1, ease: 'out' },
      { t: 0.76, rotate: -12, ease: 'inOut' },
      { t: 0.96, rotate: 0, ease: 'outElastic' },
    ],
    jaw: [
      { t: 0.5, y: 0 },
      { t: 0.57, y: 0.02, ease: 'out' },
      { t: 0.84, y: 0.014 },
      { t: 0.9, y: 0, ease: 'out' },
    ],
  },
};

export default trotIn;
