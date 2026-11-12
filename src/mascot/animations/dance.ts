import type { CowAnimation, Key } from '../rig/types';
import { sway, tile } from './_helpers';

/** One beat: sink into the floor, pop up stretched, drop back. */
const bounce: Key[] = [
  { t: 0, y: 0, scaleX: 1.06, scaleY: 0.93 },
  { t: 0.5, y: -0.04, scaleX: 0.97, scaleY: 1.05, ease: 'out' },
  { t: 1, y: 0, scaleX: 1.06, scaleY: 0.93, ease: 'in' },
];

/** Four-beat happy dance: bouncing, rocking side to side, legs kicking in pairs. */
const dance: CowAnimation = {
  id: 'dance',
  name: 'Dance',
  category: 'wins',
  loop: true,
  durationMs: 2000,
  restFrame: 0.125,
  idle: { blink: false },
  expressions: [{ t: 0, eyes: 'happy', mouth: 'open' }],
  tracks: {
    root: [...tile(bounce, 4), ...sway('rotate', -5, 5, 2)],
    // The head counter-rocks and the ears flop a little behind it.
    head: [...sway('rotate', 9, -9, 2), ...sway('y', 0.006, -0.006, 4)],
    earL: sway('rotate', -14, 12, 4),
    earR: sway('rotate', 12, -14, 4),
    tail: sway('rotate', -24, 26, 4),
    legFL: sway('rotate', 0, -32, 4, 'out'),
    legBL: sway('rotate', 24, 0, 4, 'out'),
    legFR: sway('rotate', -18, 0, 4, 'out'),
    legBR: sway('rotate', 0, 16, 4, 'out'),
    udder: [...sway('scaleY', 1.1, 0.94, 4), ...sway('rotate', 5, -5, 2)],
  },
};

export default dance;
