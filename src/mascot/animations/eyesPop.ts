import type { CowAnimation } from '../rig/types';

/**
 * A cartoon take: a dead-still freeze, a squinting double-check, then the eyes burst out
 * of the head as it jolts back and the ears shoot straight up. Holds, quivering, and sinks.
 */
const eyesPop: CowAnimation = {
  id: 'eyesPop',
  name: 'Eyes pop',
  category: 'reactions',
  loop: false,
  durationMs: 2300,
  restFrame: 0.45,
  idle: { blink: false, breathe: false },
  expressions: [
    { t: 0, eyes: 'open', mouth: 'flat', brows: 'none' },
    { t: 0.2, eyes: 'squint' },
    { t: 0.3, eyes: 'wide', mouth: 'open', brows: 'raised' },
    { t: 0.84, eyes: 'closed', mouth: 'flat', brows: 'none' },
    { t: 0.89, eyes: 'open' },
    { t: 0.97, mouth: 'smile' },
  ],
  props: [{ kind: 'shock', from: 0.31, to: 0.74 }],
  tracks: {
    eyes: [
      { t: 0, scale: 1, y: 0 },
      { t: 0.2, scale: 1 },
      { t: 0.29, scaleX: 1.05, scaleY: 0.75, ease: 'in' }, // squeezed tight: the anticipation
      { t: 0.35, scale: 1.75, y: -0.012, ease: 'out' }, // POP
      { t: 0.42, scale: 1.4, y: -0.008, ease: 'inOut' },
      { t: 0.48, scale: 1.52, y: -0.009 },
      // quiver
      { t: 0.53, scale: 1.44 },
      { t: 0.58, scale: 1.52 },
      { t: 0.63, scale: 1.44 },
      { t: 0.68, scale: 1.5 },
      { t: 0.74, scale: 1.46, y: -0.008 },
      { t: 0.84, scale: 1, y: 0, ease: 'in' },
    ],
    brows: [
      { t: 0.29, y: 0 },
      { t: 0.35, y: -0.03, ease: 'out' },
      { t: 0.74, y: -0.026 },
      { t: 0.84, y: 0 },
    ],
    head: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.06, rotate: 0, y: 0 }, // freeze
      { t: 0.2, rotate: 0, y: 0 },
      { t: 0.29, rotate: 6, x: 0.012, y: 0.012, scaleX: 1.05, scaleY: 0.94, ease: 'inOut' }, // leans in, peering
      { t: 0.35, rotate: -13, x: -0.026, y: -0.03, scaleX: 0.93, scaleY: 1.12, ease: 'out' }, // jolt back
      { t: 0.44, rotate: -9, x: -0.02, y: -0.02, scaleX: 1, scaleY: 1, ease: 'outBack' },
      { t: 0.74, rotate: -9, x: -0.02, y: -0.02 },
      { t: 0.88, rotate: 3, x: 0.002, y: 0.008, ease: 'inOut' },
      { t: 1, rotate: 0, x: 0, y: 0, ease: 'sine' },
    ],
    jaw: [
      { t: 0.3, y: 0 },
      { t: 0.37, y: 0.05, ease: 'out' },
      { t: 0.74, y: 0.044 },
      { t: 0.84, y: 0, ease: 'in' },
    ],
    root: [
      { t: 0, scaleX: 1, scaleY: 1, rotate: 0, y: 0 },
      { t: 0.2, scaleX: 1, scaleY: 1 },
      { t: 0.29, scaleX: 1.05, scaleY: 0.93, rotate: 1.5, ease: 'inOut' },
      { t: 0.35, scaleX: 0.93, scaleY: 1.1, rotate: -3.5, y: -0.018, ease: 'out' }, // up on its toes
      { t: 0.43, scaleX: 0.98, scaleY: 1.03, rotate: -2.5, y: 0, ease: 'in' },
      { t: 0.5, scaleX: 0.98, scaleY: 1.03, rotate: -2.5 },
      // frozen, trembling
      { t: 0.53, rotate: -3.1 },
      { t: 0.56, rotate: -1.9 },
      { t: 0.59, rotate: -3.1 },
      { t: 0.62, rotate: -1.9 },
      { t: 0.65, rotate: -3 },
      { t: 0.68, rotate: -2 },
      { t: 0.71, rotate: -2.8 },
      { t: 0.74, rotate: -2.5, scaleX: 0.98, scaleY: 1.03 },
      { t: 0.88, scaleX: 1.02, scaleY: 0.975, rotate: 0, ease: 'inOut' },
      { t: 1, scaleX: 1, scaleY: 1, ease: 'sine' },
    ],
    earL: [
      { t: 0.2, rotate: 0, scaleY: 1 },
      { t: 0.29, rotate: -14, scaleY: 0.92, ease: 'inOut' }, // flattened
      { t: 0.37, rotate: 44, scaleY: 1.18, ease: 'out' }, // shoot up, a beat after the head
      { t: 0.45, rotate: 30, scaleY: 1.05 },
      { t: 0.52, rotate: 37, scaleY: 1.08 },
      { t: 0.74, rotate: 34, scaleY: 1.08 },
      { t: 0.88, rotate: -12, scaleY: 1, ease: 'inOut' },
      { t: 0.96, rotate: 4 },
      { t: 1, rotate: 0 },
    ],
    earR: [
      { t: 0.2, rotate: 0, scaleY: 1 },
      { t: 0.29, rotate: 14, scaleY: 0.92, ease: 'inOut' },
      { t: 0.38, rotate: -44, scaleY: 1.18, ease: 'out' },
      { t: 0.46, rotate: -30, scaleY: 1.05 },
      { t: 0.53, rotate: -37, scaleY: 1.08 },
      { t: 0.74, rotate: -34, scaleY: 1.08 },
      { t: 0.89, rotate: 12, scaleY: 1, ease: 'inOut' },
      { t: 0.97, rotate: -4 },
      { t: 1, rotate: 0 },
    ],
    tail: [
      { t: 0.2, rotate: 0 },
      { t: 0.29, rotate: -10, ease: 'inOut' },
      { t: 0.39, rotate: 58, ease: 'outBack' }, // bolt upright
      { t: 0.5, rotate: 48 },
      { t: 0.56, rotate: 53 },
      { t: 0.62, rotate: 47 },
      { t: 0.68, rotate: 52 },
      { t: 0.74, rotate: 49 },
      { t: 0.9, rotate: -8, ease: 'inOut' },
      { t: 1, rotate: 0, ease: 'sine' },
    ],
    legFL: [
      { t: 0.29, rotate: 0 },
      { t: 0.36, rotate: -10, ease: 'out' },
      { t: 0.74, rotate: -8 },
      { t: 0.88, rotate: 0 },
    ],
    legBL: [
      { t: 0.29, rotate: 0 },
      { t: 0.36, rotate: 9, ease: 'out' },
      { t: 0.74, rotate: 7 },
      { t: 0.88, rotate: 0 },
    ],
  },
};

export default eyesPop;
