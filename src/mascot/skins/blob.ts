/**
 * Blob Moo: a chunky, squishy dairy cow. A round bean of a body on four stubby legs with
 * a head almost as big as the rest of her, tiny wide-set dot eyes and a small pink muzzle.
 * Side-on body facing right, face turned to the viewer.
 *
 * All four legs sit BEHIND the body so they can swing freely without opening a gap.
 */
import { colors } from '../../theme';
import type { CowSkin, Pt, Shape } from '../rig/types';

const O = colors.cowOutline;
const WHITE = colors.cowWhite;
const SPOT = colors.cowSpot;
const PINK = colors.cowPink;
const PINK_DEEP = '#E58DA2';
const SHADE = '#E2DDD0'; // far legs
const HORN = '#F4DFA4';
const MOUTH = '#8A3345';
const TONGUE = '#F0788E';

const SW = 7; // the one outline weight
const FINE = 5; // face details

const n = (v: number) => Math.round(v * 10) / 10;

/** Ellipse as a path. */
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${n(cx - rx)} ${n(cy)} A ${rx} ${ry} 0 1 0 ${n(cx + rx)} ${n(cy)} A ${rx} ${ry} 0 1 0 ${n(cx - rx)} ${n(cy)} Z`;

/** A soft four-arc blob: separate roundness for the top and bottom halves. */
function blobPath(cx: number, top: number, bottom: number, left: number, right: number, midY: number, kT: number, kB: number): string {
  const rl = cx - left;
  const rr = right - cx;
  const rt = midY - top;
  const rb = bottom - midY;
  return [
    `M ${cx} ${top}`,
    `C ${n(cx + rr * kT)} ${top} ${right} ${n(midY - rt * kT)} ${right} ${midY}`,
    `C ${right} ${n(midY + rb * kB)} ${n(cx + rr * kB)} ${bottom} ${cx} ${bottom}`,
    `C ${n(cx - rl * kB)} ${bottom} ${left} ${n(midY + rb * kB)} ${left} ${midY}`,
    `C ${left} ${n(midY - rt * kT)} ${n(cx - rl * kT)} ${top} ${cx} ${top}`,
    'Z',
  ].join(' ');
}

/** Mirror path data around the head centre line (absolute M / L / C / Q / Z commands only). */
function mirrorX(d: string, axis: number): string {
  const tokens = d.split(/\s+/);
  let isX = true;
  return tokens
    .map((tok) => {
      if (/^[A-Za-z]$/.test(tok)) {
        isX = true;
        return tok;
      }
      const out = isX ? String(n(2 * axis - Number(tok))) : tok;
      isX = !isX;
      return out;
    })
    .join(' ');
}

/* ------------------------------------------------------------------ layout */

const GROUND = 250;
const HX = 200; // head centre line
const EYE_Y = 137;
const EYE_DX = 44;
const EL = HX - EYE_DX;
const ER = HX + EYE_DX;

const BODY_D = blobPath(131, 84, 220, 34, 228, 158, 0.58, 0.66);
const HEAD_D = blobPath(HX, 56, 198, 118, 282, 134, 0.6, 0.68);

/* -------------------------------------------------------------------- body */

const body: Shape[] = [{ d: BODY_D, fill: WHITE }];
const patches: Shape[] = [
  { d: 'M 30 124 C 28 98 56 70 92 76 C 116 80 118 104 102 120 C 88 134 62 146 46 142 C 36 139 31 133 30 124 Z', fill: SPOT, clip: 'body' },
  { d: 'M 30 196 C 32 180 50 172 64 178 C 78 184 82 200 74 212 C 66 224 44 226 34 216 C 30 211 29 204 30 196 Z', fill: SPOT, clip: 'body' },
];
const bodyOutline: Shape[] = [{ d: BODY_D, stroke: O, sw: SW }];

const UDDER_D = 'M 114 204 C 110 224 116 236 124 236 C 124 244 133 244 133 236 L 137 236 C 137 244 146 244 146 236 C 154 236 160 224 156 204 Z';
const udder: Shape[] = [
  {
    d: UDDER_D,
    fill: PINK,
    stroke: O,
    sw: FINE + 1,
  },
];

/* -------------------------------------------------------------------- legs */

/** A stubby peg: slightly narrower at the top, rounded foot, dark hoof. */
function legD(cx: number, w: number, top: number, bottom: number): string {
  const h = w / 2;
  const t = h - 4;
  return [
    `M ${n(cx - t)} ${top + 8}`,
    `Q ${n(cx - t)} ${top} ${n(cx - t + 8)} ${top}`,
    `L ${n(cx + t - 8)} ${top}`,
    `Q ${n(cx + t)} ${top} ${n(cx + t)} ${top + 8}`,
    `L ${n(cx + h)} ${bottom - 10}`,
    `Q ${n(cx + h)} ${bottom} ${n(cx + h - 10)} ${bottom}`,
    `L ${n(cx - h + 10)} ${bottom}`,
    `Q ${n(cx - h)} ${bottom} ${n(cx - h)} ${bottom - 10}`,
    'Z',
  ].join(' ');
}
function hoofD(cx: number, w: number, bottom: number): string {
  const h = w / 2;
  return [
    `M ${n(cx - h)} ${bottom - 12}`,
    `L ${n(cx + h)} ${bottom - 12}`,
    `L ${n(cx + h)} ${bottom - 10}`,
    `Q ${n(cx + h)} ${bottom} ${n(cx + h - 10)} ${bottom}`,
    `L ${n(cx - h + 10)} ${bottom}`,
    `Q ${n(cx - h)} ${bottom} ${n(cx - h)} ${bottom - 10}`,
    'Z',
  ].join(' ');
}
function leg(cx: number, w: number, bottom: number, fill: string): { shapes: Shape[]; sil: string; pivot: Pt } {
  const d = legD(cx, w, 198, bottom);
  return {
    shapes: [
      { d, fill, stroke: O, sw: SW },
      { d: hoofD(cx, w, bottom), fill: SPOT, stroke: O, sw: SW },
    ],
    sil: d,
    pivot: [cx, 214],
  };
}
const legBL = leg(80, 36, GROUND, WHITE);
const legFL = leg(190, 36, GROUND, WHITE);
const legBR = leg(108, 32, GROUND - 4, SHADE);
const legFR = leg(162, 32, GROUND - 4, SHADE);

/* -------------------------------------------------------------------- tail */

const TAIL_LINE = 'M 46 148 C 30 148 21 138 21 124';
const TUFT_D = 'M 21 130 C 8 124 6 105 19 92 C 32 104 35 123 21 130 Z';
const tail: Shape[] = [
  { d: TAIL_LINE, stroke: O, sw: SW },
  { d: TUFT_D, fill: SPOT, stroke: O, sw: SW },
];
const TAIL_SIL = 'M 46 143 C 34 143 26 136 26 124 L 16 124 C 16 142 30 153 46 153 Z';

/* -------------------------------------------------------------------- head */

const HORN_L = 'M 142 78 C 135 67 136 56 143 52 C 148 49 154 52 157 57 C 161 63 166 66 170 72 Z';
const HORN_R = mirrorX(HORN_L, HX);
const EAR_L = 'M 132 90 C 114 84 92 98 88 120 C 86 134 97 139 107 131 C 117 122 130 118 138 108 Z';
const EAR_L_IN = 'M 120 98 C 110 99 100 108 98 119 C 98 125 102 125 106 121 C 112 115 118 111 124 106 Z';
const EAR_R = mirrorX(EAR_L, HX);
const EAR_R_IN = mirrorX(EAR_L_IN, HX);

const TUFT_HAIR = `M ${HX - 16} 66 C ${HX - 22} 49 ${HX - 9} 38 ${HX - 1} 48 C ${HX + 6} 36 ${HX + 22} 44 ${HX + 16} 66 Z`;
const earL: Shape[] = [
  { d: EAR_L, fill: WHITE, stroke: O, sw: SW },
  { d: EAR_L_IN, fill: PINK },
];
const earR: Shape[] = [
  { d: EAR_R, fill: SPOT, stroke: O, sw: SW },
  { d: EAR_R_IN, fill: PINK },
];

const head: Shape[] = [
  { d: HORN_L, fill: HORN, stroke: O, sw: SW },
  { d: HORN_R, fill: HORN, stroke: O, sw: SW },
  { d: TUFT_HAIR, fill: WHITE, stroke: O, sw: SW },
  { d: HEAD_D, fill: WHITE },
  { d: 'M 226 40 C 222 66 238 92 262 100 C 278 105 292 98 298 84 L 298 40 Z', fill: SPOT, clip: 'head' },
  { d: HEAD_D, stroke: O, sw: SW },
  { d: ell(EL - 8, EYE_Y + 19, 10, 6), fill: PINK, opacity: 0.85 },
  { d: ell(ER + 8, EYE_Y + 19, 10, 6), fill: PINK, opacity: 0.85 },
];

const MUZ_Y = 161;
const MUZZLE_D = ell(HX, MUZ_Y, 31, 21);
const muzzle: Shape[] = [
  { d: MUZZLE_D, fill: PINK, stroke: O, sw: FINE + 1 },
  { d: ell(HX - 11, MUZ_Y - 8, 3, 4), fill: O },
  { d: ell(HX + 11, MUZ_Y - 8, 3, 4), fill: O },
];
const jaw: Shape[] = [{ d: ell(HX, MUZ_Y + 3, 22, 16), fill: PINK_DEEP, stroke: O, sw: FINE }];

/* -------------------------------------------------------------------- eyes */

const DOT = 9;
const dot = (cx: number, cy: number, r: number): Shape => ({ d: ell(cx, cy, r, r), fill: O });
const glint = (cx: number, cy: number, r: number): Shape => ({ d: ell(cx, cy, r, r), fill: WHITE });
const line = (d: string, sw = FINE + 1): Shape => ({ d, stroke: O, sw });

const openPupils: Shape[] = [dot(EL, EYE_Y, DOT), glint(EL - 3, EYE_Y - 3, 2.8), dot(ER, EYE_Y, DOT), glint(ER - 3, EYE_Y - 3, 2.8)];
const closedEyes: Shape[] = [EL, ER].map((cx) => line(`M ${cx - 10} ${EYE_Y - 1} Q ${cx} ${EYE_Y + 9} ${cx + 10} ${EYE_Y - 1}`));
const happyEyes: Shape[] = [EL, ER].map((cx) => line(`M ${cx - 10} ${EYE_Y + 4} Q ${cx} ${EYE_Y - 11} ${cx + 10} ${EYE_Y + 4}`));
const wideEyes: Shape[] = [EL, ER].map((cx) => ({ d: ell(cx, EYE_Y - 1, 14, 15), fill: WHITE, stroke: O, sw: FINE }));
const widePupils: Shape[] = [dot(EL, EYE_Y - 1, 4.5), dot(ER, EYE_Y - 1, 4.5)];
const squintEyes: Shape[] = [EL, ER].flatMap((cx) => [
  { d: `M ${cx - 9} ${EYE_Y - 1} L ${cx + 9} ${EYE_Y - 1} C ${cx + 9} ${EYE_Y + 10} ${cx - 9} ${EYE_Y + 10} ${cx - 9} ${EYE_Y - 1} Z`, fill: O },
  line(`M ${cx - 12} ${EYE_Y - 2} L ${cx + 12} ${EYE_Y - 2}`),
]);
const wonkyEyes: Shape[] = [{ d: ell(EL, EYE_Y - 2, 15, 16), fill: WHITE, stroke: O, sw: FINE }];
const wonkyPupils: Shape[] = [dot(EL + 5, EYE_Y + 4, 4.5), dot(ER + 2, EYE_Y + 3, 6), glint(ER, EYE_Y + 1, 2)];

/* ------------------------------------------------------------------ mouths */

const MY = MUZ_Y + 6; // mouth line
const smile: Shape[] = [line(`M ${HX - 10} ${MY - 1} Q ${HX} ${MY + 10} ${HX + 10} ${MY - 1}`, FINE)];
const flat: Shape[] = [line(`M ${HX - 9} ${MY + 3} L ${HX + 9} ${MY + 3}`, FINE)];
const wavy: Shape[] = [line(`M ${HX - 13} ${MY + 4} Q ${HX - 8.5} ${MY - 3} ${HX - 4} ${MY + 3} Q ${HX} ${MY + 9} ${HX + 4} ${MY + 3} Q ${HX + 8.5} ${MY - 3} ${HX + 13} ${MY + 4}`, FINE)];
const openD = `M ${HX - 11} ${MY - 2} L ${HX + 11} ${MY - 2} C ${HX + 11} ${MY + 13} ${HX - 11} ${MY + 13} ${HX - 11} ${MY - 2} Z`;
const open: Shape[] = [
  { d: openD, fill: MOUTH, stroke: O, sw: FINE - 1 },
  { d: `M ${HX - 6} ${MY + 7} C ${HX - 3} ${MY + 3} ${HX + 3} ${MY + 3} ${HX + 6} ${MY + 7} C ${HX + 3} ${MY + 10} ${HX - 3} ${MY + 10} ${HX - 6} ${MY + 7} Z`, fill: TONGUE },
];
const tongue: Shape[] = [
  { d: `M ${HX - 6} ${MY + 3} L ${HX - 6} ${MY + 11} C ${HX - 6} ${MY + 20} ${HX + 6} ${MY + 20} ${HX + 6} ${MY + 11} L ${HX + 6} ${MY + 3} Z`, fill: TONGUE, stroke: O, sw: FINE - 1 },
  line(`M ${HX} ${MY + 6} L ${HX} ${MY + 11}`, 2.5),
  ...smile,
];

/* ------------------------------------------------------------------- brows */

const BROW_Y = EYE_Y - 20;
const brow = (x1: number, y1: number, x2: number, y2: number): Shape => line(`M ${x1} ${y1} L ${x2} ${y2}`);
const brows = {
  angry: [brow(EL - 10, BROW_Y - 4, EL + 9, BROW_Y + 4), brow(ER + 10, BROW_Y - 4, ER - 9, BROW_Y + 4)],
  worried: [brow(EL - 10, BROW_Y + 3, EL + 9, BROW_Y - 5), brow(ER + 10, BROW_Y + 3, ER - 9, BROW_Y - 5)],
  raised: [EL, ER].map((cx) => line(`M ${cx - 10} ${BROW_Y - 4} Q ${cx} ${BROW_Y - 12} ${cx + 10} ${BROW_Y - 4}`)),
};

/* -------------------------------------------------------------------- skin */

const blob: CowSkin = {
  id: 'blob',
  name: 'Blob',
  viewBox: { x: 0, y: 0, w: 320, h: 256 },
  headBox: { x: 84, y: 0, w: 232, h: 232 },
  clips: { body: BODY_D, head: HEAD_D },

  parts: {
    tail: { shapes: tail, pivot: [46, 148] },
    legBR: { shapes: legBR.shapes, pivot: legBR.pivot },
    legFR: { shapes: legFR.shapes, pivot: legFR.pivot },
    udder: { shapes: udder, pivot: [135, 214] },
    legBL: { shapes: legBL.shapes, pivot: legBL.pivot },
    legFL: { shapes: legFL.shapes, pivot: legFL.pivot },
    body: { shapes: body, pivot: [131, 222] },
    patches: { shapes: patches, pivot: [131, 222] },
    earL: { shapes: earL, pivot: [130, 100] },
    earR: { shapes: earR, pivot: [270, 100] },
    head: { shapes: head, pivot: [178, 188] },
    eyes: { shapes: [], pivot: [HX, EYE_Y] },
    jaw: { shapes: jaw, pivot: [HX, MUZ_Y] },
    muzzle: { shapes: muzzle, pivot: [HX, MUZ_Y] },
    mouth: { shapes: [], pivot: [HX, MY] },
    brows: { shapes: [], pivot: [HX, BROW_Y] },
  },
  rootPivot: [136, GROUND],

  zOrder: ['tail', 'legBR', 'legFR', 'udder', 'legBL', 'legFL', 'body', 'patches', { follows: 'body', shapes: bodyOutline }, 'earL', 'earR', 'head', 'eyes', 'jaw', 'muzzle', 'mouth', 'brows'],

  eyes: {
    open: { shapes: [], pupils: openPupils },
    closed: { shapes: closedEyes },
    wide: { shapes: wideEyes, pupils: widePupils },
    squint: { shapes: squintEyes },
    wonky: { shapes: wonkyEyes, pupils: wonkyPupils },
    happy: { shapes: happyEyes },
  },
  mouth: { smile, open, flat, tongue, wavy },
  brows,

  anchors: {
    headTop: [HX, 60],
    eyeLine: [HX, EYE_Y],
    mouthPoint: [HX + 10, MY + 3],
    above: [HX + 6, 22],
    eyeSpan: 58,
    headWidth: 92,
  },

  silhouette: [BODY_D, HEAD_D, TUFT_HAIR, EAR_L, EAR_R, HORN_L, HORN_R, legBL.sil, legFL.sil, legBR.sil, legFR.sil, UDDER_D, TAIL_SIL, TUFT_D],
  headSilhouette: [HEAD_D, EAR_L, EAR_R, HORN_L, HORN_R, TUFT_HAIR],
  fillRange: { top: 40, bottom: GROUND },
  headFillRange: { top: 40, bottom: 198 },
  ghostFace: [
    dot(EL, EYE_Y, DOT),
    dot(ER, EYE_Y, DOT),
    { d: ell(HX - 11, MUZ_Y - 8, 3, 4), fill: O },
    { d: ell(HX + 11, MUZ_Y - 8, 3, 4), fill: O },
    ...smile,
  ],
};

export default blob;
