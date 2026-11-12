/**
 * Sticker Moo: a flat, front-facing, symmetrical cow with one fat uniform outline, like a
 * die-cut sticker or an app icon. Big rounded-rectangle head, wide pink muzzle, ears out
 * sideways, small horns, a black eye patch, little arms at the sides and two stubby feet.
 *
 * Rig notes for a front-facing cow:
 * - legFL / legFR are the ARMS (front legs hanging at the sides, pivot at the shoulder);
 *   legBL / legBR are the two feet under the body. L = screen-left.
 * - The screen-left arm and the tail are mirrored so "forward / up" swings them outward.
 */
import { colors } from '../../theme';
import type { CowSkin, Pt, Shape } from '../rig/types';

const O = colors.cowOutline;
const WHITE = colors.cowWhite;
const SPOT = colors.cowSpot;
const PINK = colors.cowPink;
const PINK_DEEP = '#EE98AB';
const HORN = '#F4DFA8';
const MOUTH_IN = '#7C2D3C';
const TONGUE = '#F47A92';

const SW = 9; // the one sticker outline
const FACE = 6.5; // face lines

const CX = 150;
const GROUND = 288;

/* ------------------------------------------------------------ path helpers */

const n = (v: number) => Math.round(v * 10) / 10;

function ell(cx: number, cy: number, rx: number, ry: number, rot = 0): string {
  const c = Math.cos((rot * Math.PI) / 180);
  const s = Math.sin((rot * Math.PI) / 180);
  const x0 = n(cx - rx * c);
  const y0 = n(cy - rx * s);
  const x1 = n(cx + rx * c);
  const y1 = n(cy + rx * s);
  return `M ${x0} ${y0} A ${rx} ${ry} ${rot} 1 0 ${x1} ${y1} A ${rx} ${ry} ${rot} 1 0 ${x0} ${y0} Z`;
}

