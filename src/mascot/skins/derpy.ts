/**
 * Derpy: a goofy, lanky dairy cow. Side-on pot-bellied body on knobbly legs, a long
 * droopy front-facing face with an oversized muzzle, mismatched eyes that look two ways,
 * one ear up and one flopped, wonky horns and a tongue that will not stay in.
 * Pure data: paths in viewBox units, no React.
 */
import { colors } from '../../theme';
import type { CowSkin, Shape } from '../rig/types';

const O = colors.cowOutline;
const W = colors.cowWhite;
const SPOT = colors.cowSpot;
const PINK = colors.cowPink;
const PINK_DEEP = '#E58DA2';
const NOSTRIL = '#B95672';
const HORN = '#F4DFA4';
const MOUTH = '#8A3345';
const TONGUE = '#F0788E';
const TONGUE_LINE = '#C9516B';
const FAR = '#E9E6DC'; // far-side legs sit a step back
const HOOF = '#5A534B';

const SW = 5;
const FINE = 3.5;

const GROUND = 284;
const HIP_Y = 194;
const HX = 236; // head centre line

/** Ellipse as a closed path, optionally rotated (degrees). */
function ell(cx: number, cy: number, rx: number, ry: number, rot = 0): string {
  const a = (rot * Math.PI) / 180;
  const ux = Math.cos(a) * rx;
  const uy = Math.sin(a) * rx;
  const f = (n: number) => n.toFixed(1);
  return `M ${f(cx - ux)} ${f(cy - uy)} A ${rx} ${ry} ${rot} 1 0 ${f(cx + ux)} ${f(cy + uy)} A ${rx} ${ry} ${rot} 1 0 ${f(cx - ux)} ${f(cy - uy)} Z`;
}

/** Move a path made of absolute M / L / C / Q commands. */
function shift(d: string, dx: number, dy: number): string {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round((Number(n) + (i++ % 2 === 0 ? dx : dy)) * 10) / 10));
}

/* ------------------------------------------------------------------- body */

// Sway back, bony rump, pot belly.
const BODY_D =
  'M 58 140 C 52 112 78 96 102 102 C 126 108 148 120 172 108 C 198 96 226 110 226 140 C 226 162 218 180 204 190 C 190 228 112 234 86 206 C 66 196 60 168 58 140 Z';

const patches: Shape[] = [
  { d: 'M 96 96 C 122 96 148 108 150 128 C 152 148 132 156 114 150 C 96 146 84 122 96 96 Z', fill: SPOT, clip: 'body' },
  { d: 'M 50 126 C 66 118 86 130 86 148 C 86 164 68 170 52 164 Z', fill: SPOT, clip: 'body' },
  { d: 'M 126 190 C 134 176 156 178 158 194 C 160 210 142 222 128 214 C 120 208 120 198 126 190 Z', fill: SPOT, clip: 'body' },
];

const UDDER_D = shift('M 96 200 C 92 226 104 238 120 237 C 136 236 146 224 142 200 Z', 4, 8);
const TEAT_A = shift('M 103 230 C 101 240 103 246 107 246 C 111 246 113 240 111 232 Z', 4, 8);
const TEAT_B = shift('M 124 232 C 122 242 124 247 128 247 C 132 247 134 241 132 231 Z', 4, 8);

const TAIL_D = 'M 68 126 C 40 118 22 148 32 178 C 34 186 31 193 29 200 L 42 204 C 44 196 48 186 45 173 C 39 151 48 134 68 139 Z';
const TUFT_D = 'M 35 194 C 26 196 22 204 16 212 L 26 211 L 19 226 L 30 220 L 32 236 L 40 222 L 50 230 L 47 214 L 55 212 C 50 202 44 195 35 194 Z';

/**
 * A lanky leg: thin shank, knobbly knee, big hoof. `hip`, `knee`, `foot` are the x of
 * the centre line at the hip, knee (y 236) and hoof.
 */
