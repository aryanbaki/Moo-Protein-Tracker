/**
 * Mascot: Moo the cow, drawn in code.
 *
 * - art.ts          the artwork as plain path data (shared with the icon generator)
 * - poses.ts        pose choreography (Reanimated shared values)
 * - Cow.tsx         the layered, animated cow
 * - CowFill.tsx     the see-through silhouette with the rising liquid fill
 * - Ufo.tsx         the abduction scene
 * - SpeechBubble.tsx, Confetti.tsx
 */
export { Cow, type CowProps } from './Cow';
export { ALL_POSES, type CowPose } from './poses';
export { UfoScene, type UfoSceneProps } from './Ufo';
export { SpeechBubble, type SpeechBubbleProps } from './SpeechBubble';
export { Confetti, type ConfettiProps } from './Confetti';
