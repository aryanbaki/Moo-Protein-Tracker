/**
 * Attitude: a deadpan Holstein. Side-on body with a deep chest and bony hips, long face
 * turned to the viewer, black mask with a white blaze, big ears held out sideways, and
 * half-lidded eyes that are not impressed by your protein total.
 *
 * Pure data (see ../rig/types.ts). All numbers are viewBox units.
 */
import { colors } from '../../theme';
import type { CowSkin, Shape } from '../rig/types';

const O = colors.cowOutline;
const WHITE = colors.cowWhite;
const SPOT = colors.cowSpot;
const PINK = colors.cowPink;
/* Colours the theme has no token for. */
const SHADE = '#E2DDD0'; // far-side legs
const HORN = '#F4DFA4';
const HOOF = '#5A534B';
const LID = '#565B55'; // eyelids, so they read on the black mask
const MOUTH = '#8A3345';
const TONGUE = '#F0788E';
const TAG = '#F7C948';

const SW = 5;
const FINE = 3.5;

const HX = 234; // head centre line
const EY = 85; // eye centre height
const EDX = 18.5; // eye centres are HX -/+ EDX
const GROUND = 244;

const n = (v: number) => Math.round(v * 100) / 100;

/** Ellipse as a closed path. */
function ell(cx: number, cy: number, rx: number, ry: number, rot = 0): string {
  const a = (rot * Math.PI) / 180;
  const dx = rx * Math.cos(a);
  const dy = rx * Math.sin(a);
  return `M ${n(cx - dx)} ${n(cy - dy)} A ${rx} ${ry} ${rot} 1 0 ${n(cx + dx)} ${n(cy + dy)} A ${rx} ${ry} ${rot} 1 0 ${n(cx - dx)} ${n(cy - dy)} Z`;
}

/**
 * The part of an ellipse on one side of a straight lid line.
 * `yl` / `yr` are the line's height at the ellipse's left / right edge; `below` picks the side.
 */
function cut(cx: number, cy: number, rx: number, ry: number, yl: number, yr: number, below: boolean): string {
  const at = (y: number, s: 1 | -1) => {
    const k = Math.max(-1, Math.min(1, (y - cy) / ry));
    return [n(cx + s * rx * Math.sqrt(1 - k * k)), n(y)] as const;
  };
  const [lx, ly] = at(yl, -1);
  const [rx2, ry2] = at(yr, 1);
  // From the left point to the right one: clockwise (sweep 1) goes over the top.
  const large = below ? ((yl + yr) / 2 < cy ? 1 : 0) : (yl + yr) / 2 > cy ? 1 : 0;
  return `M ${lx} ${ly} A ${rx} ${ry} 0 ${large} ${below ? 0 : 1} ${rx2} ${ry2} Z`;
}

/* ------------------------------------------------------------------ body */

/** Withers, a dipped back, a sharp hook bone, sloping rump, deep barrel and brisket. */
const BODY_D =
  'M 224 104 C 212 92 196 89 180 94 C 158 101 132 103 110 97 C 100 94 92 87 82 86 C 76 85.5 71 87 67 90.5 C 60 95 54 99 49 105 ' +
  'C 43 110 40 118 41 128 C 42 148 48 166 62 178 C 82 192 120 196 150 194 C 180 192 212 196 233 187 ' +
  'C 250 179 256 160 253 140 C 250 122 240 110 224 104 Z';

const PATCH_SADDLE =
  'M 112 80 C 130 92 150 96 170 88 C 180 96 184 112 178 126 C 174 138 164 146 152 142 C 142 138 136 146 124 150 ' +
  'C 110 152 100 142 102 128 C 104 118 98 110 100 100 C 101 92 106 84 112 80 Z';
const PATCH_RUMP = 'M 30 90 L 70 82 C 80 92 86 104 82 118 C 78 132 66 138 60 150 C 56 158 48 160 34 158 Z';
const PATCH_BELLY = 'M 140 174 C 150 167 165 171 165 182 C 165 196 152 204 142 202 C 134 194 134 182 140 174 Z';

const TAIL_D = 'M 54 99 C 33 92 19 113 21 142 C 22 158 23 166 21 178 L 31 180 C 34 166 32.5 156 31.5 142 C 30.5 123 38 113 52 113 Z';
const TAIL_TUFT_D = 'M 27 172 C 39 182 38 202 25 211 C 14 201 15 182 27 172 Z';

