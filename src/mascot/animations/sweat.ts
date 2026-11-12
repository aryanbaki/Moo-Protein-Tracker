import type { CowAnimation } from '../rig/types';
import { sway } from './_helpers';

/** Nervous: trembling on the spot, ears flat, eyes darting, sweat flying off. */
const sweat: CowAnimation = {
  id: 'sweat',
  name: 'Sweat',
  category: 'reactions',
  loop: true,
  durationMs: 2600,
  restFrame: 0.3,
  expressions: [{ t: 0, mouth: 'wavy', brows: 'worried' }],
  props: [{ kind: 'sweat', from: 0, to: 1, repeat: 2 }],
  tracks: {
    root: [...sway('rotate', -0.7, 0.7, 14, 'linear'), ...sway('scaleY', 1, 0.985, 2)],
    head: [...sway('y', 0, 0.006, 2), ...sway('rotate', 1, -2, 1)],
    earL: [...sway('rotate', -14, -19, 7)],
    earR: [...sway('rotate', 14, 19, 7)],
    pupils: [
      { t: 0, x: 0 },
      { t: 0.18, x: -0.011, ease: 'out' },
      { t: 0.42, x: -0.011 },
      { t: 0.56, x: 0.01, ease: 'out' },
      { t: 0.84, x: 0.01 },
      { t: 1, x: 0, ease: 'out' },
    ],
    brows: sway('y', 0, -0.004, 4),
    tail: sway('rotate', -4, -12, 7),
    legFL: sway('rotate', 0, 2.5, 14, 'linear'),
    legBL: sway('rotate', 0, -2.5, 14, 'linear'),
  },
};

export default sweat;
