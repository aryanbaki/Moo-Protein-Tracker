/**
 * Moo: the app's cow. A 3D-rendered Holstein cut into parts by scripts/cow-parts/build.py
 * (boxes, pivots and outlines come from the generated moo.parts.ts).
 *
 * The open eyes and resting mouth are part of the head picture. Blinks and other eye
 * kinds are eyelids drawn over them in the head's own colours.
 */
import type { CowSkin, Shape } from '../rig/types';
import { FILL_RANGE, HEAD_FILL_RANGE, HEAD_SILHOUETTE, IMAGES, PIVOTS, ROOT_PIVOT, SILHOUETTE } from './moo.parts';

const pic = (name: keyof typeof IMAGES): Shape[] => [{ d: '', image: IMAGES[name] }];

const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;

/* The two eyes as they sit on the head picture (centre, radii). */
const EYE_L = { cx: 252, cy: 233, rx: 33, ry: 39, skin: '#3D3836' };
const EYE_R = { cx: 396, cy: 250, rx: 37, ry: 43, skin: '#4A4441' };
const LASH = '#1E1B1A';

type Eye = typeof EYE_L;

/** A shut lid: the eye covered in face colour with a lash line across the lower third. */
const shut = (e: Eye, curve: 'down' | 'up' = 'down'): Shape[] => {
  const y = e.cy + e.ry * 0.28;
  const bend = curve === 'down' ? e.ry * 0.42 : -e.ry * 0.5;
  return [
    { d: ellipse(e.cx, e.cy, e.rx, e.ry), fill: e.skin },
    { d: `M ${e.cx - e.rx * 0.78} ${y} Q ${e.cx} ${y + bend} ${e.cx + e.rx * 0.78} ${y}`, stroke: LASH, sw: 6 },
  ];
};

/** A half-lowered lid. */
const half = (e: Eye, amount = 0.5): Shape[] => {
  const y = e.cy - e.ry + e.ry * 2 * amount;
  return [
    { d: `M ${e.cx - e.rx - 2} ${y} L ${e.cx - e.rx - 2} ${e.cy - e.ry - 4} L ${e.cx + e.rx + 2} ${e.cy - e.ry - 4} L ${e.cx + e.rx + 2} ${y} Q ${e.cx} ${y + e.ry * 0.3} ${e.cx - e.rx - 2} ${y} Z`, fill: e.skin, clip: e === EYE_L ? 'eyeL' : 'eyeR' },
    { d: `M ${e.cx - e.rx * 0.9} ${y + 1} Q ${e.cx} ${y + e.ry * 0.3} ${e.cx + e.rx * 0.9} ${y + 1}`, stroke: LASH, sw: 5, clip: e === EYE_L ? 'eyeL' : 'eyeR' },
  ];
};

const MOUTH = { x: 284, y: 404 };
const openMouth: Shape[] = [
  { d: ellipse(MOUTH.x, MOUTH.y, 30, 15), fill: '#4B2526' },
  { d: `M ${MOUTH.x - 18} ${MOUTH.y + 6} Q ${MOUTH.x} ${MOUTH.y - 6} ${MOUTH.x + 18} ${MOUTH.y + 6} Q ${MOUTH.x} ${MOUTH.y + 18} ${MOUTH.x - 18} ${MOUTH.y + 6} Z`, fill: '#E58D8A' },
];
const tongue: Shape[] = [
  { d: `M ${MOUTH.x - 16} ${MOUTH.y - 8} L ${MOUTH.x + 16} ${MOUTH.y - 8} Q ${MOUTH.x + 18} ${MOUTH.y + 26} ${MOUTH.x} ${MOUTH.y + 28} Q ${MOUTH.x - 18} ${MOUTH.y + 26} ${MOUTH.x - 16} ${MOUTH.y - 8} Z`, fill: '#E58D8A' },
  { d: `M ${MOUTH.x} ${MOUTH.y - 4} L ${MOUTH.x} ${MOUTH.y + 14}`, stroke: '#C86F70', sw: 3 },
];

const moo: CowSkin = {
  id: 'moo',
  name: 'Moo',
  viewBox: { x: 40, y: 10, w: 944, h: 990 },
  headBox: { x: 60, y: 14, w: 560, h: 440 },
  facing: 'left',
  clips: {
    eyeL: ellipse(EYE_L.cx, EYE_L.cy, EYE_L.rx, EYE_L.ry),
    eyeR: ellipse(EYE_R.cx, EYE_R.cy, EYE_R.rx, EYE_R.ry),
  },

  parts: {
    body: { shapes: pic('body'), pivot: PIVOTS.body },
    head: { shapes: pic('head'), pivot: PIVOTS.head },
    earL: { shapes: pic('earL'), pivot: PIVOTS.earL, rotateGain: 0.8 },
    earR: { shapes: pic('earR'), pivot: PIVOTS.earR, rotateGain: 0.8 },
    tail: { shapes: pic('tail'), pivot: PIVOTS.tail, mirror: true, rotateGain: 0.6 },
    // L = nearer the viewer, R = the far one.
    legFL: { shapes: pic('legFL'), pivot: PIVOTS.legFL, mirror: true, rotateGain: 0.55 },
    legFR: { shapes: pic('legFR'), pivot: PIVOTS.legFR, mirror: true, rotateGain: 0.55 },
    legBL: { shapes: pic('legBL'), pivot: PIVOTS.legBL, mirror: true, rotateGain: 0.5 },
    legBR: { shapes: pic('legBR'), pivot: PIVOTS.legBR, mirror: true, rotateGain: 0.5 },
    eyes: { shapes: [], pivot: PIVOTS.eyes },
    mouth: { shapes: [], pivot: PIVOTS.mouth },
  },
  rootPivot: ROOT_PIVOT,
  zOrder: ['tail', 'legBR', 'legFR', 'legBL', 'legFL', 'body', 'earL', 'earR', 'head', 'eyes', 'mouth'],

  eyes: {
    open: { shapes: [] },
    wide: { shapes: [] },
    closed: { shapes: [...shut(EYE_L), ...shut(EYE_R)] },
    happy: { shapes: [...shut(EYE_L, 'up'), ...shut(EYE_R, 'up')] },
    squint: { shapes: [...half(EYE_L, 0.5), ...half(EYE_R, 0.5)] },
    wonky: { shapes: [...half(EYE_L, 0.62), ...half(EYE_R, 0.25)] },
  },
  lids: [
    { pivot: [EYE_L.cx, EYE_L.cy - EYE_L.ry], shapes: shut(EYE_L) },
    { pivot: [EYE_R.cx, EYE_R.cy - EYE_R.ry], shapes: shut(EYE_R) },
  ],
  mouth: { smile: [], flat: [], wavy: [], open: openMouth, tongue },

  anchors: {
    headTop: [352, 92],
    eyeLine: [324, 242],
    mouthPoint: [276, 402],
    above: [350, 30],
    eyeSpan: 146,
    headWidth: 250,
  },

  silhouette: [SILHOUETTE],
  headSilhouette: [HEAD_SILHOUETTE],
  fillRange: FILL_RANGE,
  headFillRange: HEAD_FILL_RANGE,
  ghostFace: [],
  ghost: IMAGES.whole,
  shadow: { cx: 590, cy: 948, rx: 380, ry: 46 },

  armFallbackGain: 0.5,
  jawFollow: 0.6,
};

export default moo;
