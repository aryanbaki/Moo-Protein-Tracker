import type { CowAnimation } from '../rig/types';

/*
 * `root.y` values, in cow widths: BELOW hides the whole cow under its own ground line,
 * PEEK leaves ears, horns and eyes showing. This needs a host that clips at the cow's
 * feet (the rig itself does not clip), so the cow also fades in from nothing.
 */
const BELOW = 0.95;
const PEEK = 0.45;

/**
 * Ears creep up over the edge, then the eyes. A careful look left, a look right, a
 * blink. Coast is clear: it ducks and pops all the way out with a "ta-da".
 */
const peekUp: CowAnimation = {
  id: 'peekUp',
  name: 'Peek up',
  category: 'entrances',
  loop: false,
  durationMs: 3200,
  restFrame: 0.33,
  idle: { breathe: false, blink: false },
  expressions: [
    { t: 0, eyes: 'wide', mouth: 'flat', brows: 'raised' },
    { t: 0.61, eyes: 'open', brows: 'none' },
    { t: 0.74, eyes: 'happy', mouth: 'open' },
    { t: 0.95, eyes: 'open', mouth: 'smile' },
  ],
  props: [{ kind: 'dust', from: 0.85, to: 1, scale: 0.9 }],
  tracks: {
    root: [
      { t: 0, y: BELOW, opacity: 0, scaleX: 1, scaleY: 1, rotate: 0 },
      { t: 0.03, opacity: 1 },
      { t: 0.1, y: 0.62, ease: 'out' }, // ear tips first
      { t: 0.14, y: 0.62 },
      { t: 0.23, y: PEEK - 0.015, ease: 'out' }, // eyes over the edge
      { t: 0.27, y: PEEK, ease: 'inOut' },
      { t: 0.6, y: PEEK },
      // duck ...
      { t: 0.7, y: 0.6, scaleX: 1.06, scaleY: 0.92, ease: 'inOut' },
      // ... and out
      { t: 0.75, scaleX: 0.9, scaleY: 1.16, ease: 'in' },
      { t: 0.8, y: -0.1, rotate: -4, ease: 'out' },
      { t: 0.83, scaleX: 0.97, scaleY: 1.05 },
      { t: 0.885, y: 0, scaleX: 0.95, scaleY: 1.08, rotate: 0, ease: 'in' },
      { t: 0.915, scaleX: 1.14, scaleY: 0.84, ease: 'out' },
      { t: 1, scaleX: 1, scaleY: 1, ease: 'outElastic' },
    ],
    head: [
      { t: 0.27, rotate: 0, y: 0 },
      { t: 0.36, rotate: -3, ease: 'inOut' }, // turns a little with each look
      { t: 0.44, rotate: -3 },
      { t: 0.52, rotate: 3.5, ease: 'inOut' },
      { t: 0.6, rotate: 3 },
      { t: 0.7, rotate: 5, y: 0.01, ease: 'inOut' },
      { t: 0.8, rotate: -9, y: -0.014, ease: 'out' },
      { t: 0.92, rotate: 6, y: 0.02, ease: 'in' },
      { t: 1, rotate: 0, y: 0, ease: 'outBack' },
    ],
    pupils: [
      { t: 0.14, x: 0, y: -0.006 },
      { t: 0.27, x: 0, y: 0, ease: 'out' },
      { t: 0.3, x: 0.003 },
      { t: 0.36, x: -0.012, ease: 'out' }, // left
      { t: 0.45, x: -0.012 },
      { t: 0.51, x: 0.012, ease: 'inOut' }, // right
      { t: 0.59, x: 0.012 },
      { t: 0.63, x: 0, ease: 'out' },
    ],
    eyes: [
      { t: 0.59, scaleY: 1 },
      { t: 0.61, scaleY: 0.1, ease: 'out' }, // blink: coast is clear
      { t: 0.64, scaleY: 1, ease: 'out' },
    ],
    brows: [
      { t: 0.14, y: 0.006 },
      { t: 0.25, y: -0.008, ease: 'outBack' },
      { t: 0.6, y: -0.006 },
    ],
    // Ears trail the rise, then prick and swivel towards wherever it looks.
    earL: [
      { t: 0, rotate: -20 },
      { t: 0.1, rotate: -26, ease: 'out' },
      { t: 0.19, rotate: 22, ease: 'outBack' },
      { t: 0.3, rotate: 12 },
      { t: 0.39, rotate: 30, ease: 'out' },
      { t: 0.47, rotate: 26 },
      { t: 0.55, rotate: 4, ease: 'inOut' },
      { t: 0.7, rotate: 22, ease: 'in' }, // left up as the head ducks
      { t: 0.8, rotate: -30, ease: 'out' },
      { t: 0.9, rotate: 30, ease: 'out' },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    earR: [
      { t: 0, rotate: 20 },
      { t: 0.12, rotate: 26, ease: 'out' },
      { t: 0.22, rotate: -22, ease: 'outBack' },
      { t: 0.32, rotate: -10 },
      { t: 0.4, rotate: -2, ease: 'inOut' },
      { t: 0.48, rotate: -4 },
      { t: 0.56, rotate: -30, ease: 'out' },
      { t: 0.71, rotate: -22, ease: 'in' },
      { t: 0.81, rotate: 30, ease: 'out' },
      { t: 0.91, rotate: -30, ease: 'out' },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    // Thrown up for the ta-da.
    armL: [
      { t: 0.74, rotate: 0 },
      { t: 0.82, rotate: -130, ease: 'outBack' },
      { t: 0.9, rotate: -120 },
      { t: 0.98, rotate: 0, ease: 'inOut' },
    ],
    armR: [
      { t: 0.75, rotate: 0 },
      { t: 0.84, rotate: -90, ease: 'outBack' },
      { t: 0.91, rotate: -80 },
      { t: 0.99, rotate: 0, ease: 'inOut' },
    ],
    legBL: [
      { t: 0.74, rotate: 0 },
      { t: 0.82, rotate: 22, ease: 'out' },
      { t: 0.9, rotate: 0, ease: 'in' },
    ],
    tail: [
      { t: 0.7, rotate: 0 },
      { t: 0.78, rotate: -24, ease: 'out' },
      { t: 0.86, rotate: 54, ease: 'out' },
      { t: 0.93, rotate: -10 },
      { t: 1, rotate: 0, ease: 'outElastic' },
    ],
    udder: [
      { t: 0.88, scaleY: 1 },
      { t: 0.93, scaleY: 1.22, ease: 'out' },
      { t: 1, scaleY: 1, ease: 'outElastic' },
    ],
  },
};

export default peekUp;