const UDDER_D = 'M 100 186 C 98 204 108 212 120 212 C 132 212 140 204 138 186 Z';
const TEATS = [ell(111, 210, 4, 6), ell(127, 210, 4, 6)];

/* Legs. Near legs are open at the top so they melt into the body. */
const FRONT_NEAR = { x0: 199, x1: 222, top: 168, knee: 212, bottom: GROUND };
const FRONT_FAR = { x0: 174, x1: 195, top: 172, knee: 208, bottom: GROUND - 7 };

function frontLegD(l: typeof FRONT_NEAR, closed: boolean, from = l.top): string {
  const { x0, x1, knee, bottom } = l;
  // Straight column with a slight knee, narrowing to the fetlock, flaring into the hoof.
  return (
    `M ${x0} ${from} L ${x0 + 2} ${knee - 8} C ${x0 + 1} ${knee} ${x0 + 4} ${knee + 6} ${x0 + 4} ${bottom - 15} L ${x0 + 1} ${bottom - 4} Q ${x0 + 1} ${bottom} ${x0 + 5} ${bottom} ` +
    `L ${x1 - 3} ${bottom} Q ${x1 + 1} ${bottom} ${x1 + 1} ${bottom - 4} L ${x1 - 3} ${bottom - 15} C ${x1 - 3} ${knee + 6} ${x1 - 1} ${knee} ${x1 - 1} ${knee - 8} L ${x1} ${from}${closed ? ' Z' : ''}`
  );
}
function frontHoofD(l: typeof FRONT_NEAR): string {
  const { x0, x1, bottom } = l;
  return `M ${x0 + 4} ${bottom - 14} L ${x0 + 1} ${bottom - 4} Q ${x0 + 1} ${bottom} ${x0 + 5} ${bottom} L ${x1 - 3} ${bottom} Q ${x1 + 1} ${bottom} ${x1 + 1} ${bottom - 4} L ${x1 - 3} ${bottom - 14} Z`;
}

/** Hind leg: broad thigh, a hock that juts backwards, straight cannon. `x` is the hoof's left edge. */
const HW = 21; // hind hoof width
function hindLegD(x: number, top: number, bottom: number, closed: boolean, from = top): string {
  const h = bottom - 35; // hock height
  const r = x + HW;
  return (
    `M ${x - 15} ${from} C ${x - 11} ${h - 26} ${x - 3} ${h - 14} ${x - 7} ${h - 1} C ${x - 3} ${h + 7} ${x + 3} ${h + 12} ${x + 3} ${bottom - 15} L ${x} ${bottom - 4} Q ${x} ${bottom} ${x + 4} ${bottom} ` +
    `L ${r - 4} ${bottom} Q ${r} ${bottom} ${r} ${bottom - 4} L ${r - 4} ${bottom - 15} C ${r - 4} ${h + 8} ${r - 4} ${h} ${r + 2} ${h - 12} C ${r + 9} ${h - 24} ${r + 13} ${h - 32} ${r + 13} ${from}${closed ? ' Z' : ''}`
  );
}
function hindHoofD(x: number, bottom: number): string {
  const r = x + HW;
  return `M ${x + 3} ${bottom - 14} L ${x} ${bottom - 4} Q ${x} ${bottom} ${x + 4} ${bottom} L ${r - 4} ${bottom} Q ${r} ${bottom} ${r} ${bottom - 4} L ${r - 4} ${bottom - 14} Z`;
}

/** The split in a cloven hoof. */
const cleft = (x: number, bottom: number): Shape => ({ d: `M ${x} ${bottom - 9} L ${x} ${bottom - 2.5}`, stroke: O, sw: 2.5 });

const HIND_NEAR = { x: 68, top: 166, bottom: GROUND };
const HIND_FAR = { x: 98, top: 172, bottom: GROUND - 7 };