function leg(hip: number, knee: number, foot: number) {
  const side = (s: 1 | -1) =>
    `L ${hip + s * 8.5} 200 L ${knee + s * 6.5} 224 C ${knee + s * 13} 228 ${knee + s * 13} 244 ${knee + s * 6} 247 L ${foot + s * 6} 268`;
  const left = side(-1);
  // right side, walked bottom to top
  const right = `L ${foot + 6} 268 L ${knee + 6} 247 C ${knee + 13} 244 ${knee + 13} 228 ${knee + 6.5} 224 L ${hip + 8.5} 200`;
  // The top is a half circle centred on the hip pivot, so a swinging leg never uncovers a corner.
  const closed = `M ${hip - 8.5} ${HIP_Y} ${left} ${right} L ${hip + 8.5} ${HIP_Y} A 8.5 8.5 0 0 0 ${hip - 8.5} ${HIP_Y} Z`;
  const openL = `M ${hip - 8.5} 200 ${left.slice(left.indexOf('L', 2))}`;
  const openR = `M ${foot + 6} 268 ${right.slice(right.indexOf('L', 2))}`;
  const hoof = `M ${foot - 9} 264 C ${foot - 15} 266 ${foot - 17} 278 ${foot - 15} ${GROUND} L ${foot + 17} ${GROUND} C ${foot + 20} 276 ${foot + 15} 265 ${foot + 8} 264 Z`;
  return { closed, openL, openR, hoof };
}

function nearLeg(hip: number, knee: number, foot: number): Shape[] {
  const l = leg(hip, knee, foot);
  return [
    { d: l.closed, fill: W },
    { d: l.openL, stroke: O, sw: SW },
    { d: l.openR, stroke: O, sw: SW },
    { d: l.hoof, fill: HOOF, stroke: O, sw: SW },
  ];
}
function farLeg(hip: number, knee: number, foot: number): Shape[] {
  const l = leg(hip, knee, foot);
  return [
    { d: l.closed, fill: FAR, stroke: O, sw: SW },
    { d: l.hoof, fill: '#48423C', stroke: O, sw: SW },
  ];
}

const LEGS = {
  BL: [82, 89, 75],
  BR: [114, 117, 111],
  FL: [172, 164, 177],
  FR: [204, 201, 209],
} as const;

/* ------------------------------------------------------------------- head */

const DROP = 13; // how far the muzzle hangs below where a sensible cow keeps it
const LIFT = -6;
const SKULL_D =
  'M 236 34 C 264 34 282 52 281 82 C 280 108 268 130 267 160 C 266 188 206 188 205 160 C 204 130 192 108 191 82 C 190 52 208 34 236 34 Z';
const MUZZLE_D = shift('M 236 116 C 268 115 290 132 290 154 C 290 177 266 188 236 188 C 206 188 182 177 182 154 C 182 132 204 115 236 116 Z', 0, DROP);
const CHIN_D = shift('M 208 164 C 208 184 222 191 237 191 C 252 191 266 184 266 164 Z', 0, DROP);

const HORN_L_D = shift('M 206 54 C 199 40 201 26 210 15 C 219 26 225 40 224 52 Z', 0, LIFT);
const HORN_R_D = shift('M 252 46 C 253 35 263 27 276 29 C 278 40 272 50 262 54 Z', 0, LIFT);
const HAIR_D = shift('M 222 50 C 218 38 222 30 229 36 C 229 26 238 24 240 34 C 246 28 254 34 250 50 Z', 0, LIFT);

// Left ear stands up, right ear has given up.
const EAR_L_D = shift('M 208 78 C 188 80 166 64 160 38 C 184 34 206 44 216 64 Z', 0, LIFT);
const EAR_L_IN = shift('M 202 68 C 190 66 178 58 172 46 C 186 46 198 54 204 64 Z', 0, LIFT);
const EAR_R_D = shift('M 262 62 C 278 48 302 56 308 80 C 311 96 306 110 298 116 C 288 106 284 92 268 82 Z', 0, LIFT);
const EAR_R_IN = shift('M 280 66 C 292 64 300 76 300 98 C 292 90 288 80 278 76 Z', 0, LIFT);

const EYE_PATCH_D = 'M 244 30 C 272 30 290 56 285 88 C 281 104 262 108 250 100 C 238 90 236 56 244 30 Z';

/* eyes: big one on the left, small one on the right */
const LX = 215;
const LY = 83;
const RX = 256;
const RY = 77;

