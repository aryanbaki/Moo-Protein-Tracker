/**
 * The mascot rig contract.
 *
 * A SKIN is a drawing of a cow cut into named parts. An ANIMATION is plain keyframe
 * data written against those part names only, so every animation plays on every skin.
 * CowRig.tsx renders one skin playing one animation.
 *
 * Keep this file (and skin / animation files) free of React imports: they are data.
 */

/* ------------------------------------------------------------------ drawing */

/** One SVG path. `clip` names an entry of `CowSkin.clips`. */
export interface Shape {
  d: string;
  fill?: string;
  stroke?: string;
  /** Stroke width in viewBox units (default 5). */
  sw?: number;
  opacity?: number;
  clip?: string;
}

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A point in viewBox units. */
export type Pt = readonly [number, number];

/* -------------------------------------------------------------------- parts */

/** Parts that hang off the cow's root (the whole-cow transform). */
export type BodyPartName = 'body' | 'patches' | 'udder' | 'tail' | 'legFL' | 'legFR' | 'legBL' | 'legBR' | 'armL' | 'armR';

/**
 * Parts that live inside the head and always move with it.
 * `head` is the skull itself (plus horns, hair, anything fixed to it).
 */
export type HeadPartName = 'head' | 'earL' | 'earR' | 'eyes' | 'jaw' | 'muzzle' | 'mouth' | 'brows';

export type PartName = BodyPartName | HeadPartName;

export const HEAD_PARTS: readonly HeadPartName[] = ['head', 'earL', 'earR', 'eyes', 'jaw', 'muzzle', 'mouth', 'brows'];
/** `patches` and `udder` ride on the body (they squash and stretch with it). */
export const BODY_RIDERS: readonly BodyPartName[] = ['body', 'patches', 'udder'];

export interface SkinPart {
  shapes: Shape[];
  /** The point this part rotates and scales around, in viewBox units. */
  pivot: Pt;
  /**
   * Flip incoming rotation and x for this part. Animations are written for a cow that
   * faces RIGHT (negative rotation swings a limb forward / up). Set this on a limb that
   * should swing the other way for the same value, e.g. the screen-left arm of a
   * front-facing cow.
   */
  mirror?: boolean;
  /** Multiplies incoming rotation (default 1). Use to tame a short or stiff limb. */
  rotateGain?: number;
}

/** A static decoration drawn at some z position that moves with `follows`. */
export interface SkinExtra {
  follows: 'body' | 'head' | 'root';
  shapes: Shape[];
}

export type EyeKind = 'open' | 'closed' | 'wide' | 'squint' | 'wonky' | 'happy';
export type MouthKind = 'smile' | 'open' | 'flat' | 'tongue' | 'wavy' | 'none';
export type BrowKind = 'none' | 'angry' | 'worried' | 'raised';

export const EYE_KINDS: readonly EyeKind[] = ['open', 'closed', 'wide', 'squint', 'wonky', 'happy'];
export const MOUTH_KINDS: readonly MouthKind[] = ['smile', 'open', 'flat', 'tongue', 'wavy', 'none'];
export const BROW_KINDS: readonly BrowKind[] = ['none', 'angry', 'worried', 'raised'];

export interface EyeArt {
  /** Whites, lids, lines: everything that does not move when the cow looks around. */
  shapes: Shape[];
  /** Pupils + highlights. Animations move these with the `pupils` track. */
  pupils?: Shape[];
}

export interface SkinAnchors {
  /** Where a crown sits: top centre of the skull (between the horns). */
  headTop: Pt;
  /** Centre point between the eyes (sunglasses sit here). */
  eyeLine: Pt;
  /** Centre of the mouth (grass hangs here, speech starts here). */
  mouthPoint: Pt;
  /** Free air just above the head (zzz, hearts, sweat, sparkles start here). */
  above: Pt;
  /** Distance between the two eye centres, viewBox units (sizes the sunglasses). */
  eyeSpan: number;
  /** Width of the skull, viewBox units (sizes crown, sweat spread). */
  headWidth: number;
}