const legFL: Shape[] = [
  { d: frontLegD(FRONT_NEAR, true), fill: WHITE },
  { d: frontHoofD(FRONT_NEAR), fill: HOOF, stroke: O, sw: FINE },
  { d: frontLegD(FRONT_NEAR, false, FRONT_NEAR.top + 21), stroke: O, sw: SW },
  cleft((FRONT_NEAR.x0 + FRONT_NEAR.x1) / 2 + 1, GROUND),
];
const legFR: Shape[] = [
  { d: frontLegD(FRONT_FAR, true), fill: SHADE, stroke: O, sw: SW },
  { d: frontHoofD(FRONT_FAR), fill: HOOF, stroke: O, sw: FINE },
  { d: frontLegD(FRONT_FAR, true), stroke: O, sw: SW },
];
const legBL: Shape[] = [
  { d: hindLegD(HIND_NEAR.x, HIND_NEAR.top, HIND_NEAR.bottom, true), fill: WHITE },
  { d: hindHoofD(HIND_NEAR.x, HIND_NEAR.bottom), fill: HOOF, stroke: O, sw: FINE },
  { d: hindLegD(HIND_NEAR.x, HIND_NEAR.top, HIND_NEAR.bottom, false, HIND_NEAR.top + 2), stroke: O, sw: SW },
  cleft(HIND_NEAR.x + 11, GROUND),
];
const legBR: Shape[] = [
  { d: hindLegD(HIND_FAR.x, HIND_FAR.top, HIND_FAR.bottom, true), fill: SHADE, stroke: O, sw: SW },
  { d: hindHoofD(HIND_FAR.x, HIND_FAR.bottom), fill: HOOF, stroke: O, sw: FINE },
  { d: hindLegD(HIND_FAR.x, HIND_FAR.top, HIND_FAR.bottom, true), stroke: O, sw: SW },
];

/* ------------------------------------------------------------------ head */

const X = (s: number, dx: number) => n(HX + s * dx);

/** Long face: broad forehead, cheeks pinching in towards the nose. The muzzle covers the bottom. */
const SKULL_D =
  `M ${HX - 21} 49 C ${HX - 10} 44 ${HX + 10} 44 ${HX + 21} 49 C ${HX + 33} 55 ${HX + 38} 72 ${HX + 36} 90 C ${HX + 34} 106 ${HX + 29} 116 ${HX + 28} 128 ` +
  `C ${HX + 27} 150 ${HX - 27} 150 ${HX - 28} 128 C ${HX - 29} 116 ${HX - 34} 106 ${HX - 36} 90 C ${HX - 38} 72 ${HX - 33} 55 ${HX - 21} 49 Z`;

/** Broad nose pad, wider than the cheeks above it. */
const MUZZLE_D =
  `M ${HX - 34} 133 C ${HX - 34} 119 ${HX - 20} 112 ${HX} 112 C ${HX + 20} 112 ${HX + 34} 119 ${HX + 34} 133 ` +
  `C ${HX + 34} 148 ${HX + 20} 155 ${HX} 155 C ${HX - 20} 155 ${HX - 34} 148 ${HX - 34} 133 Z`;
const CHIN_D = ell(HX, 149, 21, 12.5);

/* The mask: black on both sides, leaving a blaze that starts as a star on the forehead. */
const MASK_L = `M ${HX - 44} 38 L ${HX - 2} 38 C ${HX - 14} 50 ${HX - 12} 62 ${HX - 5} 72 C ${HX - 2} 82 ${HX - 2.5} 92 ${HX - 9} 100 C ${HX - 15} 108 ${HX - 28} 108 ${HX - 44} 110 Z`;
const MASK_R = `M ${HX + 44} 38 L ${HX + 3} 38 C ${HX + 13} 52 ${HX + 9} 62 ${HX + 4} 72 C ${HX + 2} 82 ${HX + 3} 90 ${HX + 10} 96 C ${HX + 17} 102 ${HX + 28} 100 ${HX + 44} 100 Z`;

function earD(s: 1 | -1): string {
  return `M ${X(s, 27)} 60 C ${X(s, 40)} 47 ${X(s, 62)} 46 ${X(s, 74)} 55 C ${X(s, 70)} 74 ${X(s, 50)} 86 ${X(s, 27)} 82 Z`;
}
function earInnerD(s: 1 | -1): string {
  return `M ${X(s, 36)} 65 C ${X(s, 45)} 56 ${X(s, 58)} 54 ${X(s, 66)} 58 C ${X(s, 62)} 69 ${X(s, 50)} 77 ${X(s, 36)} 76 Z`;
}
/** A farm tag in the screen-right ear, worn like an earring. */
const TAG_D = `M ${HX + 58} 78.5 L ${HX + 47} 81 L ${HX + 47} 92 Q ${HX + 52.5} 96 ${HX + 58} 92 Z`;
function ear(s: 1 | -1): Shape[] {
  return [
    ...(s === 1 ? [{ d: TAG_D, fill: TAG, stroke: O, sw: FINE }] : []),
    { d: earD(s), fill: SPOT, stroke: O, sw: SW },
    { d: earInnerD(s), fill: PINK },
  ];
}

