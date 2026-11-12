/**
 * Skin registry. The app ships one cow, `moo` (cut from 3D artwork by scripts/cow-parts).
 * The registry stays a list so another skin can be tried in the Cow Lab without code changes elsewhere.
 */
import type { CowSkin } from '../rig/types';
import moo from './moo';

export const SKINS: readonly CowSkin[] = [moo];

export const DEFAULT_SKIN_ID = 'moo';

export function getSkin(id?: string): CowSkin {
  return SKINS.find((s) => s.id === id) ?? moo;
}