export interface CowSkin {
  id: string;
  name: string;
  /** Full canvas. Rendered width = `size`; height follows the aspect ratio. */
  viewBox: ViewBox;
  /** Crop used by `headOnly`. Should be square-ish and leave room for ears and horns. */
  headBox: ViewBox;
  /** Named clip paths (viewBox units) that shapes can refer to with `clip`. */
  clips?: Record<string, string>;

  /**
   * Required: body, head, tail, legFL, legFR, legBL, legBR, earL, earR.
   * Optional: patches, udder, armL, armR, jaw, muzzle.
   * `eyes`, `mouth`, `brows` here only give the PIVOT (their drawings are the
   * expression variants below); their `shapes` are ignored.
   *
   * Legs: F = front, B = back; L = nearer the viewer (or screen-left on a front-facing
   * cow), R = the far one. Skins without arms: `armL` / `armR` tracks are applied to
   * `legFL` / `legFR` at `armFallbackGain`.
   */
  parts: Record<'body' | 'head' | 'tail' | 'legFL' | 'legFR' | 'legBL' | 'legBR' | 'earL' | 'earR' | 'eyes' | 'mouth', SkinPart> &
    Partial<Record<'patches' | 'udder' | 'armL' | 'armR' | 'jaw' | 'muzzle' | 'brows', SkinPart>>;

  /** Whole-cow pivot: on the ground between the feet. Jumps, squash and spins use it. */
  rootPivot: Pt;

  /**
   * Draw order, back to front. Part names, or extras (static decorations).
   * Head parts may be interleaved anywhere; they still move with the head.
   */
  zOrder: (PartName | SkinExtra)[];

  /** Every eye kind must be drawn. `open` is the default. */
  eyes: Record<EyeKind, EyeArt>;
  /** Every mouth kind except `none` must be drawn. `smile` is the default. */
  mouth: Record<Exclude<MouthKind, 'none'>, Shape[]>;
  /** Optional; missing kinds simply show no brows. */
  brows?: Partial<Record<Exclude<BrowKind, 'none'>, Shape[]>>;

  anchors: SkinAnchors;

  /** Closed paths whose union is the whole cow's outline (clip for the fill view). */
  silhouette: string[];
  /** Same for the head alone (headOnly fill). */
  headSilhouette: string[];
  /** Liquid range in viewBox y: `bottom` = empty (hooves), `top` = full (horn tips). */
  fillRange: { top: number; bottom: number };
  headFillRange: { top: number; bottom: number };
  /** A few dark marks (eyes, nostrils, smile) drawn faintly over the fill view. */
  ghostFace: Shape[];

  /** Rotation multiplier when an arm track falls back to a front leg (default 0.55). */
  armFallbackGain?: number;
  /** How far the muzzle + mouth follow the `jaw` track (default 0.3, or 1 without a jaw part). */
  jawFollow?: number;
}

/* --------------------------------------------------------------- animations */

/**
 * How a value travels from the previous keyframe TO this one.
 * - linear, in, out, inOut: the usual (cubic) curves. inOut is the default.
 * - sine: soft pendulum ease, good for breathing and sways.
 * - outBack / inBack: overshoot at the end / wind-up at the start.
 * - outBounce: lands and bounces. outElastic: springy wobble into place.
 * - hold: stay on the previous value, then snap at this key.
 */
export type EasingName = 'linear' | 'in' | 'out' | 'inOut' | 'sine' | 'outBack' | 'inBack' | 'outBounce' | 'outElastic' | 'hold';

export const EASINGS: readonly EasingName[] = ['linear', 'in', 'out', 'inOut', 'sine', 'outBack', 'inBack', 'outBounce', 'outElastic', 'hold'];

/**
 * One keyframe. `t` is 0..1 across the animation. Only list what changes: each
 * property is interpolated on its own between the keys that mention it. Before a
 * property's first key it holds that key's value, after its last it holds the last.
 */
