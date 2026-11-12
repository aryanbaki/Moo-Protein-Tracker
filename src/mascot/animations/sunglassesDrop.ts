import type { CowAnimation } from '../rig/types';

/**
 * Sunglasses fall out of the sky and land on its face. It does not flinch, does not look
 * up, does not smile. A beat. One brow. The smallest possible nod.
 * (The glasses' own drop takes 0.22 of the clock: first contact ~0.2, settled ~0.34.)
 */
const sunglassesDrop: CowAnimation = {
  id: 'sunglassesDrop',
  name: 'Sunglasses drop',
  category: 'wins',
  loop: false,
  durationMs: 2800,
  restFrame: 1,
  idle: { blink: false },
  expressions: [
    { t: 0, mouth: 'flat' },
    { t: 0.6, brows: 'raised' },
  ],
  props: [
    { kind: 'sunglasses', from: 0.12, to: 1, scale: 1.18, dy: -0.01 },
    { kind: 'sparkle', from: 0.37, to: 0.57, anchor: 'eyeLine', dx: 0.07, dy: -0.03, scale: 0.75 },
  ],
  tracks: {
    head: [
      { t: 0.19, rotate: 0, y: 0, scaleY: 1 },
      { t: 0.215, rotate: 2.5, y: 0.01, scaleY: 0.975, ease: 'out' }, // takes the weight
      { t: 0.28, rotate: 0.8, y: 0.004, scaleY: 1, ease: 'inOut' },
      { t: 0.36, rotate: 0, y: 0, ease: 'outBack' },
      // ... nothing ...
      { t: 0.66, rotate: 0, y: 0 },
      { t: 0.71, rotate: -4, y: -0.004, ease: 'out' }, // chin lifts
      { t: 0.79, rotate: 7, y: 0.008, ease: 'inOut' }, // the nod
      { t: 0.92, rotate: -2.5, y: -0.002, ease: 'outBack' },
      { t: 1, rotate: -2, y: -0.002 },
    ],
    root: [
      { t: 0.195, scaleY: 1, scaleX: 1 },
      { t: 0.225, scaleY: 0.975, scaleX: 1.012, ease: 'out' },
      { t: 0.34, scaleY: 1, scaleX: 1, ease: 'outBack' },
    ],
    brows: [
      { t: 0.6, y: 0.01, rotate: 0 },
      { t: 0.65, y: -0.012, rotate: -8, ease: 'outBack' },
      { t: 1, y: -0.01, rotate: -7 },
    ],
    // The ears are the only part that reacts.
    earL: [
      { t: 0.195, rotate: 0 },
      { t: 0.23, rotate: -20, ease: 'out' },
      { t: 0.42, rotate: 0, ease: 'outElastic' },
      { t: 0.74, rotate: 0 },
      { t: 0.83, rotate: -12, ease: 'out' },
      { t: 0.97, rotate: 0, ease: 'outBack' },
    ],
    earR: [
      { t: 0.2, rotate: 0 },
      { t: 0.24, rotate: 22, ease: 'out' },
      { t: 0.45, rotate: 0, ease: 'outElastic' },
      { t: 0.75, rotate: 0 },
      { t: 0.84, rotate: 12, ease: 'out' },
      { t: 0.98, rotate: 0, ease: 'outBack' },
    ],
    tail: [
      { t: 0.4, rotate: 0 },
      { t: 0.48, rotate: 22, ease: 'out' },
      { t: 0.55, rotate: -8, ease: 'in' },
      { t: 0.62, rotate: 0, ease: 'out' },
      { t: 0.8, rotate: 0 },
      { t: 0.88, rotate: 30, ease: 'out' },
      { t: 1, rotate: 8, ease: 'outBack' },
    ],
  },
};

export default sunglassesDrop;
