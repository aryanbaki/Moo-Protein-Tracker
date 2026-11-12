/**
 * Moo's artwork as plain data: every part of the cow is a list of SVG paths in one
 * shared coordinate space. The app renders these with react-native-svg (Cow.tsx) and
 * scripts/generate-icons.mjs renders the same data to a plain SVG string for the icon
 * and splash, so the two can never drift apart.
 *
 * Keep this file free of React / React Native imports: the icon script transpiles and
 * loads it in Node.
 */
import { colors } from '../theme';

export interface Shape {
  d: string;
  fill?: string;
  stroke?: string;
  sw?: number;
  opacity?: number;
  /** Clip to the body or skull outline (used for the black patches). */
  clip?: 'body' | 'skull';
}

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ArtPose = 'idle' | 'wave' | 'chew' | 'flex' | 'shocked' | 'shrug' | 'dance' | 'sweat' | 'crown' | 'abducted';

/** Full cow canvas (aspect 5:4). */
export const FULL_VB: ViewBox = { x: 0, y: 0, w: 320, h: 256 };
/** Head-only crop. */
export const HEAD_VB: ViewBox = { x: 156, y: 12, w: 164, h: 164 };

/** Colours the theme has no token for. */
export const art = {
  outline: colors.cowOutline,
  white: colors.cowWhite,
  spot: colors.cowSpot,
  pink: colors.cowPink,
  pinkDeep: '#E58DA2',
  shade: '#E2DDD0',
  horn: '#F4DFA4',
  mouth: '#8A3345',
  tongue: '#F0788E',
  gold: '#F7C948',
  goldDeep: colors.warning,
  gem: colors.bad,
  sweat: '#7FC8F5',
  grass: colors.fill,
} as const;

const O = art.outline;
const SW = 5;
const SW_FINE = 3.5;

/** Head centre line. Head parts are mirrored around it. */
const HX = 238;

const n = (v: number) => Math.round(v * 100) / 100;

/** Ellipse as a path, optionally rotated (degrees) around its centre. */
export function ell(cx: number, cy: number, rx: number, ry: number, rot = 0): string {
  const a = (rot * Math.PI) / 180;
  const dx = rx * Math.cos(a);
  const dy = rx * Math.sin(a);
  return `M ${n(cx - dx)} ${n(cy - dy)} A ${rx} ${ry} ${rot} 1 0 ${n(cx + dx)} ${n(cy + dy)} A ${rx} ${ry} ${rot} 1 0 ${n(cx - dx)} ${n(cy - dy)} Z`;
}

function leg(x0: number, x1: number, top: number, bottom: number, closed: boolean): string {
  const xm = (x0 + x1) / 2;
  const r = 12;
  return `M ${x0} ${top} L ${x0} ${bottom - r} Q ${x0} ${bottom} ${xm} ${bottom} Q ${x1} ${bottom} ${x1} ${bottom - r} L ${x1} ${top}${closed ? ' Z' : ''}`;
}

function hoof(x0: number, x1: number, bottom: number): string {
  const xm = (x0 + x1) / 2;
  const r = 12;
  const t = bottom - 17;
  return `M ${x0} ${t} L ${x0} ${bottom - r} Q ${x0} ${bottom} ${xm} ${bottom} Q ${x1} ${bottom} ${x1} ${bottom - r} L ${x1} ${t} Z`;
}

function drop(cx: number, cy: number, s: number): string {
  return `M ${cx} ${n(cy - 9 * s)} C ${n(cx + 7 * s)} ${cy} ${n(cx + 6 * s)} ${n(cy + 8 * s)} ${cx} ${n(cy + 8 * s)} C ${n(cx - 6 * s)} ${n(cy + 8 * s)} ${n(cx - 7 * s)} ${cy} ${cx} ${n(cy - 9 * s)} Z`;
}

/* ---------- body ---------- */

