/**
 * Mascot: Moo the cow, drawn in code.
 *
 * - rig/            the contract (types.ts), the player (CowRig.tsx), props, sampling
 * - skins/          one file per cow design, all on the same CowSkin contract
 * - animations/     one file per animation: plain keyframe data that plays on every skin
 * - Cow.tsx         the app-facing cow (skin + animation + fill cross-fade)
 * - CowFill.tsx     the see-through silhouette with the rising liquid fill
 * - Ufo.tsx         the abduction scene
 * - art.ts          the classic cow's path data (shared with scripts/generate-icons.mjs)
 * - SpeechBubble.tsx, Confetti.tsx
 */
export { Cow, ALL_POSES, type CowProps, type CowPose } from './Cow';
export { CowRig, type CowRigProps } from './rig/CowRig';
export type { CowAnimation, CowSkin } from './rig/types';
export { CATEGORIES } from './rig/types';
export { SKINS, DEFAULT_SKIN_ID, getSkin } from './skins';
export { ANIMATIONS, DEFAULT_ANIMATION_ID, getAnimation } from './animations';
export { UfoScene, type UfoSceneProps } from './Ufo';
export { SpeechBubble, type SpeechBubbleProps } from './SpeechBubble';
export { Confetti, type ConfettiProps } from './Confetti';