const openEyes: Shape[] = [
  { d: ell(LX, LY, 16, 18), fill: W, stroke: O, sw: FINE },
  { d: ell(RX, RY, 10.5, 11.5), fill: W, stroke: O, sw: FINE },
];
const openPupils: Shape[] = [
  { d: ell(LX + 5, LY + 6.5, 7.5, 7.5), fill: O },
  { d: ell(LX + 2.5, LY + 4, 2.5, 2.5), fill: W },
  { d: ell(RX + 2.5, RY - 4, 5, 5), fill: O },
  { d: ell(RX + 1, RY - 5.5, 1.7, 1.7), fill: W },
];

const wideEyes: Shape[] = [
  { d: ell(LX - 1, LY - 2, 19, 21), fill: W, stroke: O, sw: FINE },
  { d: ell(RX + 1, RY - 1, 13.5, 14.5), fill: W, stroke: O, sw: FINE },
];
const widePupils: Shape[] = [
  { d: ell(LX + 2, LY + 2, 4, 4), fill: O },
  { d: ell(RX + 3, RY - 5, 3, 3), fill: O },
];

const arc = (cx: number, cy: number, r: number, dip: number) => `M ${cx - r} ${cy} Q ${cx} ${cy + dip} ${cx + r} ${cy}`;
const darkLine = (d: string, sw = 4.5): Shape[] => [{ d, stroke: O, sw }];
/** The right eye sits on the black patch, so its lines are drawn in white. */
const haloLine = (d: string, sw = 4.5): Shape[] => [{ d, stroke: W, sw }];

const closedEyes: Shape[] = [...darkLine(arc(LX, LY, 14, 13)), ...haloLine(arc(RX, RY + 1, 9, 9))];
const happyEyes: Shape[] = [...darkLine(arc(LX, LY + 5, 14, -17)), ...haloLine(arc(RX, RY + 4, 9, -12))];

const half = (cx: number, cy: number, r: number, drop: number, tilt: number) =>
  `M ${cx - r} ${cy - tilt} L ${cx + r} ${cy + tilt} C ${cx + r} ${cy + drop + tilt} ${cx - r} ${cy + drop - tilt} ${cx - r} ${cy - tilt} Z`;
const squintEyes: Shape[] = [
  { d: half(LX, LY, 15, 19, 2), fill: W, stroke: O, sw: FINE },
  ...darkLine(`M ${LX - 17} ${LY - 2.5} L ${LX + 17} ${LY + 2.5}`, 5),
  { d: half(RX, RY + 1, 10, 12, -2), fill: W, stroke: O, sw: FINE },
];
const squintPupils: Shape[] = [
  { d: ell(LX + 4, LY + 7, 5, 5), fill: O },
  { d: ell(RX + 2, RY + 4.5, 3.4, 3.4), fill: O },
];

