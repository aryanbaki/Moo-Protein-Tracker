import type { CowAnimation, EasingName, Key } from '../rig/types';

const MOO_FROM = 0.37;
const MOO_TO = 0.74;

/** A fast tremble of one property between `a` and `b` for as long as the moo lasts. */
function tremble(prop: 'rotate' | 'x' | 'y', a: number, b: number, n: number, ease: EasingName = 'sine'): Key[] {
  const keys: Key[] = [];
  for (let i = 0; i <= n; i++) keys.push({ t: MOO_FROM + ((MOO_TO - MOO_FROM) * i) / n, [prop]: i % 2 ? b : a, ease });
  return keys;
}

/**
 * The big one. Chin drops, a long breath in (chest swells, head tips right back, ears
 * pin flat), then "MOO!": mouth wide, everything shaking, tail stiff, the chest slowly
 * emptying. Runs out of air, head drops, recovers, pleased with itself.
 */
const moo: CowAnimation = {
  id: 'moo',
  name: 'MOO!',
  category: 'setPieces',
  loop: false,
  durationMs: 2800,
  restFrame: 0.5,
  idle: { breathe: false, blink: false },
  expressions: [
    { t: 0.07, eyes: 'closed', mouth: 'flat' },
    { t: 0.14, mouth: 'none', brows: 'raised' }, // lips pressed shut, filling up
    { t: MOO_FROM - 0.015, mouth: 'open', brows: 'none' },
    { t: 0.76, mouth: 'flat', brows: 'worried' },
    { t: 0.88, eyes: 'open', mouth: 'smile', brows: 'none' },
  ],
  props: [{ kind: 'bubble', text: 'MOO!', from: MOO_FROM, to: 0.8, dx: 0.04, dy: 0.07, scale: 1.25 }],
  tracks: {
    root: [
      { t: 0, rotate: 0, x: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.1, rotate: 2, scaleX: 1.02, scaleY: 0.97, ease: 'out' }, // sinks first
      { t: 0.33, rotate: -4, scaleX: 0.99, scaleY: 1.04, ease: 'inOut' }, // rises with the breath
      { t: 0.355, rotate: -5, scaleY: 1.05 },
      { t: MOO_FROM, rotate: -2 },
      ...tremble('rotate', -2.8, -1.2, 14),
      ...tremble('x', -0.004, 0.004, 18, 'linear'),
      { t: MOO_FROM + 0.02, scaleX: 1.05, scaleY: 0.97, ease: 'out' }, // braces into it
      { t: MOO_TO, scaleX: 1.02, scaleY: 0.98 },
      { t: 0.8, rotate: 3, x: 0, scaleX: 1.03, scaleY: 0.96, ease: 'out' }, // sags, out of breath
      { t: 0.92, rotate: 0, scaleX: 1, scaleY: 1, ease: 'outBack' },
    ],
    // The chest: fills on the breath in, empties as the moo goes on.
    body: [
      { t: 0.1, scaleX: 1, scaleY: 1 },
      { t: 0.34, scaleX: 1.09, scaleY: 1.07, ease: 'out' },
      { t: MOO_FROM, scaleX: 1.1, scaleY: 1.07 },
      { t: MOO_TO, scaleX: 0.97, scaleY: 0.97, ease: 'inOut' },
      { t: 0.92, scaleX: 1, scaleY: 1, ease: 'outBack' },
    ],
    head: [
      { t: 0, rotate: 0, y: 0, scaleX: 1, scaleY: 1 },
      { t: 0.1, rotate: 9, y: 0.01, ease: 'out' }, // chin down
      { t: 0.34, rotate: -20, y: -0.012, ease: 'inOut' }, // right back
      { t: MOO_FROM - 0.01, rotate: -22, y: -0.012 },
      { t: MOO_FROM + 0.025, rotate: -15, y: -0.006, scaleX: 1.05, scaleY: 1.05, ease: 'out' }, // thrown into the moo
      ...tremble('rotate', -15, -17.5, 12).slice(1),
      { t: MOO_TO, scaleX: 1.03, scaleY: 1.03 },
      { t: 0.81, rotate: 10, y: 0.014, scaleX: 1, scaleY: 1, ease: 'inOut' }, // flop
      { t: 0.95, rotate: 0, y: 0, ease: 'outBack' },
    ],
    jaw: [
      { t: 0.1, y: 0 },
      { t: 0.34, y: -0.004 },
      { t: MOO_FROM + 0.02, y: 0.04, ease: 'out' },
      ...tremble('y', 0.04, 0.034, 10).slice(1),
      { t: 0.79, y: 0, ease: 'in' },
    ],
    brows: [
      { t: 0.14, y: 0.004 },
      { t: 0.34, y: -0.008, ease: 'out' },
    ],
    // Pinned back for the breath, then flapping in the blast.
    earL: [{ t: 0.05, rotate: 0 }, { t: 0.13, rotate: 10, ease: 'out' }, { t: 0.36, rotate: -28, ease: 'inOut' }, ...tremble('rotate', -34, -18, 10), { t: 0.84, rotate: -22, ease: 'out' }, { t: 1, rotate: 0, ease: 'outElastic' }],
    earR: [{ t: 0.06, rotate: 0 }, { t: 0.14, rotate: -10, ease: 'out' }, { t: 0.36, rotate: 28, ease: 'inOut' }, ...tremble('rotate', 16, 34, 10), { t: 0.85, rotate: 22, ease: 'out' }, { t: 1, rotate: 0, ease: 'outElastic' }],
    tail: [
      { t: 0.05, rotate: 0 },
      { t: 0.12, rotate: -12, ease: 'out' },
      { t: 0.35, rotate: 30, ease: 'inOut' },
      { t: MOO_FROM, rotate: 30 },
      { t: MOO_FROM + 0.03, rotate: 66, ease: 'outBack' }, // bolt upright
      ...tremble('rotate', 66, 60, 12).slice(2),
      { t: 0.84, rotate: -14, ease: 'in' },
      { t: 0.92, rotate: 10 },
      { t: 1, rotate: 0, ease: 'out' },
    ],
    // Feet planted wide to push it out.
    legFL: [{ t: 0.33, rotate: 0 }, { t: MOO_FROM + 0.03, rotate: -9, ease: 'out' }, { t: MOO_TO, rotate: -8 }, { t: 0.9, rotate: 0, ease: 'outBack' }],
    legBL: [{ t: 0.33, rotate: 0 }, { t: MOO_FROM + 0.03, rotate: 9, ease: 'out' }, { t: MOO_TO, rotate: 8 }, { t: 0.9, rotate: 0, ease: 'outBack' }],
    legFR: [{ t: 0.33, rotate: 0 }, { t: MOO_FROM + 0.04, rotate: -5, ease: 'out' }, { t: MOO_TO, rotate: -4 }, { t: 0.9, rotate: 0, ease: 'outBack' }],
    legBR: [{ t: 0.33, rotate: 0 }, { t: MOO_FROM + 0.04, rotate: 5, ease: 'out' }, { t: MOO_TO, rotate: 4 }, { t: 0.9, rotate: 0, ease: 'outBack' }],
    udder: [{ t: MOO_FROM, rotate: 0 }, ...tremble('rotate', -4, 4, 12).slice(1), { t: 0.84, rotate: 0, ease: 'out' }],
  },
};

export default moo;
