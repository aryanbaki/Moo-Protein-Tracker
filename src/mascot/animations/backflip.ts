import type { CowAnimation, Key } from '../rig/types';

/*
 * The root pivot is the feet, but a flip turns around the middle of the cow. So while
 * the cow rotates, the root is also carried around a circle of radius CENTRE (plus the
 * jump arc), which keeps its middle on a clean up-and-down path.
 */
const CENTRE = 0.32; // feet to middle of the cow, in cow widths
const HEIGHT = 0.27; // how high the middle rises
const TAKE_OFF = 0.25;
const LAND = 0.6;
const N = 14;

const flight: Key[] = Array.from({ length: N + 1 }, (_, i) => {
  const u = i / N;
  // rotation: starts already turning, whips round fastest at the top, slows to spot the landing
  const turn = 0.3 * u + 0.7 * (u * u * (3 - 2 * u));
  const a = turn * 2 * Math.PI;
  const arc = 4 * HEIGHT * u * (1 - u);
  return { t: TAKE_OFF + (LAND - TAKE_OFF) * u, rotate: -360 * turn, x: CENTRE * Math.sin(a), y: -CENTRE * (1 - Math.cos(a)) - arc, ease: 'linear' as const };
});

/**
 * Deep crouch, launch, one full backwards rotation with the legs tucked, stuck landing
 * with a big squash, then chest out and chin up: nailed it.
 */