export const BODY_D = 'M 50 142 C 44 104 78 88 132 88 C 186 88 234 96 236 142 C 238 182 206 200 142 200 C 86 200 54 186 50 142 Z';
export const SKULL_D = ell(HX, 92, 37, 41);
const MUZZLE_D = ell(HX, 127, 43, 25);
const CHIN_D = ell(HX, 141, 25, 14);
const TAIL_D = 'M 60 116 C 36 104 14 130 24 164 L 36 162 C 30 140 42 124 58 130 Z';
const TAIL_TUFT_D = 'M 30 150 C 44 158 44 180 28 186 C 14 180 14 160 30 150 Z';
const UDDER_D = 'M 106 188 C 104 212 120 222 134 222 C 150 222 164 212 162 188 Z';
const TEATS = [ell(119, 218, 5, 7), ell(134, 223, 5, 7), ell(149, 218, 5, 7)];

const NEAR_FRONT: [number, number, number, number] = [184, 214, 166, 242];
const NEAR_REAR: [number, number, number, number] = [74, 104, 166, 242];
const FAR_FRONT: [number, number, number, number] = [156, 184, 176, 234];
const FAR_REAR: [number, number, number, number] = [104, 132, 176, 234];

function nearLeg(l: [number, number, number, number]): Shape[] {
  return [
    { d: leg(l[0], l[1], l[2], l[3], true), fill: art.white },
    { d: hoof(l[0], l[1], l[3]), fill: art.spot },
    { d: leg(l[0], l[1], l[2] + 12, l[3], false), stroke: O, sw: SW },
  ];
}

function farLeg(l: [number, number, number, number]): Shape[] {
  return [
    { d: leg(l[0], l[1], l[2], l[3], true), fill: art.shade, stroke: O, sw: SW },
    { d: hoof(l[0], l[1], l[3]), fill: art.spot, stroke: O, sw: SW },
  ];
}

/* ---------- head ---------- */

function ear(s: 1 | -1): Shape[] {
  const X = (dx: number) => n(HX + s * dx);
  return [
    {
      d: `M ${X(28)} 84 C ${X(44)} 62 ${X(70)} 66 ${X(78)} 78 C ${X(72)} 98 ${X(50)} 106 ${X(28)} 100 Z`,
      fill: s === -1 ? art.spot : art.white,
      stroke: O,
      sw: SW,
    },
    {
      d: `M ${X(38)} 88 C ${X(48)} 76 ${X(62)} 76 ${X(68)} 81 C ${X(63)} 92 ${X(50)} 98 ${X(38)} 96 Z`,
      fill: art.pink,
    },
  ];
}

function horn(s: 1 | -1): Shape {
  const X = (dx: number) => n(HX + s * dx);
  return {
    d: `M ${X(30)} 70 C ${X(38)} 58 ${X(37)} 42 ${X(29)} 34 C ${X(22)} 42 ${X(17)} 52 ${X(10)} 58 Z`,
    fill: art.horn,
    stroke: O,
    sw: SW,
  };
}

const EYE_Y = 86;
const EYE_DX = 16.5;

function eyes(kind: 'normal' | 'wide' | 'happy'): Shape[] {
  const l = HX - EYE_DX;
  const r = HX + EYE_DX;
  if (kind === 'happy') {
    const arc = (cx: number) => `M ${cx - 9} ${EYE_Y + 3} Q ${cx} ${EYE_Y - 11} ${cx + 9} ${EYE_Y + 3}`;
    return [
      { d: arc(l), stroke: art.white, sw: 9 },
      { d: arc(l), stroke: O, sw: 4.5 },
      { d: arc(r), stroke: O, sw: 4.5 },
    ];
  }
  if (kind === 'wide') {
    return [l - 1, r + 1].flatMap((cx) => [
      { d: ell(cx, EYE_Y - 4, 14, 16), fill: art.white, stroke: O, sw: SW_FINE },
      { d: ell(cx + 1, EYE_Y - 3, 3.6, 3.6), fill: O },
    ]);
  }
  return [l, r].flatMap((cx) => [
    { d: ell(cx, EYE_Y, 11, 13), fill: art.white, stroke: O, sw: SW_FINE },
    { d: ell(cx + 1.5, EYE_Y + 2, 6.6, 7.6), fill: O },
    { d: ell(cx - 1, EYE_Y - 1.5, 2.7, 2.7), fill: art.white },
  ]);
}

