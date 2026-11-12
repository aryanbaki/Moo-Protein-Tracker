import type { CowAnimation } from '../rig/types';
import { sway } from './_helpers';

/** Arm up and waving, with the whole cow leaning into it. Loops while held up. */
const wave: CowAnimation = {
  id: 'wave',
  name: 'Wave hello',
  category: 'entrances',
  loop: true,
  durationMs: 1500,
  restFrame: 0.125,
  expressions: [{ t: 0, mouth: 'open' }],
  tracks: {
    armL: sway('rotate', -100, -158, 4),
    root: [...sway('y', 0, -0.008, 4), ...sway('rotate', -1.2, -2.2, 2)],
    head: sway('rotate', 3, 8, 2),
    // Ears and tail trail the head by half a beat.
    earL: sway('rotate', 5, -5, 2),
    earR: sway('rotate', -7, 6, 2),
    tail: sway('rotate', -6, 16, 2),
    legBL: sway('rotate', 0, 3, 2),
  },
};

export default wave;