const backflip: CowAnimation = {
  id: 'backflip',
  name: 'Backflip',
  category: 'wins',
  loop: false,
  durationMs: 2300,
  restFrame: 0.94,
  idle: { blink: false },
  expressions: [
    { t: 0.04, brows: 'angry', mouth: 'flat' },
    { t: 0.25, eyes: 'wide', mouth: 'open', brows: 'raised' },
    { t: 0.61, eyes: 'closed', mouth: 'flat', brows: 'none' },
    { t: 0.73, eyes: 'happy', mouth: 'smile', brows: 'raised' },
  ],
  props: [
    { kind: 'dust', from: 0.23, to: 0.4, scale: 0.8 },
    { kind: 'dust', from: 0.6, to: 0.82, scale: 1.3 },
    { kind: 'sparkle', from: 0.72, to: 0.98, repeat: 1, dy: -0.04, scale: 1.1 },
  ],
  tracks: {
    root: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      // crouch, leaning forwards (away from the flip), and hold it a beat
      { t: 0.13, rotate: 4, scaleX: 1.12, scaleY: 0.82, ease: 'out' },
      { t: 0.21, rotate: 5, scaleX: 1.15, scaleY: 0.78, ease: 'inOut' },
      { t: TAKE_OFF, rotate: 0, x: 0, y: 0, scaleX: 0.88, scaleY: 1.18, ease: 'in' },
      ...flight.slice(1),
      { t: LAND + 0.0005, rotate: 0, x: 0, y: 0, ease: 'hold' }, // -360 is 0: rest there

      { t: 0.33, scaleX: 0.96, scaleY: 0.96, ease: 'out' }, // tucked small
      { t: 0.52, scaleX: 0.96, scaleY: 0.96 },
      { t: LAND, scaleX: 0.94, scaleY: 1.1, ease: 'in' }, // legs reach for the floor
      { t: 0.645, scaleX: 1.2, scaleY: 0.76, ease: 'out' }, // stick it
      { t: 0.8, scaleX: 0.98, scaleY: 1.04, ease: 'outBack' },
      { t: 0.84, rotate: 0 },
      { t: 0.92, rotate: -3, scaleX: 1, scaleY: 1.02, ease: 'out' }, // stands tall
      { t: 1, rotate: -2.5, scaleY: 1.02 },
    ],
    body: [
      { t: 0.7, scaleX: 1 },
      { t: 0.86, scaleX: 1.05, ease: 'outBack' }, // chest out
      { t: 1, scaleX: 1.04 },
    ],
    head: [
      { t: 0, rotate: 0, y: 0 },
      { t: 0.14, rotate: 8, y: 0.014, ease: 'out' }, // eyes on the floor
      { t: 0.22, rotate: 10, y: 0.016 },
      { t: 0.28, rotate: -16, y: -0.01, ease: 'out' }, // throws the head back to start the turn
      { t: 0.5, rotate: -6 },
      { t: 0.65, rotate: 12, y: 0.024, ease: 'in' }, // chin dips on impact
      { t: 0.84, rotate: -9, y: -0.006, ease: 'outBack' }, // chin up, proud
      { t: 1, rotate: -8, y: -0.006 },
    ],
    armL: [
      { t: 0.02, rotate: 0 },
      { t: 0.18, rotate: 24, ease: 'out' }, // swings back for the wind-up
      { t: 0.27, rotate: -110, ease: 'in' }, // and throws
      { t: 0.36, rotate: 34, ease: 'out' }, // tuck
      { t: 0.52, rotate: 34 },
      { t: LAND, rotate: -14, ease: 'out' },
      { t: 0.66, rotate: -26, ease: 'out' },
      { t: 0.8, rotate: 0, ease: 'outBack' },
    ],
    armR: [
      { t: 0.03, rotate: 0 },
      { t: 0.19, rotate: 18, ease: 'out' },
      { t: 0.28, rotate: -80, ease: 'in' },
      { t: 0.38, rotate: 24, ease: 'out' },
      { t: 0.52, rotate: 24 },
      { t: LAND, rotate: -8, ease: 'out' },
      { t: 0.67, rotate: -14, ease: 'out' },
      { t: 0.82, rotate: 0, ease: 'outBack' },
    ],
    legBL: [
      { t: 0.02, rotate: 0 },
      { t: 0.18, rotate: 10, ease: 'out' },
      { t: 0.27, rotate: 20, ease: 'in' }, // pushes off
      { t: 0.36, rotate: -32, ease: 'out' }, // tuck
      { t: 0.52, rotate: -32 },
      { t: LAND, rotate: 6, ease: 'out' },
      { t: 0.66, rotate: 18, ease: 'out' },
      { t: 0.8, rotate: 0, ease: 'outBack' },
    ],
    legBR: [
      { t: 0.03, rotate: 0 },
      { t: 0.19, rotate: 6, ease: 'out' },
      { t: 0.28, rotate: 14, ease: 'in' },
      { t: 0.38, rotate: -22, ease: 'out' },
      { t: 0.52, rotate: -22 },
      { t: LAND, rotate: 4, ease: 'out' },
      { t: 0.67, rotate: 10, ease: 'out' },
      { t: 0.82, rotate: 0, ease: 'outBack' },
    ],
    earL: [
      { t: 0.02, rotate: 0 },
      { t: 0.15, rotate: -20, ease: 'out' },
      { t: 0.3, rotate: -28, ease: 'out' },
      { t: 0.5, rotate: 20 },
      { t: 0.66, rotate: -32, ease: 'in' },
      { t: 0.76, rotate: 22, ease: 'out' },
      { t: 0.96, rotate: 8, ease: 'outElastic' },
    ],
    earR: [
      { t: 0.03, rotate: 0 },
      { t: 0.16, rotate: 20, ease: 'out' },
      { t: 0.31, rotate: 28, ease: 'out' },
      { t: 0.51, rotate: -20 },
      { t: 0.67, rotate: 32, ease: 'in' },
      { t: 0.78, rotate: -22, ease: 'out' },
      { t: 0.97, rotate: -8, ease: 'outElastic' },
    ],
    tail: [
      { t: 0, rotate: 0 },
      { t: 0.18, rotate: 26, ease: 'out' },
      { t: 0.3, rotate: -30, ease: 'out' }, // trails the launch
      { t: 0.55, rotate: -40 },
      { t: 0.68, rotate: 60, ease: 'out' }, // whips over on landing
      { t: 0.78, rotate: 10 },
      { t: 0.88, rotate: 44 },
      { t: 0.94, rotate: 24 },
      { t: 1, rotate: 38 },
    ],
    udder: [
      { t: 0.6, scaleY: 1 },
      { t: 0.66, scaleY: 1.25, ease: 'out' },
      { t: 0.84, scaleY: 1, ease: 'outElastic' },
    ],
  },
};

export default backflip;