function brows(kind: 'angry' | 'worried' | 'raised'): Shape[] {
  const mk = (d: string): Shape[] => [
    { d, stroke: art.white, sw: 9 },
    { d, stroke: O, sw: 4.5 },
  ];
  const side = (s: 1 | -1): string => {
    const X = (dx: number) => n(HX + s * dx);
    if (kind === 'angry') return `M ${X(28)} 62 L ${X(9)} 70`;
    if (kind === 'worried') return `M ${X(28)} 69 L ${X(10)} 61`;
    return `M ${X(27)} 64 Q ${X(17)} 55 ${X(8)} 63`;
  };
  return [...mk(side(-1)), ...mk(side(1))];
}

function mouth(kind: 'smile' | 'flat' | 'wobbly' | 'open' | 'none'): Shape[] {
  switch (kind) {
    case 'smile':
      return [{ d: `M ${HX - 13} 139 Q ${HX} 148 ${HX + 13} 139`, stroke: O, sw: SW_FINE }];
    case 'flat':
      return [{ d: `M ${HX - 11} 141 L ${HX + 9} 139`, stroke: O, sw: SW_FINE }];
    case 'wobbly':
      return [{ d: `M ${HX - 14} 141 q 3.5 -5 7 0 t 7 0 t 7 0 t 7 0`, stroke: O, sw: SW_FINE }];
    case 'open':
      return [
        { d: `M ${HX - 15} 135 Q ${HX} 155 ${HX + 15} 135 Z`, fill: art.mouth, stroke: O, sw: SW_FINE },
        { d: ell(HX, 144, 6, 3.2), fill: art.tongue },
      ];
    default:
      return [];
  }
}

function crown(): Shape[] {
  const cx = HX;
  const cy = 58;
  const a = (-9 * Math.PI) / 180;
  const R = (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    return `${n(cx + dx * Math.cos(a) - dy * Math.sin(a))} ${n(cy + dx * Math.sin(a) + dy * Math.cos(a))}`;
  };
  const base = `M ${R(215, 60)} L ${R(210, 28)} L ${R(225, 42)} L ${R(238, 20)} L ${R(251, 42)} L ${R(266, 28)} L ${R(261, 60)} Z`;
  const band = `M ${R(216, 52)} L ${R(260, 52)}`;
  const dot = (x: number, y: number, r: number, fill: string): Shape => {
    const [px, py] = R(x, y).split(' ').map(Number);
    return { d: ell(px as number, py as number, r, r), fill, stroke: O, sw: 2.5 };
  };
  return [
    { d: base, fill: art.gold, stroke: O, sw: SW },
    { d: band, stroke: art.goldDeep, sw: 5 },
    dot(238, 20, 4.5, art.gem),
    dot(210, 28, 3.6, art.white),
    dot(266, 28, 3.6, art.white),
    dot(238, 46, 3.4, art.gem),
  ];
}

export interface CowParts {
  tail: Shape[];
  legFarRear: Shape[];
  legFarFront: Shape[];
  torso: Shape[];
  legNearRear: Shape[];
  legNearFront: Shape[];
  earL: Shape[];
  earR: Shape[];
  headBase: Shape[];
  eyes: Shape[];
  jaw: Shape[];
  muzzle: Shape[];
  /** Brows, crown: things that ride on the head. */
  headTop: Shape[];
  /** Bent flexing arm (flex pose only, replaces the near front leg). */
  flexArm: Shape[];
  sweat: Shape[][];
  shockLines: Shape[];
}

/** Pivot points (art units) for each animated part. */
export const PIVOT = {
  root: [142, 242],
  torso: [142, 200],
  tail: [58, 122],
  legNearFront: [199, 178],
  legNearRear: [89, 178],
  legFarFront: [170, 182],
  legFarRear: [118, 182],
  head: [226, 124],
  earL: [HX - 30, 92],
  earR: [HX + 30, 92],
  eyes: [HX, EYE_Y],
  jaw: [HX, 136],
  flexArm: [200, 188],
  center: [160, 140],
} as const;

