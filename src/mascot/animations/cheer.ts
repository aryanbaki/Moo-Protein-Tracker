import type { CowAnimation, Key } from '../rig/types';
import { sway, tile } from './_helpers';

/** One jump: land squashed, spring, hang, drop. Loops on the squash. */
const jump: Key[] = [
  { t: 0, y: 0, scaleX: 1.12, scaleY: 0.86 },
  { t: 0.16, y: -0.03, scaleX: 0.92, scaleY: 1.13, ease: 'in' },
  { t: 0.5, y: -0.13, scaleX: 0.98, scaleY: 1.03, ease: 'out' },
  { t: 0.88, y: 0, scaleX: 0.95, scaleY: 1.08, ease: 'in' },
  { t: 1, y: 0, scaleX: 1.12, scaleY: 0.86, ease: 'out' },
];

/** Follows the jump a beat late: `low` on the squash, `high` just after the apex. */
const late = (low: number, high: number, lag = 0.1): Key[] =>
  tile(
    [
      { t: 0, rotate: low + (high - low) * 0.25 },
      { t: lag, rotate: low, ease: 'out' },
      { t: 0.5 + lag, rotate: high, ease: 'inOut' },
      { t: 1, rotate: low + (high - low) * 0.25, ease: 'in' },
    ],
    2,
  );

/** Reared up on its back legs, both arms in the air, jumping for joy. Loops. */
const cheer: CowAnimation = {
  id: 'cheer',
  name: 'Cheer',
  category: 'wins',
  loop: true,
  durationMs: 1500,
  restFrame: 0.27,
  idle: { blink: false },
  expressions: [{ t: 0, eyes: 'happy', mouth: 'open', brows: 'raised' }],
  props: [
    { kind: 'sparkle', from: 0, to: 1, repeat: 2, dy: -0.17, scale: 1.5 },
    { kind: 'sparkle', from: 0, to: 1, repeat: 3, anchor: 'above', dx: -0.34, dy: 0.2, scale: 0.9 },
    { kind: 'hearts', from: 0, to: 1, repeat: 1, dx: -0.5, dy: 0.16, scale: 0.8 },
  ],
  tracks: {
    root: [...tile(jump, 2), ...sway('rotate', -10, -15, 2, 'out')],
    // Arms pump up at the top of each jump, one slightly behind the other.
    armL: late(-140, -188, 0.04),
    armR: late(-126, -176, 0.1),
    legBL: late(10, 24, 0.02),
    legBR: late(8, 16, 0.06),
    head: [...late(4, -11, 0.06), ...tile([{ t: 0, y: 0.012 }, { t: 0.5, y: -0.012, ease: 'out' }, { t: 1, y: 0.012, ease: 'in' }], 2)],
    earL: late(-24, 30, 0.14),
    earR: late(24, -30, 0.17),
    tail: late(-8, 56, 0.16),
    udder: [...tile([{ t: 0, scaleY: 1.2 }, { t: 0.45, scaleY: 0.92, ease: 'out' }, { t: 1, scaleY: 1.2, ease: 'in' }], 2)],
  },
};

export default cheer;