/** Dizzy spiral eye. */
function spiral(cx: number, cy: number, r: number, turns: number, dir: 1 | -1): string {
  const pts: string[] = [];
  const n = Math.round(turns * 14);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = dir * u * turns * Math.PI * 2;
    const rr = r * u;
    pts.push(`${i === 0 ? 'M' : 'L'} ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(' ');
}
const wonkyEyes: Shape[] = [
  { d: ell(LX, LY, 16, 18), fill: W, stroke: O, sw: FINE },
  { d: spiral(LX, LY, 11, 2.25, 1), stroke: O, sw: 3 },
  { d: ell(RX, RY, 11.5, 12.5), fill: W, stroke: O, sw: FINE },
  { d: spiral(RX, RY, 7.5, 1.75, -1), stroke: O, sw: 2.6 },
];

/* brows: short thick strokes, haloed so the right one shows on the patch */
const brow = (x0: number, y0: number, x1: number, y1: number, line = darkLine): Shape[] => line(`M ${x0} ${y0} L ${x1} ${y1}`, 5);
const brows = {
  angry: [...brow(LX - 14, LY - 30, LX + 12, LY - 21), ...brow(RX - 9, RY - 15, RX + 10, RY - 23, haloLine)],
  worried: [...brow(LX - 14, LY - 22, LX + 10, LY - 31), ...brow(RX - 8, RY - 24, RX + 11, RY - 16, haloLine)],
  raised: [
    ...darkLine(`M ${LX - 14} ${LY - 28} Q ${LX} ${LY - 39} ${LX + 13} ${LY - 29}`, 5),
    ...haloLine(`M ${RX - 9} ${RY - 17} Q ${RX + 1} ${RY - 23} ${RX + 10} ${RY - 17}`, 5),
  ],
};

/* mouths, drawn on the muzzle */
const m = (d: string) => shift(d, 0, DROP);
const SMILE_D = m('M 210 163 C 220 176 246 178 262 162');
const smile: Shape[] = [
  { d: SMILE_D, stroke: O, sw: 4 },
  { d: m('M 207 160 L 212 165'), stroke: O, sw: 4 },
  // the tongue that lolls out of the corner
  { d: m('M 247 170 C 245 186 250 198 259 197 C 268 196 270 182 262 164 Z'), fill: TONGUE, stroke: O, sw: FINE },
  { d: m('M 256 176 C 256 182 257 186 258 189'), stroke: TONGUE_LINE, sw: 2.2 },
];
const tongue: Shape[] = [
  { d: m('M 214 160 C 222 172 250 172 258 160 Z'), fill: MOUTH, stroke: O, sw: FINE },
  { d: m('M 224 166 C 220 190 226 208 238 208 C 250 208 254 190 249 166 Z'), fill: TONGUE, stroke: O, sw: FINE },
  { d: m('M 237 174 C 236 184 237 192 238 198'), stroke: TONGUE_LINE, sw: 2.4 },
];
const open: Shape[] = [
  { d: m('M 212 158 C 214 186 258 188 261 157 C 244 162 228 162 212 158 Z'), fill: MOUTH, stroke: O, sw: FINE },
  { d: m('M 224 161 L 225 170 L 235 170 L 235 162 Z'), fill: W, stroke: O, sw: 2.5 },
  { d: m('M 228 180 C 232 170 250 170 254 176 C 250 183 238 184 228 180 Z'), fill: TONGUE },
];
const flat: Shape[] = [
  { d: m('M 212 167 L 260 163'), stroke: O, sw: 4 },
  // one snaggle tooth
  { d: m('M 242 165 L 243 174 L 252 173 L 251 164 Z'), fill: W, stroke: O, sw: 2.5 },
];
const wavy: Shape[] = [
  { d: m('M 210 166 C 216 158 222 172 230 165 C 238 158 244 172 252 164 C 256 160 260 164 262 167'), stroke: O, sw: 4 },
  { d: m('M 252 166 C 251 174 254 179 258 178 C 262 177 262 171 259 165 Z'), fill: TONGUE, stroke: O, sw: 3 },
];

const nostrils: Shape[] = [
  { d: ell(221, 141 + DROP, 5.5, 8, 14), fill: NOSTRIL },
  { d: ell(251, 139 + DROP, 4, 6, -16), fill: NOSTRIL },
];

/* ------------------------------------------------------------------- skin */

const derpy: CowSkin = {
  id: 'derpy',
  name: 'Derpy',
  viewBox: { x: -22, y: -14, w: 372, h: 300 },
  headBox: { x: 122, y: -22, w: 228, h: 252 },
  clips: { body: BODY_D, skull: SKULL_D },

  parts: {
    tail: {
      shapes: [
        { d: TAIL_D, fill: W, stroke: O, sw: SW },
        { d: TUFT_D, fill: SPOT, stroke: O, sw: SW },
      ],
      pivot: [64, 132],
    },
    legBR: { shapes: farLeg(...LEGS.BR), pivot: [LEGS.BR[0], HIP_Y] },
    legFR: { shapes: farLeg(...LEGS.FR), pivot: [LEGS.FR[0], HIP_Y] },
    udder: {
      shapes: [
        { d: TEAT_A, fill: PINK, stroke: O, sw: FINE },
        { d: TEAT_B, fill: PINK, stroke: O, sw: FINE },
        { d: UDDER_D, fill: PINK, stroke: O, sw: SW },
      ],
      pivot: [124, 214],
    },
    body: { shapes: [{ d: BODY_D, fill: W }], pivot: [140, 222] },
    patches: { shapes: patches, pivot: [140, 222] },
    legBL: { shapes: nearLeg(...LEGS.BL), pivot: [LEGS.BL[0], HIP_Y] },
    legFL: { shapes: nearLeg(...LEGS.FL), pivot: [LEGS.FL[0], HIP_Y] },
    earL: {
      shapes: [
        { d: EAR_L_D, fill: W, stroke: O, sw: SW },
        { d: EAR_L_IN, fill: PINK },
      ],
      pivot: [206, 64],
    },
    earR: {
      shapes: [
        { d: EAR_R_D, fill: SPOT, stroke: O, sw: SW },
        { d: EAR_R_IN, fill: PINK_DEEP },
      ],
      pivot: [266, 64],
    },
    head: {
      shapes: [
        { d: HORN_L_D, fill: HORN, stroke: O, sw: SW },
        { d: HORN_R_D, fill: HORN, stroke: O, sw: SW },
        { d: HAIR_D, fill: W, stroke: O, sw: SW },
        { d: SKULL_D, fill: W },
        { d: EYE_PATCH_D, fill: SPOT, clip: 'skull' },
        { d: SKULL_D, stroke: O, sw: SW },
      ],
      pivot: [214, 132],
    },
    eyes: { shapes: [], pivot: [HX, 81] },
    jaw: {
      shapes: [
        { d: CHIN_D, fill: PINK, stroke: O, sw: SW },
        { d: ell(HX, 173 + DROP, 22, 8), fill: MOUTH },
      ],
      pivot: [HX, 168 + DROP],
    },
    muzzle: { shapes: [{ d: MUZZLE_D, fill: PINK, stroke: O, sw: SW }, ...nostrils], pivot: [HX, 150 + DROP] },
    mouth: { shapes: [], pivot: [HX, 166 + DROP] },
    brows: { shapes: [], pivot: [HX, 54] },
  },
  rootPivot: [142, GROUND],

  zOrder: [
    'tail',
    'legBR',
    'legFR',
    'udder',
    'body',
    'patches',
    { follows: 'body', shapes: [{ d: BODY_D, stroke: O, sw: SW }] },
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
    open: { shapes: openEyes, pupils: openPupils },
    wide: { shapes: wideEyes, pupils: widePupils },
    closed: { shapes: closedEyes },
    happy: { shapes: happyEyes },
    squint: { shapes: squintEyes, pupils: squintPupils },
    wonky: { shapes: wonkyEyes },
  },
  mouth: { smile, open, flat, tongue, wavy },
  brows,

  anchors: {
    headTop: [HX, 38],
    eyeLine: [HX, 80],
    mouthPoint: [246, 170 + DROP],
    above: [HX + 4, -8],
    eyeSpan: 41,
    headWidth: 88,
  },

  silhouette: [
    BODY_D,
    UDDER_D,
    TEAT_A,
    TEAT_B,
    TAIL_D,
    TUFT_D,
    ...Object.values(LEGS).flatMap((l) => {
      const p = leg(l[0], l[1], l[2]);
      return [p.closed, p.hoof];
    }),
    SKULL_D,
    MUZZLE_D,
    CHIN_D,
    EAR_L_D,
    EAR_R_D,
    HORN_L_D,
    HORN_R_D,
    HAIR_D,
  ],
  headSilhouette: [SKULL_D, MUZZLE_D, CHIN_D, EAR_L_D, EAR_R_D, HORN_L_D, HORN_R_D, HAIR_D],
  fillRange: { top: 9, bottom: GROUND },
  headFillRange: { top: 9, bottom: 191 + DROP },
  // Front legs stand in for arms: keep the raised hoof below the big muzzle so it stays visible.
  armFallbackGain: 0.42,
  ghostFace: [
    { d: ell(LX + 3, LY + 4, 8, 8), fill: O },
    { d: ell(RX + 2, RY - 2, 5.5, 5.5), fill: O },
    ...nostrils.map((n) => ({ d: n.d, fill: O })),
    { d: SMILE_D, stroke: O, sw: 4 },
  ],
};

export default derpy;