export interface Key {
  t: number;
  /** Degrees, clockwise. For a cow facing right, negative swings a limb forward / up. */
  rotate?: number;
  /** Offsets as a FRACTION OF THE COW'S WIDTH (0.1 = a tenth of the cow). +x right, +y down. */
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  /** Shorthand for scaleX and scaleY together. */
  scale?: number;
  opacity?: number;
  /** Easing used to arrive at this key (default inOut). */
  ease?: EasingName;
}

/**
 * What a track can drive. `root` is the whole cow (pivot: the ground between its feet).
 * `pupils` shifts the pupils inside the eyes (x / y only, keep within about 0.012).
 * `jaw` drops the jaw; skins without a jaw move the mouth instead.
 */
export type TrackName =
  | 'root'
  | 'body'
  | 'head'
  | 'earL'
  | 'earR'
  | 'tail'
  | 'legFL'
  | 'legFR'
  | 'legBL'
  | 'legBR'
  | 'udder'
  | 'armL'
  | 'armR'
  | 'eyes'
  | 'pupils'
  | 'jaw'
  | 'brows';

export const TRACK_NAMES: readonly TrackName[] = [
  'root',
  'body',
  'head',
  'earL',
  'earR',
  'tail',
  'legFL',
  'legFR',
  'legBL',
  'legBR',
  'udder',
  'armL',
  'armR',
  'eyes',
  'pupils',
  'jaw',
  'brows',
];

/** The face switches (no tween) to these at `t` and keeps them until the next entry. */
export interface ExpressionKey {
  t: number;
  eyes?: EyeKind;
  mouth?: MouthKind;
  brows?: BrowKind;
}

export type PropKind = 'sweat' | 'zzz' | 'grass' | 'crown' | 'sunglasses' | 'sparkle' | 'hearts' | 'dust' | 'bubble' | 'shock';

export type AnchorName = 'headTop' | 'eyeLine' | 'mouthPoint' | 'above' | 'feet';

/**
 * A prop appears at `from`, stays until `to` (both 0..1). Each kind has its own built-in
 * motion (the crown drops and bounces, zzz float up, sweat drips ...); see rig/props.tsx.
 * A cue whose `to` is 1 stays on screen when a play-once animation ends.
 */
export interface PropCue {
  kind: PropKind;
  from: number;
  to: number;
  /** Defaults per kind: crown headTop, sunglasses eyeLine, grass mouthPoint, dust feet, others above. */
  anchor?: AnchorName;
  /** Nudge from the anchor, as a fraction of the cow's width. */
  dx?: number;
  dy?: number;
  /** Size multiplier (default 1). */
  scale?: number;
  /** For `bubble`. */
  text?: string;
  /** How many times the built-in motion repeats inside the cue (sweat, zzz, hearts, sparkle; default 1). */
  repeat?: number;
}

export type AnimationCategory = 'alive' | 'eating' | 'reactions' | 'wins' | 'entrances' | 'setPieces';

export const CATEGORIES: readonly { id: AnimationCategory; name: string }[] = [
  { id: 'alive', name: 'Alive' },
  { id: 'eating', name: 'Eating' },
  { id: 'reactions', name: 'Reactions' },
  { id: 'wins', name: 'Wins' },
  { id: 'entrances', name: 'Entrances and exits' },
  { id: 'setPieces', name: 'Set pieces' },
];

export interface CowAnimation {
  id: string;
  name: string;
  category: AnimationCategory;
  /** Default play mode. Loops must end (t = 1) exactly where they start (t = 0). */
  loop: boolean;
  durationMs: number;
  tracks?: Partial<Record<TrackName, Key[]>>;
  expressions?: ExpressionKey[];
  props?: PropCue[];
  /** The frame (0..1) shown as a still when Reduce Motion is on. Pick the most readable pose. */
  restFrame: number;
  /**
   * The rig always layers a gentle breath and an occasional blink underneath.
   * Switch one off when it fights the animation (asleep, fainted, eyes held shut).
   */
  idle?: { breathe?: boolean; blink?: boolean };
}
