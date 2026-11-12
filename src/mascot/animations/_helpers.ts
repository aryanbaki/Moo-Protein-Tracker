/** Small keyframe builders. They only return plain `Key[]` data. */
import type { AnimationCategory, CowAnimation, EasingName, Key } from '../rig/types';
import breathe from './breathe';

type Prop = 'rotate' | 'x' | 'y' | 'scaleX' | 'scaleY' | 'scale' | 'opacity';

/**
 * Swing one property a -> b -> a, `cycles` times across the whole animation.
 * Loop-safe (starts and ends on `a`). Combine several with spread: [...sway(), ...sway()].
 */
export function sway(prop: Prop, a: number, b: number, cycles = 1, ease: EasingName = 'sine'): Key[] {
  const keys: Key[] = [];
  const n = cycles * 2;
  for (let i = 0; i <= n; i++) keys.push({ t: i / n, [prop]: i % 2 ? b : a, ease });
  return keys;
}

/** Repeat a 0..1 pattern `times` times across the animation (for beats and steps). */
export function tile(pattern: Key[], times: number): Key[] {
  const keys: Key[] = [];
  for (let i = 0; i < times; i++) {
    for (const k of pattern) {
      if (i > 0 && k.t === 0) continue; // the previous tile's t = 1 key already sits here
      keys.push({ ...k, t: (i + k.t) / times });
    }
  }
  return keys;
}

/** Placeholder for an animation nobody has written yet: plays `breathe` under its own id. */
export function stub(id: string, name: string, category: AnimationCategory): CowAnimation {
  return { ...breathe, id, name, category };
}