function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const x1 = x + w;
  const y1 = y + h;
  return `M ${x + r} ${y} L ${x1 - r} ${y} A ${r} ${r} 0 0 1 ${x1} ${y + r} L ${x1} ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} L ${x + r} ${y1} A ${r} ${r} 0 0 1 ${x} ${y1 - r} L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/** A limb: a capsule from joint `a` to tip `b`. `hoof` > 0 returns only the last `hoof` units (the dark toe). */
function capsule(a: Pt, b: Pt, r: number, hoof = 0): string {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / len;
  const dy = (b[1] - a[1]) / len;
  const nx = -dy * r;
  const ny = dx * r;
  const s: Pt = hoof ? [b[0] - dx * hoof, b[1] - dy * hoof] : a;
  const p = (x: number, y: number) => `${n(x)} ${n(y)}`;
  const head = `M ${p(s[0] + nx, s[1] + ny)} L ${p(b[0] + nx, b[1] + ny)} A ${r} ${r} 0 0 0 ${p(b[0] - nx, b[1] - ny)} L ${p(s[0] - nx, s[1] - ny)}`;
  return hoof ? `${head} Z` : `${head} A ${r} ${r} 0 0 0 ${p(s[0] + nx, s[1] + ny)} Z`;
}

/** A cubic bezier turned into a closed band of the given width (a filled "stroke"). */
function band(p0: Pt, p1: Pt, p2: Pt, p3: Pt, width: number): string {
  const left: string[] = [];
  const right: string[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    const tx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const ty = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const l = Math.hypot(tx, ty) || 1;
    const ox = (-ty / l) * (width / 2);
    const oy = (tx / l) * (width / 2);
    left.push(`${n(x + ox)} ${n(y + oy)}`);
    right.unshift(`${n(x - ox)} ${n(y - oy)}`);
  }
  return `M ${[...left, ...right].join(' L ')} Z`;
}

/** x on the given side of the centre line: s = -1 screen-left, +1 screen-right. */
const sx = (s: number, dx: number) => CX + s * dx;

/* --------------------------------------------------------------------- head */

const HEAD = { x: 72, y: 58, w: 156, h: 132, r: 52 };
const SKULL_D = rrect(HEAD.x, HEAD.y, HEAD.w, HEAD.h, HEAD.r);
const NECK: Pt = [CX, 190];

const hornD = (s: number) =>
  `M ${sx(s, 70)} 86 C ${sx(s, 85)} 66 ${sx(s, 82)} 42 ${sx(s, 61)} 33 C ${sx(s, 65)} 48 ${sx(s, 57)} 62 ${sx(s, 40)} 72 Z`;

const earD = (s: number) =>
  `M ${sx(s, 68)} 98 C ${sx(s, 90)} 82 ${sx(s, 118)} 90 ${sx(s, 126)} 114 C ${sx(s, 112)} 132 ${sx(s, 88)} 132 ${sx(s, 68)} 124 Z`;
const earInnerD = (s: number) =>
  `M ${sx(s, 80)} 106 C ${sx(s, 94)} 97 ${sx(s, 108)} 101 ${sx(s, 114)} 114 C ${sx(s, 104)} 122 ${sx(s, 92)} 122 ${sx(s, 80)} 118 Z`;
const ear = (s: number): Shape[] => [
  { d: earD(s), fill: s < 0 ? SPOT : WHITE, stroke: O, sw: SW },
  { d: earInnerD(s), fill: PINK },
];

// The eye patch: a bold black blob over the screen-right eye, clipped to the skull.
const EYE_PATCH_D = 'M 166 50 C 154 78 156 120 180 136 C 204 150 236 138 240 106 L 240 50 Z';

const MUZZLE = { x: 94, y: 138, w: 112, h: 58, r: 28 };
const MUZZLE_D = rrect(MUZZLE.x, MUZZLE.y, MUZZLE.w, MUZZLE.h, MUZZLE.r);
const JAW_D = rrect(110, 162, 80, 32, 16);

const head: Shape[] = [
  { d: hornD(-1), fill: HORN, stroke: O, sw: SW },
  { d: hornD(1), fill: HORN, stroke: O, sw: SW },
  { d: SKULL_D, fill: WHITE },
  { d: EYE_PATCH_D, fill: SPOT, clip: 'skull' },
  { d: SKULL_D, stroke: O, sw: SW },
];

const muzzle: Shape[] = [
  { d: MUZZLE_D, fill: PINK, stroke: O, sw: SW },
  { d: ell(131, 160, 5.5, 7.5), fill: O },
  { d: ell(169, 160, 5.5, 7.5), fill: O },
];

/* --------------------------------------------------------------------- eyes */

const EYE_Y = 115;
const EYE_DX = 36;
const EL = CX - EYE_DX; // on white
const ER = CX + EYE_DX; // on the black patch: line work there is drawn in white
const lineOn = (cx: number) => (cx > CX ? WHITE : O);

const both = (f: (cx: number) => Shape[]): Shape[] => [...f(EL), ...f(ER)];

// Simple ovals. The eye on the patch has no visible ring, so its white is drawn a touch larger to balance.
const openEyes: Shape[] = [
  { d: ell(EL, EYE_Y, 14.5, 17.5), fill: WHITE, stroke: O, sw: 4.5 },
  { d: ell(ER, EYE_Y, 15.5, 18.5), fill: WHITE },
];
const openPupils = both((cx) => [
  { d: ell(cx, EYE_Y + 1.5, 9.5, 12.5), fill: O },
  { d: ell(cx + 3.5, EYE_Y - 4, 3.8, 3.8), fill: WHITE },
]);

const wideEyes = both((cx) => [{ d: ell(cx, EYE_Y - 1, 17.5, 20.5), fill: WHITE, stroke: O, sw: FACE }]);
const widePupils = both((cx) => [{ d: ell(cx, EYE_Y - 1, 5.5, 6.5), fill: O }]);

const closedEyes = both((cx) => [{ d: `M ${cx - 14} ${EYE_Y - 1} Q ${cx} ${EYE_Y + 13} ${cx + 14} ${EYE_Y - 1}`, stroke: lineOn(cx), sw: FACE + 1 }]);
const happyEyes = both((cx) => [{ d: `M ${cx - 14} ${EYE_Y + 7} Q ${cx} ${EYE_Y - 15} ${cx + 14} ${EYE_Y + 7}`, stroke: lineOn(cx), sw: FACE + 1 }]);

const squintEyes = both((cx) => [
  { d: `M ${cx - 15} ${EYE_Y - 1} L ${cx + 15} ${EYE_Y - 1} C ${cx + 15} ${EYE_Y + 19} ${cx - 15} ${EYE_Y + 19} ${cx - 15} ${EYE_Y - 1} Z`, fill: WHITE, stroke: O, sw: FACE },
  { d: `M ${cx - 18} ${EYE_Y - 1} L ${cx + 18} ${EYE_Y - 1}`, stroke: lineOn(cx), sw: FACE + 1 },
]);
const squintPupils = both((cx) => [{ d: `M ${cx - 7} ${EYE_Y + 2} L ${cx + 7} ${EYE_Y + 2} C ${cx + 7} ${EYE_Y + 13} ${cx - 7} ${EYE_Y + 13} ${cx - 7} ${EYE_Y + 2} Z`, fill: O }]);

const wonkyEyes: Shape[] = [
  { d: ell(EL, EYE_Y - 2, 17.5, 20), fill: WHITE, stroke: O, sw: FACE },
  { d: ell(ER, EYE_Y + 3, 10.5, 12), fill: WHITE, stroke: O, sw: FACE },
];
const wonkyPupils: Shape[] = [
  { d: ell(EL - 6, EYE_Y - 9, 5.5, 6), fill: O },
  { d: ell(ER + 3, EYE_Y + 7, 4.5, 5), fill: O },
];

/* -------------------------------------------------------------------- brows */

const BROW_Y = 87;
const brow = (cx: number, innerDy: number, outerDy: number, lift = 0): Shape => {
  const s = cx < CX ? -1 : 1; // outer side
  return { d: `M ${cx - s * 13} ${BROW_Y + innerDy - lift} L ${cx + s * 13} ${BROW_Y + outerDy - lift}`, stroke: lineOn(cx), sw: FACE + 1.5 };
};
const browArc = (cx: number): Shape => ({ d: `M ${cx - 13} ${BROW_Y - 3} Q ${cx} ${BROW_Y - 14} ${cx + 13} ${BROW_Y - 3}`, stroke: lineOn(cx), sw: FACE + 1.5 });

/* ------------------------------------------------------------------- mouths */

const MY = 177;
const smile: Shape[] = [{ d: `M ${CX - 15} ${MY - 1} Q ${CX} ${MY + 13} ${CX + 15} ${MY - 1}`, stroke: O, sw: FACE }];
const openMouth: Shape[] = [
  { d: `M ${CX - 17} ${MY - 4} L ${CX + 17} ${MY - 4} C ${CX + 17} ${MY + 17} ${CX - 17} ${MY + 17} ${CX - 17} ${MY - 4} Z`, fill: MOUTH_IN, stroke: O, sw: FACE },
  { d: ell(CX, MY + 7.5, 7.5, 3.6), fill: TONGUE },
];
const flatMouth: Shape[] = [{ d: `M ${CX - 13} ${MY + 3} L ${CX + 13} ${MY + 3}`, stroke: O, sw: FACE }];
const wavyMouth: Shape[] = [
  { d: `M ${CX - 18} ${MY + 4} Q ${CX - 13.5} ${MY - 4} ${CX - 9} ${MY + 3} T ${CX} ${MY + 3} T ${CX + 9} ${MY + 3} T ${CX + 18} ${MY + 2}`, stroke: O, sw: FACE - 0.5 },
];
const tongueMouth: Shape[] = [
  ...smile,
  { d: `M ${CX - 3} ${MY + 5} C ${CX - 5} ${MY + 22} ${CX + 15} ${MY + 22} ${CX + 12} ${MY + 3} Z`, fill: TONGUE, stroke: O, sw: 5 },
];

/* --------------------------------------------------------------------- body */

const BODY_D = 'M 106 176 L 194 176 C 206 196 214 220 212 238 C 210 252 198 256 184 256 L 116 256 C 102 256 90 252 88 238 C 86 220 94 196 106 176 Z';
const BODY_PATCH_D = 'M 84 196 C 114 190 142 204 138 228 C 135 246 112 252 84 250 Z';

const SHOULDER_L: Pt = [99, 208];
const SHOULDER_R: Pt = [201, 208];
const HAND_L: Pt = [82, 245];
const HAND_R: Pt = [218, 245];
const ARM_R = 13.5;
const HIP_L: Pt = [116, 242];
const HIP_R: Pt = [184, 242];
const LEG_R = 15;

/** A stubby leg: round at the hip (hidden behind the body), flat-footed on the ground. `from` set = just the hoof. */
const legD = (cx: number, from?: number) => {
  const top = from == null ? `M ${cx - LEG_R} ${HIP_L[1]} A ${LEG_R} ${LEG_R} 0 0 1 ${cx + LEG_R} ${HIP_L[1]}` : `M ${cx - LEG_R} ${from} L ${cx + LEG_R} ${from}`;
  return `${top} L ${cx + LEG_R} ${GROUND - 9} Q ${cx + LEG_R} ${GROUND} ${cx + LEG_R - 9} ${GROUND} L ${cx - LEG_R + 9} ${GROUND} Q ${cx - LEG_R} ${GROUND} ${cx - LEG_R} ${GROUND - 9} Z`;
};
const leg = (cx: number): Shape[] => [
  { d: legD(cx), fill: WHITE, stroke: O, sw: SW },
  { d: legD(cx, GROUND - 12), fill: SPOT, stroke: O, sw: SW },
];

const limb = (a: Pt, b: Pt, r: number, hoof: number): Shape[] => [
  { d: capsule(a, b, r), fill: WHITE, stroke: O, sw: SW },
  { d: capsule(a, b, r, hoof), fill: SPOT, stroke: O, sw: SW },
];

// Bag plus two teats as one outline, so the fat stroke does not swallow the teats.
const UDDER_D =
  'M 130 245 C 130 237 136 233 143 233 L 157 233 C 164 233 170 237 170 245 C 170 250 167 254 163.5 255 L 163.5 262 A 3.5 3.5 0 0 1 156.5 262 L 156.5 256 L 143.5 256 L 143.5 262 A 3.5 3.5 0 0 1 136.5 262 L 136.5 255 C 133 254 130 250 130 245 Z';

const TAIL_ROOT: Pt = [200, 232];
const TAIL_D = band(TAIL_ROOT, [238, 246], [264, 226], [251, 198], SW);
const TUFT_D = 'M 251 204 C 238 198 238 182 252 170 C 264 182 264 198 251 204 Z';

/* --------------------------------------------------------------------- skin */

const sticker: CowSkin = {
  id: 'sticker',
  name: 'Sticker',
  viewBox: { x: -37.5, y: 0, w: 375, h: 300 }, // same aspect as Classic
  headBox: { x: 12, y: 0, w: 276, h: 236 },
  clips: { skull: SKULL_D, body: BODY_D },

  parts: {
    tail: {
      shapes: [
        { d: TAIL_D, fill: O },
        { d: TUFT_D, fill: SPOT, stroke: O, sw: SW },
      ],
      pivot: TAIL_ROOT,
      mirror: true,
    },
    legBL: { shapes: leg(HIP_L[0]), pivot: HIP_L },
    legBR: { shapes: leg(HIP_R[0]), pivot: HIP_R },
    body: { shapes: [{ d: BODY_D, fill: WHITE }], pivot: [CX, 256] },
    patches: { shapes: [{ d: BODY_PATCH_D, fill: SPOT, clip: 'body' }], pivot: [CX, 256] },
    udder: {
      shapes: [
        { d: UDDER_D, fill: PINK, stroke: O, sw: SW },
      ],
      pivot: [CX, 238],
    },
    legFL: { shapes: limb(SHOULDER_L, HAND_L, ARM_R, 3), pivot: SHOULDER_L, mirror: true },
    legFR: { shapes: limb(SHOULDER_R, HAND_R, ARM_R, 3), pivot: SHOULDER_R },
    earL: { shapes: ear(-1), pivot: [sx(-1, 74), 111] },
    earR: { shapes: ear(1), pivot: [sx(1, 74), 111] },
    head: { shapes: head, pivot: NECK },
    eyes: { shapes: [], pivot: [CX, EYE_Y] },
    jaw: { shapes: [{ d: JAW_D, fill: PINK_DEEP, stroke: O, sw: SW }], pivot: [CX, 170] },
    muzzle: { shapes: muzzle, pivot: [CX, 166] },
    mouth: { shapes: [], pivot: [CX, MY] },
    brows: { shapes: [], pivot: [CX, BROW_Y] },
  },
  rootPivot: [CX, GROUND + 1],

  zOrder: [
    'tail',
    'legBL',
    'legBR',
    'body',
    'patches',
    { follows: 'body', shapes: [{ d: BODY_D, stroke: O, sw: SW }] }, // body outline over the patch
    'udder',
    'earL',
    'earR',
    'head',
    'eyes',
    'jaw',
    'muzzle',
    'mouth',
    'brows',
    'legFL',
    'legFR',
  ],

  eyes: {
    open: { shapes: openEyes, pupils: openPupils },
    wide: { shapes: wideEyes, pupils: widePupils },
    closed: { shapes: closedEyes },
    happy: { shapes: happyEyes },
    squint: { shapes: squintEyes, pupils: squintPupils },
    wonky: { shapes: wonkyEyes, pupils: wonkyPupils },
  },
  mouth: { smile, open: openMouth, flat: flatMouth, wavy: wavyMouth, tongue: tongueMouth },
  brows: {
    angry: [brow(EL, 5, -5), brow(ER, 5, -5)],
    worried: [brow(EL, -6, 3), brow(ER, -6, 3)],
    raised: [browArc(EL), browArc(ER)],
  },

  anchors: {
    headTop: [CX, HEAD.y + 2],
    eyeLine: [CX, EYE_Y],
    mouthPoint: [CX + 10, MY + 4],
    above: [CX, 24],
    eyeSpan: 50,
    headWidth: 96,
  },

  silhouette: [
    TAIL_D,
    TUFT_D,
    legD(HIP_L[0]),
    legD(HIP_R[0]),
    UDDER_D,
    BODY_D,
    capsule(SHOULDER_L, HAND_L, ARM_R),
    capsule(SHOULDER_R, HAND_R, ARM_R),
    earD(-1),
    earD(1),
    hornD(-1),
    hornD(1),
    SKULL_D,
    MUZZLE_D,
  ],
  headSilhouette: [earD(-1), earD(1), hornD(-1), hornD(1), SKULL_D, MUZZLE_D],
  fillRange: { top: 33, bottom: GROUND },
  headFillRange: { top: 33, bottom: 196 },
  ghostFace: [
    { d: ell(EL, EYE_Y + 1.5, 9.5, 12.5), fill: O },
    { d: ell(ER, EYE_Y + 1.5, 9.5, 12.5), fill: O },
    { d: ell(131, 160, 5.5, 7.5), fill: O },
    { d: ell(169, 160, 5.5, 7.5), fill: O },
    { d: smile[0].d, stroke: O, sw: FACE },
  ],

  armFallbackGain: 0.68,
};

export default sticker;