function hornD(s: 1 | -1): string {
  return `M ${X(s, 9)} 52 C ${X(s, 13)} 42 ${X(s, 22)} 38 ${X(s, 29)} 27 C ${X(s, 35)} 38 ${X(s, 34)} 50 ${X(s, 26)} 58 Z`;
}
const TUFT_D = `M ${HX - 11} 54 C ${HX - 15} 41 ${HX - 4} 35 ${HX - 1} 44 C ${HX + 3} 33 ${HX + 15} 38 ${HX + 10} 54 Z`;

const head: Shape[] = [
  { d: hornD(-1), fill: HORN, stroke: O, sw: SW },
  { d: hornD(1), fill: HORN, stroke: O, sw: SW },
  { d: TUFT_D, fill: WHITE, stroke: O, sw: SW },
  { d: SKULL_D, fill: WHITE },
  { d: MASK_L, fill: SPOT, clip: 'skull' },
  { d: MASK_R, fill: SPOT, clip: 'skull' },
  { d: SKULL_D, stroke: O, sw: SW },
];

const nostril = (s: 1 | -1) => ell(X(s, 14.5), 126, 5.2, 3.4, s * 24);
const muzzle: Shape[] = [
  { d: MUZZLE_D, fill: PINK, stroke: O, sw: SW },
  { d: nostril(-1), fill: MOUTH },
  { d: nostril(1), fill: MOUTH },
];

/* ------------------------------------------------------------------ eyes */

const L = HX - EDX;
const R = HX + EDX;
const RX = 11.5;
const RY = 12.5;

/** Half-lidded eye: lid down to `yl`..`yr` (left / right edge), pupil cut flat by the lid. */
function liddedEye(cx: number, yl: number, yr: number, rx = RX, ry = RY): Shape[] {
  return [
    { d: ell(cx, EY, rx, ry), fill: WHITE, stroke: O, sw: 3 },
    { d: cut(cx, EY, rx, ry, yl, yr, false), fill: LID, stroke: O, sw: 3 },
    { d: `M ${n(cx - rx - 2.5)} ${n(yl)} L ${n(cx + rx + 2.5)} ${n(yr)}`, stroke: O, sw: 4.5 },
  ];
}
function liddedPupil(cx: number, px: number, py: number, r: number, lidY: number): Shape[] {
  return [
    { d: cut(cx + px, EY + py, r, r, lidY, lidY, true), fill: O },
    { d: ell(cx + px - 1.6, EY + py + 1.2, 1.7, 1.7), fill: WHITE },
  ];
}

const LID_Y = EY - 1.5;
const openEyes: Shape[] = [...liddedEye(L, LID_Y - 0.6, LID_Y + 0.6), ...liddedEye(R, LID_Y + 0.6, LID_Y - 0.6)];
const openPupils: Shape[] = [...liddedPupil(L, 1.5, 3.6, 6.4, LID_Y + 1.6), ...liddedPupil(R, 1.5, 3.6, 6.4, LID_Y + 1.6)];

const wideEyes: Shape[] = [L - 0.5, R + 0.5].map((cx) => ({ d: ell(cx, EY - 2, 13.5, 15), fill: WHITE, stroke: O, sw: 3 }));
const widePupils: Shape[] = [L - 0.5, R + 0.5].map((cx) => ({ d: ell(cx + 0.5, EY - 1.5, 3.6, 3.6), fill: O }));

const closedEyes: Shape[] = [L, R].flatMap((cx) => [
  { d: ell(cx, EY, RX, RY), fill: LID, stroke: O, sw: 3 },
  { d: `M ${cx - 9} ${EY + 3} Q ${cx} ${EY + 10} ${cx + 9} ${EY + 3}`, stroke: O, sw: 4 },
]);

/** Suspicious slit: heavy lid sloping down towards the nose, lower lid pushed up. */
function slitEye(cx: number, s: 1 | -1): Shape[] {
  const yo = EY - 0.5; // outer end of the lid
  const yi = EY + 3.5; // inner end
  const yl = s === -1 ? yo : yi;
  const yr = s === -1 ? yi : yo;
  return [
    { d: ell(cx, EY, RX, RY), fill: LID, stroke: O, sw: 3 },
    { d: `M ${cx - 10.6} ${n(yl + 0.5)} L ${cx + 10.6} ${n(yr + 0.5)} C ${cx + 8} ${EY + 12} ${cx - 8} ${EY + 12} ${cx - 10.6} ${n(yl + 0.5)} Z`, fill: WHITE },
    { d: `M ${cx - RX - 2.5} ${n(yl)} L ${cx + RX + 2.5} ${n(yr)}`, stroke: O, sw: 4.5 },
  ];
}
const squintEyes: Shape[] = [...slitEye(L, -1), ...slitEye(R, 1)];
const squintPupils: Shape[] = [L, R].map((cx) => ({ d: cut(cx + (cx === L ? 2.5 : -0.5), EY + 5, 4.6, 4.6, EY + 3.6, EY + 3.6, true), fill: O }));

