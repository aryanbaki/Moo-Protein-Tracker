import type { CowAnimation } from '../rig/types';
import { sway } from './_helpers';

/** Limp in the tractor beam: everything dangles and drifts at its own lazy pace. */
const abducted: CowAnimation = {
  id: 'abducted',
  name: 'Abducted',
  category: 'setPieces',
  loop: true,
  durationMs: 4800,
  restFrame: 0.25,
  idle: { breathe: false, blink: false },
  expressions: [{ t: 0, eyes: 'wide', mouth: 'none', brows: 'worried' }],
  tracks: {
    root: [...sway('y', -0.012, -0.03, 2), ...sway('rotate', -3, 3, 1)],
    head: sway('rotate', 8, 13, 3),
    jaw: sway('y', 0.02, 0.026, 2),
    earL: sway('rotate', -24, -18, 4),
    earR: sway('rotate', 24, 18, 4),
    tail: sway('rotate', -34, -20, 3),
    legFL: sway('rotate', -16, -4, 4),
    legBL: sway('rotate', 18, 6, 3),
    legFR: sway('rotate', -2, -14, 3),
    legBR: sway('rotate', 4, 16, 4),
    udder: sway('rotate', -6, 6, 3),
    pupils: sway('y', -0.006, -0.01, 2),
  },
};

export default abducted;
