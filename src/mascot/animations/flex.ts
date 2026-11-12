import type { CowAnimation } from '../rig/types';

/**
 * Front double... well, single bicep. Rears back and turns the arm in, winds up and
 * PUMPS (the arm swells, chest out, chin up), winds up and pumps again, bigger, then
 * holds it, looks down at its own bicep, bounces it twice and waggles its eyebrows.
 * Loops from the held pose. Skins without arms do all of it with a front leg.
 */
const flex: CowAnimation = {
  id: 'flex',
  name: 'Flex',
  category: 'wins',
  loop: true,
  durationMs: 2800,
  restFrame: 0.72,
  idle: { blink: false },
  expressions: [
    { t: 0, eyes: 'squint', mouth: 'smile', brows: 'raised' },
    { t: 0.07, eyes: 'open', mouth: 'flat', brows: 'angry' }, // effort
    { t: 0.56, eyes: 'squint', mouth: 'smile', brows: 'raised' }, // smug
  ],
  props: [
    { kind: 'sparkle', from: 0.17, to: 0.36, anchor: 'mouthPoint', dx: -0.1, dy: 0.075, scale: 0.55 },
    { kind: 'sparkle', from: 0.5, to: 0.9, anchor: 'mouthPoint', dx: -0.1, dy: 0.075, scale: 0.7, repeat: 2 },
  ],
  tracks: {
    armL: [
      { t: 0, rotate: -140, scaleX: 1.12, scaleY: 1 },
      { t: 0.1, rotate: -92, scaleX: 0.94, scaleY: 1.03, ease: 'inOut' }, // wind-up: opens out
      { t: 0.19, rotate: -150, scaleX: 1.34, scaleY: 0.94, ease: 'outBack' }, // PUMP
      { t: 0.33, rotate: -146, scaleX: 1.28, scaleY: 0.96 },
      { t: 0.43, rotate: -88, scaleX: 0.92, scaleY: 1.04, ease: 'inOut' },
      { t: 0.52, rotate: -156, scaleX: 1.46, scaleY: 0.92, ease: 'outBack' }, // PUMP, bigger
      { t: 0.62, rotate: -152, scaleX: 1.38, scaleY: 0.94 },
      // bounces the bicep
      { t: 0.67, scaleX: 1.56, ease: 'out' },
      { t: 0.72, scaleX: 1.36, ease: 'in' },
      { t: 0.77, scaleX: 1.56, ease: 'out' },
      { t: 0.82, rotate: -152, scaleX: 1.36, scaleY: 0.94, ease: 'in' },
      { t: 1, rotate: -140, scaleX: 1.12, scaleY: 1, ease: 'inOut' },
    ],
    armR: [
      { t: 0, rotate: -30 },
      { t: 0.1, rotate: -16, ease: 'inOut' },
      { t: 0.2, rotate: -38, ease: 'outBack' },
      { t: 0.43, rotate: -14, ease: 'inOut' },
      { t: 0.53, rotate: -42, ease: 'outBack' },
      { t: 1, rotate: -30, ease: 'inOut' },
    ],
    root: [
      { t: 0, rotate: -6, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.1, rotate: -2.5, scaleX: 1.04, scaleY: 0.95, ease: 'inOut' }, // dips
      { t: 0.19, rotate: -9, y: -0.012, scaleX: 0.98, scaleY: 1.05, ease: 'outBack' },
      { t: 0.33, rotate: -8, y: 0, scaleX: 1, scaleY: 1.02 },
      { t: 0.43, rotate: -2, scaleX: 1.05, scaleY: 0.94, ease: 'inOut' },
      { t: 0.52, rotate: -11, y: -0.02, scaleX: 0.97, scaleY: 1.07, ease: 'outBack' },
      { t: 0.62, rotate: -10, y: 0, scaleX: 1, scaleY: 1.03, ease: 'in' },
      { t: 0.84, rotate: -10, scaleY: 1.03 },
      { t: 1, rotate: -6, scaleY: 1, ease: 'inOut' },
    ],
    // Chest puffs a beat after each pump.
    body: [
      { t: 0, scaleX: 1.02 },
      { t: 0.1, scaleX: 0.99, ease: 'inOut' },
      { t: 0.22, scaleX: 1.06, ease: 'outBack' },
      { t: 0.43, scaleX: 0.99, ease: 'inOut' },
      { t: 0.55, scaleX: 1.08, ease: 'outBack' },
      { t: 0.84, scaleX: 1.07 },
      { t: 1, scaleX: 1.02, ease: 'inOut' },
    ],
    head: [
      { t: 0, rotate: 3, y: 0 },
      { t: 0.1, rotate: 7, y: 0.008, ease: 'inOut' }, // strains down with the wind-up
      { t: 0.21, rotate: -6, y: -0.004, ease: 'outBack' }, // chin up on the pump
      { t: 0.33, rotate: -4 },
      { t: 0.43, rotate: 8, y: 0.008, ease: 'inOut' },
      { t: 0.54, rotate: -8, y: -0.006, ease: 'outBack' },
      { t: 0.6, rotate: -7 },
      { t: 0.66, rotate: 8, y: 0.006, ease: 'inOut' }, // admires the bicep
      { t: 0.84, rotate: 8, y: 0.006 },
      { t: 1, rotate: 3, y: 0, ease: 'inOut' },
    ],
    pupils: [
      { t: 0, x: 0, y: 0 },
      { t: 0.58, x: 0, y: 0 },
      { t: 0.65, x: 0.006, y: 0.011, ease: 'out' }, // looks down at it
      { t: 0.84, x: 0.006, y: 0.011 },
      { t: 0.92, x: 0, y: 0, ease: 'out' },
      { t: 1, x: 0, y: 0 },
    ],
    // Eyebrow waggle in time with the bicep bounce.
    brows: [
      { t: 0, y: 0 },
      { t: 0.63, y: 0 },
      { t: 0.67, y: -0.012, ease: 'out' },
      { t: 0.72, y: 0.002, ease: 'in' },
      { t: 0.77, y: -0.012, ease: 'out' },
      { t: 0.82, y: 0, ease: 'in' },
      { t: 1, y: 0 },
    ],
    earL: [
      { t: 0, rotate: 4 },
      { t: 0.12, rotate: -10, ease: 'inOut' },
      { t: 0.24, rotate: 20, ease: 'outBack' },
      { t: 0.45, rotate: -12, ease: 'inOut' },
      { t: 0.57, rotate: 24, ease: 'outBack' },
      { t: 0.7, rotate: -8, ease: 'inOut' },
      { t: 0.8, rotate: 8 },
      { t: 1, rotate: 4, ease: 'inOut' },
    ],
    earR: [
      { t: 0, rotate: -4 },
      { t: 0.13, rotate: 10, ease: 'inOut' },
      { t: 0.25, rotate: -20, ease: 'outBack' },
      { t: 0.46, rotate: 12, ease: 'inOut' },
      { t: 0.58, rotate: -24, ease: 'outBack' },
      { t: 0.72, rotate: 8, ease: 'inOut' },
      { t: 0.82, rotate: -8 },
      { t: 1, rotate: -4, ease: 'inOut' },
    ],
    tail: [
      { t: 0, rotate: 20 },
      { t: 0.12, rotate: 2, ease: 'inOut' },
      { t: 0.25, rotate: 44, ease: 'outBack' },
      { t: 0.45, rotate: 4, ease: 'inOut' },
      { t: 0.58, rotate: 54, ease: 'outBack' },
      { t: 0.68, rotate: 34 },
      { t: 0.73, rotate: 46 },
      { t: 0.78, rotate: 34 },
      { t: 0.83, rotate: 46 },
      { t: 1, rotate: 20, ease: 'inOut' },
    ],
    legBL: [
      { t: 0, rotate: 6 },
      { t: 0.1, rotate: 2, ease: 'inOut' },
      { t: 0.2, rotate: 10, ease: 'outBack' },
      { t: 0.43, rotate: 2, ease: 'inOut' },
      { t: 0.53, rotate: 13, ease: 'outBack' },
      { t: 0.84, rotate: 11 },
      { t: 1, rotate: 6, ease: 'inOut' },
    ],
    legBR: [
      { t: 0, rotate: 5 },
      { t: 0.11, rotate: 2, ease: 'inOut' },
      { t: 0.21, rotate: 8, ease: 'outBack' },
      { t: 0.44, rotate: 2, ease: 'inOut' },
      { t: 0.54, rotate: 10, ease: 'outBack' },
      { t: 0.84, rotate: 9 },
      { t: 1, rotate: 5, ease: 'inOut' },
    ],
  },
};

export default flex;