/** One eye popped, the other drooping: the cool has slipped. */
const wonkyEyes: Shape[] = [{ d: ell(L - 0.5, EY - 2, 13.5, 15), fill: WHITE, stroke: O, sw: 3 }, ...liddedEye(R, EY + 2.4, EY + 1.2, 10, 11)];
const wonkyPupils: Shape[] = [
  { d: ell(L - 5, EY - 7, 3.6, 3.6), fill: O },
  { d: cut(R + 3.5, EY + 5.5, 4.2, 4.2, EY + 3.6, EY + 3.6, true), fill: O },
];

const happyArc = (cx: number) => `M ${cx - 10} ${EY + 5} Q ${cx} ${EY - 12} ${cx + 10} ${EY + 5}`;
const happyEyes: Shape[] = [L, R].map((cx) => ({ d: happyArc(cx), stroke: WHITE, sw: 5.5 }));

/* ---------------------------------------------------------------- mouths */

const MY = 143;
/* A flat line with one corner hitched up, and a dimple beside it. */
const smirkD = `M ${HX - 13} ${MY + 1} L ${HX + 2} ${MY + 1.5} Q ${HX + 9.5} ${MY + 1.5} ${HX + 13.5} ${MY - 4}`;
const smirkTick = `M ${HX + 18} ${MY - 9} Q ${HX + 21} ${MY - 5} ${HX + 18.5} ${MY - 1.5}`;
const smile: Shape[] = [
  { d: smirkD, stroke: O, sw: FINE },
  { d: smirkTick, stroke: O, sw: 2.6 },
];
const flat: Shape[] = [{ d: `M ${HX - 11} ${MY + 0.5} L ${HX + 11} ${MY + 0.5}`, stroke: O, sw: FINE }];
const openMouth: Shape[] = [
  { d: `M ${HX - 13} ${MY - 5} C ${HX - 5} ${MY - 7} ${HX + 5} ${MY - 7} ${HX + 13} ${MY - 5} C ${HX + 14} ${MY + 10} ${HX - 14} ${MY + 10} ${HX - 13} ${MY - 5} Z`, fill: MOUTH, stroke: O, sw: FINE },
  { d: ell(HX, MY + 3.8, 6.5, 2.8), fill: TONGUE },
];
const tongue: Shape[] = [
  { d: `M ${HX + 1} ${MY + 2} C ${HX} ${MY + 14} ${HX + 13} ${MY + 13} ${HX + 11} ${MY - 0.5} Z`, fill: TONGUE, stroke: O, sw: 3 },
  { d: `M ${HX + 6} ${MY + 3} L ${HX + 6.4} ${MY + 7.5}`, stroke: MOUTH, sw: 1.8 },
  { d: smirkD, stroke: O, sw: FINE },
  { d: smirkTick, stroke: O, sw: 3 },
];
const wavy: Shape[] = [{ d: `M ${HX - 14} ${MY + 1} q 3.5 -5 7 0 t 7 0 t 7 0 t 7 0`, stroke: O, sw: FINE }];

/* ----------------------------------------------------------------- brows */

/* White, because they sit on the black mask. */
const brow = (d: string): Shape => ({ d, stroke: WHITE, sw: 4.5 });
const angry: Shape[] = [-1, 1].map((s) => brow(`M ${X(s, 30)} 61 L ${X(s, 12)} 69`));
const worried: Shape[] = [-1, 1].map((s) => brow(`M ${X(s, 31)} 68 L ${X(s, 14)} 61`));
/* The single sceptical eyebrow. */
const raised: Shape[] = [brow(`M ${HX - 30} 65 L ${HX - 13} 65.5`), brow(`M ${HX + 12} 61 Q ${HX + 21} 51 ${HX + 31} 59`)];

/* ------------------------------------------------------------------ skin */