export function cowParts(pose: ArtPose = 'idle'): CowParts {
  const eyeKind = pose === 'shocked' || pose === 'abducted' ? 'wide' : pose === 'dance' ? 'happy' : 'normal';
  const mouthKind =
    pose === 'shrug' ? 'flat' : pose === 'sweat' ? 'wobbly' : pose === 'dance' ? 'open' : pose === 'chew' || pose === 'shocked' || pose === 'abducted' ? 'none' : 'smile';
  const browKind = pose === 'flex' ? 'angry' : pose === 'sweat' || pose === 'abducted' ? 'worried' : pose === 'shrug' ? 'raised' : null;

  const jaw: Shape[] = [
    { d: CHIN_D, fill: art.white, stroke: O, sw: SW },
    { d: ell(HX, 140, 16, 7.5), fill: art.mouth },
  ];
  if (pose === 'chew') {
    // A blade of grass that rides on the jaw.
    jaw.unshift(
      { d: `M ${HX + 14} 144 C ${HX + 30} 150 ${HX + 40} 142 ${HX + 50} 150`, stroke: O, sw: 7 },
      { d: `M ${HX + 14} 144 C ${HX + 30} 150 ${HX + 40} 142 ${HX + 50} 150`, stroke: art.grass, sw: 3.5 },
      { d: `M ${HX + 38} 144 C ${HX + 44} 134 ${HX + 54} 134 ${HX + 58} 138 C ${HX + 54} 146 ${HX + 46} 148 ${HX + 38} 144 Z`, fill: art.grass, stroke: O, sw: 2.5 },
    );
  }

  const armPath = 'M 200 188 L 250 210 L 280 178';
  const flexArm: Shape[] = [
    { d: armPath, stroke: O, sw: 32 },
    { d: armPath, stroke: art.white, sw: 22 },
    { d: ell(227, 187, 18, 14, 22), fill: art.white },
    { d: 'M 208 184 C 212 166 240 164 248 186', stroke: O, sw: SW },
    { d: ell(283, 172, 15, 13, -40), fill: art.spot, stroke: O, sw: SW },
    { d: 'M 296 150 L 304 142 M 302 164 L 312 162 M 284 146 L 286 136', stroke: O, sw: 3.5 },
  ];

  return {
    tail: [
      { d: TAIL_D, fill: art.white, stroke: O, sw: SW },
      { d: TAIL_TUFT_D, fill: art.spot, stroke: O, sw: SW },
    ],
    legFarRear: farLeg(FAR_REAR),
    legFarFront: farLeg(FAR_FRONT),
    torso: [
      ...TEATS.map((d) => ({ d, fill: art.pink, stroke: O, sw: SW_FINE })),
      { d: UDDER_D, fill: art.pink, stroke: O, sw: SW },
      { d: BODY_D, fill: art.white },
      { d: 'M 92 78 C 122 74 156 84 164 104 C 170 126 150 138 126 134 C 100 132 84 110 92 78 Z', fill: art.spot, clip: 'body' },
      { d: 'M 40 128 C 60 120 78 136 76 156 C 74 174 56 180 40 172 Z', fill: art.spot, clip: 'body' },
      { d: 'M 150 160 C 160 150 178 154 178 166 C 178 178 160 182 152 174 C 148 170 147 164 150 160 Z', fill: art.spot, clip: 'body' },
      { d: BODY_D, stroke: O, sw: SW },
    ],
    legNearRear: nearLeg(NEAR_REAR),
    legNearFront: nearLeg(NEAR_FRONT),
    earL: ear(-1),
    earR: ear(1),
    headBase: [
      horn(-1),
      horn(1),
      { d: `M ${HX - 13} 60 C ${HX - 18} 42 ${HX - 4} 36 ${HX} 46 C ${HX + 5} 34 ${HX + 19} 42 ${HX + 12} 60 Z`, fill: art.white, stroke: O, sw: SW },
      { d: SKULL_D, fill: art.white },
      { d: ell(HX - 24, 76, 26, 32, 18), fill: art.spot, clip: 'skull' },
      { d: SKULL_D, stroke: O, sw: SW },
    ],
    eyes: eyes(eyeKind),
    jaw,
    muzzle: [
      { d: MUZZLE_D, fill: art.pink, stroke: O, sw: SW },
      { d: ell(HX - 15, 121, 5.5, 7, -12), fill: art.pinkDeep },
      { d: ell(HX + 15, 121, 5.5, 7, 12), fill: art.pinkDeep },
      ...mouth(mouthKind),
    ],
    headTop: [...(browKind ? brows(browKind) : []), ...(pose === 'crown' ? crown() : [])],
    flexArm,
    sweat: [
      [{ d: drop(190, 58, 1.1), fill: art.sweat, stroke: O, sw: 2.5 }],
      [{ d: drop(292, 52, 0.9), fill: art.sweat, stroke: O, sw: 2.5 }],
      [{ d: drop(176, 96, 0.8), fill: art.sweat, stroke: O, sw: 2.5 }],
    ],
    shockLines: [{ d: 'M 196 30 L 188 16 M 238 22 L 238 6 M 280 30 L 288 16', stroke: O, sw: SW }],
  };
}

