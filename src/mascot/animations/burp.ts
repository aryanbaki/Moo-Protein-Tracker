import type { CowAnimation } from '../rig/types';

/**
 * Uh oh: the body swells and the cheeks fill while the cow tries to hold it in, then it
 * pops out with a jolt. A frozen beat, an embarrassed side glance, and a sheepish smile.
 */
const burp: CowAnimation = {
  id: 'burp',
  name: 'Burp',
  category: 'eating',
  loop: false,
  durationMs: 2600,
  restFrame: 0.4,
  idle: { blink: false, breathe: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'flat', brows: 'worried' },
    { t: 0.2, eyes: 'wide' },
    { t: 0.36, eyes: 'closed', mouth: 'open', brows: 'none' },
    { t: 0.5, eyes: 'wide', mouth: 'flat', brows: 'raised' },
    { t: 0.66, eyes: 'open', mouth: 'wavy', brows: 'worried' },
    { t: 0.92, mouth: 'smile', brows: 'none' },
  ],
  props: [
    { kind: 'bubble', text: 'BURP', from: 0.37, to: 0.6, dx: 0.04 },
    { kind: 'sweat', from: 0.62, to: 0.92 },
  ],
  tracks: {
    // Inflate slowly (with a hiccup on the way), pop, wobble back.
    root: [
      { t: 0, scaleX: 1, scaleY: 1, y: 0 },
      { t: 0.06, scaleX: 1.02, scaleY: 0.97, ease: 'out' },
      { t: 0.18, scaleX: 1.05, scaleY: 1.03, ease: 'inOut' },
      { t: 0.21, scaleX: 1.035, scaleY: 1.02 }, // hic
      { t: 0.34, scaleX: 1.1, scaleY: 1.07, ease: 'inOut' }, // fit to burst
      { t: 0.39, scaleX: 0.93, scaleY: 0.96, y: -0.012, ease: 'out' }, // POP
      { t: 0.5, scaleX: 1.03, scaleY: 0.99, y: 0, ease: 'outBack' },
      { t: 0.62, scaleX: 1, scaleY: 1, ease: 'sine' },
    ],
    head: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.18, rotate: 2, y: 0.006, scaleX: 1.04, scaleY: 0.99, ease: 'inOut' },
      { t: 0.34, rotate: 5, y: 0.014, x: -0.006, scaleX: 1.09, scaleY: 0.97, ease: 'inOut' }, // cheeks, chin tucked
      { t: 0.39, rotate: -14, y: -0.026, x: 0.012, scaleX: 0.95, scaleY: 1.08, ease: 'out' }, // thrown back
      { t: 0.48, rotate: -6, y: -0.008, x: 0.004, scaleX: 1, scaleY: 1, ease: 'outBack' },
      { t: 0.62, rotate: -6, y: -0.008, x: 0.004 }, // frozen
      { t: 0.74, rotate: 6, y: 0.012, x: -0.006, ease: 'inOut' }, // shrinks away
      { t: 0.9, rotate: 5, y: 0.01, x: -0.005 },
      { t: 1, rotate: 0, y: 0, x: 0, ease: 'inOut' },
    ],
    jaw: [
      { t: 0.34, y: 0 },
      { t: 0.39, y: 0.046, ease: 'out' },
      { t: 0.47, y: 0.03 },
      { t: 0.52, y: 0, ease: 'in' },
    ],
    // Did anyone hear that?
    pupils: [
      { t: 0.5, x: 0, y: 0 },
      { t: 0.66, x: 0, y: 0 },
      { t: 0.7, x: -0.012, y: 0.002, ease: 'out' },
      { t: 0.8, x: -0.012, y: 0.002 },
      { t: 0.84, x: 0.012, y: 0.002, ease: 'out' },
      { t: 0.91, x: 0.012, y: 0.002 },
      { t: 0.96, x: 0, y: 0, ease: 'out' },
    ],
    earL: [
      { t: 0.1, rotate: 0 },
      { t: 0.34, rotate: -12, ease: 'inOut' },
      { t: 0.4, rotate: 36, ease: 'out' }, // blown up by the pop
      { t: 0.48, rotate: -10 },
      { t: 0.56, rotate: 12 },
      { t: 0.64, rotate: 8 },
      { t: 0.76, rotate: -20, ease: 'inOut' }, // droop, embarrassed
      { t: 0.9, rotate: -18 },
      { t: 1, rotate: 0, ease: 'outBack' },
    ],
    earR: [
      { t: 0.1, rotate: 0 },
      { t: 0.34, rotate: 12, ease: 'inOut' },
      { t: 0.41, rotate: -36, ease: 'out' },
      { t: 0.49, rotate: 10 },
      { t: 0.57, rotate: -12 },
      { t: 0.65, rotate: -8 },
      { t: 0.77, rotate: 20, ease: 'inOut' },
      { t: 0.9, rotate: 18 },
      { t: 1, rotate: 0, ease: 'outBack' },
    ],
    legFL: [
      { t: 0.34, rotate: 0 },
      { t: 0.4, rotate: -12, ease: 'out' },
      { t: 0.52, rotate: 0, ease: 'outBack' },
    ],
    legBL: [
      { t: 0.34, rotate: 0 },
      { t: 0.4, rotate: 12, ease: 'out' },
      { t: 0.52, rotate: 0, ease: 'outBack' },
    ],
    udder: [
      { t: 0.36, scaleY: 1 },
      { t: 0.43, scaleY: 1.2, ease: 'out' },
      { t: 0.6, scaleY: 1, ease: 'outElastic' },
    ],
    tail: [
      { t: 0.06, rotate: 0 },
      { t: 0.34, rotate: -14, ease: 'inOut' }, // clamped
      { t: 0.41, rotate: 54, ease: 'out' }, // shoots up
      { t: 0.52, rotate: 6, ease: 'inOut' },
      { t: 0.6, rotate: 20 },
      { t: 0.76, rotate: -12, ease: 'inOut' }, // tucked
      { t: 0.9, rotate: -10 },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
  },
};

export default burp;
