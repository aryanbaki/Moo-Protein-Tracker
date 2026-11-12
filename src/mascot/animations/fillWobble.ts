import type { CowAnimation, Key } from '../rig/types';

const HIT = 0.13; // the "plop" as the last drop goes in
const BEAT = 0.085; // half a wobble
const SWINGS = 8;

/** Size of swing `i` of a jelly that starts at 1 and dies away (alternating sign). */
const swing = (i: number) => (i % 2 ? -1 : 1) * Math.pow(0.66, i);

/**
 * A decaying wobble of one property around `rest`, starting `lag` after the plop.
 * `amp` is the first (biggest) swing.
 */
function wobble(prop: 'rotate' | 'y' | 'scaleX' | 'scaleY', rest: number, amp: number, lag = 0): Key[] {
  const keys: Key[] = [{ t: HIT + lag, [prop]: rest }];
  for (let i = 0; i < SWINGS; i++) keys.push({ t: Math.min(1, HIT + lag + (i + 1) * BEAT), [prop]: rest + amp * swing(i), ease: 'sine' });
  keys.push({ t: Math.min(1, HIT + lag + (SWINGS + 1.5) * BEAT), [prop]: rest, ease: 'sine' });
  return keys;
}

/**
 * Topped up: the cow takes the last drop with a plop and wobbles like a full water
 * balloon, wide then tall then wide, belly a beat behind, ears, tail and udder a beat
 * behind that, until it settles with a very satisfied face.
 */
const fillWobble: CowAnimation = {
  id: 'fillWobble',
  name: 'Fill wobble',
  category: 'setPieces',
  loop: false,
  durationMs: 2200,
  restFrame: 0.27,
  idle: { breathe: false, blink: false },
  expressions: [
    { t: 0.05, eyes: 'wide', mouth: 'flat', brows: 'raised' },
    { t: HIT + 0.05, eyes: 'happy', mouth: 'smile', brows: 'none' },
    { t: 0.9, eyes: 'open', mouth: 'smile' },
  ],
  props: [{ kind: 'sparkle', from: 0.2, to: 0.78, repeat: 2, scale: 1.2, dy: -0.03 }],
  tracks: {
    root: [
      { t: 0, scaleX: 1, scaleY: 1, y: 0 },
      { t: 0.07, scaleX: 0.96, scaleY: 1.06, ease: 'out' }, // draws up ...
      { t: HIT, scaleX: 1, scaleY: 1, ease: 'in' },
      // ... plop: wide first, then the jelly
      ...wobble('scaleX', 1, 0.17).slice(1),
      ...wobble('scaleY', 1, -0.16).slice(1),
    ],
    // The belly sloshes sideways half a beat behind the rest.
    body: [...wobble('scaleX', 1, 0.07, BEAT * 0.5), ...wobble('rotate', 0, 2.2, BEAT * 0.5)],
    // The head rides the wobble late and bobbles.
    head: [...wobble('y', 0, 0.026, BEAT * 0.35), ...wobble('rotate', 0, 7, BEAT * 0.6), ...wobble('scaleY', 1, -0.05, BEAT * 0.35)],
    earL: wobble('rotate', 0, -32, BEAT * 0.9),
    earR: wobble('rotate', 0, 30, BEAT * 1.05),
    tail: wobble('rotate', 0, 46, BEAT * 1.1),
    udder: [...wobble('scaleY', 1, 0.3, BEAT * 0.7), ...wobble('rotate', 0, -9, BEAT * 0.9)],
    // Legs splay as it goes wide.
    legFL: wobble('rotate', 0, -11, BEAT * 0.2),
    legFR: wobble('rotate', 0, -7, BEAT * 0.3),
    legBL: wobble('rotate', 0, 11, BEAT * 0.2),
    legBR: wobble('rotate', 0, 7, BEAT * 0.3),
    jaw: [
      { t: 0.05, y: 0 },
      { t: HIT, y: 0.012, ease: 'out' },
      { t: HIT + 0.06, y: 0, ease: 'out' },
    ],
  },
};

export default fillWobble;