const attitude: CowSkin = {
  id: 'attitude',
  name: 'Attitude',
  viewBox: { x: 0, y: 0, w: 320, h: 256 },
  headBox: { x: 154, y: 8, w: 160, h: 160 },
  clips: { body: BODY_D, skull: SKULL_D },

  parts: {
    tail: {
      shapes: [
        { d: TAIL_D, fill: WHITE, stroke: O, sw: SW },
        { d: TAIL_TUFT_D, fill: SPOT, stroke: O, sw: SW },
      ],
      pivot: [52, 106],
    },
    legBR: { shapes: legBR, pivot: [HIND_FAR.x + 13, 180] },
    legFR: { shapes: legFR, pivot: [(FRONT_FAR.x0 + FRONT_FAR.x1) / 2, 180] },
    udder: {
      shapes: [...TEATS.map((d) => ({ d, fill: PINK, stroke: O, sw: FINE })), { d: UDDER_D, fill: PINK, stroke: O, sw: SW }],
      pivot: [119, 188],
    },
    body: { shapes: [{ d: BODY_D, fill: WHITE }], pivot: [146, 198] },
    patches: {
      shapes: [
        { d: PATCH_SADDLE, fill: SPOT, clip: 'body' },
        { d: PATCH_RUMP, fill: SPOT, clip: 'body' },
        { d: PATCH_BELLY, fill: SPOT, clip: 'body' },
      ],
      pivot: [146, 198],
    },
    legBL: { shapes: legBL, pivot: [HIND_NEAR.x + 13, 176] },
    legFL: { shapes: legFL, pivot: [(FRONT_NEAR.x0 + FRONT_NEAR.x1) / 2, 178] },
    earL: { shapes: ear(-1), pivot: [HX - 31, 71] },
    earR: { shapes: ear(1), pivot: [HX + 31, 71] },
    head: { shapes: head, pivot: [HX - 10, 126] },
    eyes: { shapes: [], pivot: [HX, EY + 2] },
    jaw: {
      // The dark inside of the mouth hides under the muzzle until the jaw drops.
      shapes: [
        { d: CHIN_D, fill: WHITE, stroke: O, sw: SW },
        { d: ell(HX, 148.5, 15, 6), fill: MOUTH },
      ],
      pivot: [HX, 140],
    },
    muzzle: { shapes: muzzle, pivot: [HX, 133] },
    mouth: { shapes: [], pivot: [HX, MY] },
    brows: { shapes: [], pivot: [HX, 66] },
  },
  rootPivot: [146, GROUND],

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
    closed: { shapes: closedEyes },
    wide: { shapes: wideEyes, pupils: widePupils },
    squint: { shapes: squintEyes, pupils: squintPupils },
    wonky: { shapes: wonkyEyes, pupils: wonkyPupils },
    happy: { shapes: happyEyes },
  },
  mouth: { smile, open: openMouth, flat, tongue, wavy },
  brows: { angry, worried, raised },

  anchors: {
    headTop: [HX, 50],
    eyeLine: [HX, EY - 5],
    mouthPoint: [HX + 13, MY],
    above: [HX + 4, 16],
    eyeSpan: 36,
    headWidth: 72,
  },

  silhouette: [
    BODY_D,
    TAIL_D,
    TAIL_TUFT_D,
    UDDER_D,
    ...TEATS,
    frontLegD(FRONT_NEAR, true),
    frontLegD(FRONT_FAR, true),
    hindLegD(HIND_NEAR.x, HIND_NEAR.top, HIND_NEAR.bottom, true),
    hindLegD(HIND_FAR.x, HIND_FAR.top, HIND_FAR.bottom, true),
    SKULL_D,
    MUZZLE_D,
    CHIN_D,
    earD(-1),
    earD(1),
    TAG_D,
    hornD(-1),
    hornD(1),
    TUFT_D,
  ],
  headSilhouette: [SKULL_D, MUZZLE_D, CHIN_D, earD(-1), earD(1), TAG_D, hornD(-1), hornD(1), TUFT_D],
  fillRange: { top: 30, bottom: GROUND },
  headFillRange: { top: 30, bottom: 161 },
  ghostFace: [
    { d: cut(L, EY, RX, RY, LID_Y, LID_Y, true), fill: O },
    { d: cut(R, EY, RX, RY, LID_Y, LID_Y, true), fill: O },
    { d: nostril(-1), fill: O },
    { d: nostril(1), fill: O },
    { d: smirkD, stroke: O, sw: FINE },
  ],
};

export default attitude;
