import type { CowAnimation } from '../rig/types';
import { sway } from './_helpers';

/** Sideways cud-chewing with a blade of grass; the skull squashes a touch on each bite. */
const chew: CowAnimation = {
  id: 'chew',
  name: 'Chew',
  category: 'eating',
  loop: true,
  durationMs: 2000,
  restFrame: 0.125,
  expressions: [{ t: 0, mouth: 'none' }],
  props: [{ kind: 'grass', from: 0, to: 1 }],
  tracks: {
    jaw: [...sway('y', 0.003, 0.026, 4), ...sway('x', -0.01, 0.01, 2)],
    head: [...sway('rotate', -1.5, 2, 1), ...sway('scaleY', 1, 0.982, 4), ...sway('scaleX', 1, 1.012, 4)],
    earL: sway('rotate', 0, 5, 4),
    earR: sway('rotate', 0, -5, 4),
    tail: sway('rotate', -8, 10, 1),
  },
};

export default chew;
