/**
 * Classic Moo: the original side-view dairy cow, ported onto the rig unchanged in look.
 * The drawings still live in ../art.ts (the icon generator renders the same data).
 */
import { art, BODY_D, cowParts, ell, FULL_VB, ghostFace, HEAD_VB, PIVOT, silhouette, SKULL_D } from '../art';
import type { CowSkin, Shape } from '../rig/types';

const O = art.outline;
const HX = 238; // head centre line
const EYE_Y = 86;
const L = HX - 16.5; // eye centres
const R = HX + 16.5;
const FINE = 3.5;

const idle = cowParts('idle');
const torso = idle.torso; // 3 teats, udder, body fill, 3 patches, body outline

/* ---- eyes ---- */
const openEyes = idle.eyes; // per eye: white, pupil, highlight
const wideEyes = cowParts('shocked').eyes; // per eye: white, pupil
const lid = (cx: number) => `M ${cx - 9} ${EYE_Y - 1} Q ${cx} ${EYE_Y + 9} ${cx + 9} ${EYE_Y - 1}`;
const closedEyes: Shape[] = [
  { d: lid(L), stroke: art.white, sw: 9 },
  { d: lid(L), stroke: O, sw: 4.5 },
  { d: lid(R), stroke: O, sw: 4.5 },
];
const squintEyes: Shape[] = [L, R].flatMap((cx) => [
  ...(cx === L ? [{ d: `M ${cx - 13} ${EYE_Y - 2} L ${cx + 13} ${EYE_Y - 2}`, stroke: art.white, sw: 10 }] : []),
  { d: `M ${cx - 11} ${EYE_Y - 2} L ${cx + 11} ${EYE_Y - 2} C ${cx + 11} ${EYE_Y + 13} ${cx - 11} ${EYE_Y + 13} ${cx - 11} ${EYE_Y - 2} Z`, fill: art.white, stroke: O, sw: FINE },
  { d: `M ${cx - 13} ${EYE_Y - 2} L ${cx + 13} ${EYE_Y - 2}`, stroke: O, sw: 5 },
]);
const squintPupils: Shape[] = [L, R].map((cx) => ({ d: ell(cx + 1.5, EYE_Y + 3, 5, 4.4), fill: O }));
const wonkyEyes: Shape[] = [
  { d: ell(L - 1, EYE_Y - 2, 13, 15), fill: art.white, stroke: O, sw: FINE },
  { d: ell(R + 1, EYE_Y + 2, 8.5, 9.5), fill: art.white, stroke: O, sw: FINE },
];
const wonkyPupils: Shape[] = [
  { d: ell(L - 5, EYE_Y - 7, 4.6, 4.6), fill: O },
  { d: ell(R + 3, EYE_Y + 5, 3.6, 3.6), fill: O },
];

/* ---- mouths (drawn on the muzzle) ---- */
const mouthOf = (pose: Parameters<typeof cowParts>[0]) => cowParts(pose).muzzle.slice(3);
const smile = mouthOf('idle');
const tongue: Shape[] = [
  ...smile,
  { d: `M ${HX - 1} 143.5 C ${HX - 2} 157 ${HX + 13} 157 ${HX + 11} 141.5 Z`, fill: art.tongue, stroke: O, sw: 3 },
  { d: `M ${HX + 5} 145 L ${HX + 5.5} 150`, stroke: art.mouth, sw: 2 },
];

const classic: CowSkin = {
  id: 'classic',
  name: 'Classic',
  viewBox: FULL_VB,
  headBox: HEAD_VB,
  clips: { body: BODY_D, skull: SKULL_D },

  parts: {
    tail: { shapes: idle.tail, pivot: PIVOT.tail },
    legBR: { shapes: idle.legFarRear, pivot: PIVOT.legFarRear },
    legFR: { shapes: idle.legFarFront, pivot: PIVOT.legFarFront },
    udder: { shapes: torso.slice(0, 4), pivot: [134, 190] },
    body: { shapes: torso.slice(4, 5), pivot: PIVOT.torso },
    patches: { shapes: torso.slice(5, 8), pivot: PIVOT.torso },
    legBL: { shapes: idle.legNearRear, pivot: PIVOT.legNearRear },
    legFL: { shapes: idle.legNearFront, pivot: PIVOT.legNearFront },
    head: { shapes: idle.headBase, pivot: PIVOT.head },
    earL: { shapes: idle.earL, pivot: PIVOT.earL },
    earR: { shapes: idle.earR, pivot: PIVOT.earR },
    eyes: { shapes: [], pivot: PIVOT.eyes },
    jaw: { shapes: idle.jaw, pivot: PIVOT.jaw },
    muzzle: { shapes: idle.muzzle.slice(0, 3), pivot: [HX, 127] },
    mouth: { shapes: [], pivot: [HX, 140] },
    brows: { shapes: [], pivot: [HX, 64] },
  },
  rootPivot: PIVOT.root,

  zOrder: [
    'tail',
    'legBR',
    'legFR',
    'udder',
    'body',
    'patches',
    { follows: 'body', shapes: torso.slice(8) }, // body outline over the patches
    'legBL',
    'legFL',
    'earL',
    'earR',
    'head',
    'eyes',
    'jaw',
    'muzzle',
    'mouth',
    'brows',
  ],

  eyes: {
    open: { shapes: [openEyes[0], openEyes[3]] as Shape[], pupils: [openEyes[1], openEyes[2], openEyes[4], openEyes[5]] as Shape[] },
    wide: { shapes: [wideEyes[0], wideEyes[2]] as Shape[], pupils: [wideEyes[1], wideEyes[3]] as Shape[] },
    happy: { shapes: cowParts('dance').eyes },
    closed: { shapes: closedEyes },
    squint: { shapes: squintEyes, pupils: squintPupils },
    wonky: { shapes: wonkyEyes, pupils: wonkyPupils },
  },
  mouth: {
    smile,
    open: mouthOf('dance'),
    flat: mouthOf('shrug'),
    wavy: mouthOf('sweat'),
    tongue,
  },
  brows: {
    angry: cowParts('flex').headTop,
    worried: cowParts('sweat').headTop,
    raised: cowParts('shrug').headTop,
  },

  anchors: {
    headTop: [HX, 56],
    eyeLine: [HX, EYE_Y],
    mouthPoint: [HX + 12, 143],
    above: [HX + 6, 22],
    eyeSpan: 33,
    headWidth: 74,
  },

  silhouette: silhouette(false),
  headSilhouette: silhouette(true),
  fillRange: { top: 36, bottom: 242 },
  headFillRange: { top: 36, bottom: 156 },
  ghostFace: ghostFace(),
};

export default classic;