/** Shapes whose union is the cow's silhouette (used as the fill clip). */
export function silhouette(headOnly = false): string[] {
  const p = cowParts('idle');
  const headPaths = [...p.earL.slice(0, 1), ...p.earR.slice(0, 1), p.headBase[0], p.headBase[1], p.headBase[2]].map((s) => (s as Shape).d);
  const head = [...headPaths, SKULL_D, MUZZLE_D, CHIN_D];
  if (headOnly) return head;
  return [
    TAIL_D,
    TAIL_TUFT_D,
    ...[FAR_REAR, FAR_FRONT, NEAR_REAR, NEAR_FRONT].map((l) => leg(l[0], l[1], l[2], l[3], true)),
    ...TEATS,
    UDDER_D,
    BODY_D,
    ...head,
  ];
}

/** Simple face marks drawn over the fill view so the ghost cow keeps its character. */
export function ghostFace(): Shape[] {
  const l = HX - EYE_DX;
  const r = HX + EYE_DX;
  return [
    { d: ell(l + 1, EYE_Y + 1, 6.6, 7.6), fill: O },
    { d: ell(r + 1, EYE_Y + 1, 6.6, 7.6), fill: O },
    { d: ell(HX - 15, 121, 5.5, 7, -12), fill: O },
    { d: ell(HX + 15, 121, 5.5, 7, 12), fill: O },
    { d: `M ${HX - 13} 139 Q ${HX} 148 ${HX + 13} 139`, stroke: O, sw: SW_FINE },
  ];
}

/** The head as one ordered stack (back to front), for static renders. */
export function headStack(pose: ArtPose = 'idle'): Shape[] {
  const p = cowParts(pose);
  return [...p.earL, ...p.earR, ...p.headBase, ...p.eyes, ...p.jaw, ...p.muzzle, ...p.headTop];
}

/** The whole cow as one ordered stack, for static renders. */
export function cowStack(pose: ArtPose = 'idle'): Shape[] {
  const p = cowParts(pose);
  return [...p.tail, ...p.legFarRear, ...p.legFarFront, ...p.torso, ...p.legNearRear, ...p.legNearFront, ...headStack(pose)];
}

/** Plain SVG markup for a list of shapes (no outer <svg>). */
export function shapesToSvg(shapes: Shape[], idPrefix = 'moo'): string {
  const defs = `<defs><clipPath id="${idPrefix}-body"><path d="${BODY_D}"/></clipPath><clipPath id="${idPrefix}-skull"><path d="${SKULL_D}"/></clipPath></defs>`;
  const body = shapes
    .map((s) => {
      const attrs = [
        `d="${s.d}"`,
        `fill="${s.fill ?? 'none'}"`,
        s.stroke ? `stroke="${s.stroke}" stroke-width="${s.sw ?? SW}" stroke-linecap="round" stroke-linejoin="round"` : '',
        s.opacity != null ? `opacity="${s.opacity}"` : '',
        s.clip ? `clip-path="url(#${idPrefix}-${s.clip})"` : '',
      ];
      return `<path ${attrs.filter(Boolean).join(' ')}/>`;
    })
    .join('');
  return defs + body;
}
