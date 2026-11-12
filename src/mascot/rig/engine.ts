/**
 * Turns CowAnimation data into flat per-property channels (once, cached) and samples
 * them on the UI thread. No React in here.
 */
import { BROW_KINDS, type CowAnimation, EASINGS, EYE_KINDS, type Key, MOUTH_KINDS, TRACK_NAMES, type TrackName } from './types';

export interface Channel {
  t: number[];
  v: number[];
  /** Easing code (index into EASINGS) used to arrive at each key. */
  e: number[];
}

export interface CompiledTrack {
  r?: Channel;
  x?: Channel;
  y?: Channel;
  sx?: Channel;
  sy?: Channel;
  o?: Channel;
}

/** Step timeline: at t[i] the value becomes k[i]. */
export interface Steps {
  t: number[];
  k: number[];
}

export interface Compiled {
  id: string;
  tracks: Partial<Record<TrackName, CompiledTrack>>;
  eyes: Steps;
  mouth: Steps;
  brows: Steps;
  /** 1 when the idle underlay is allowed, else 0. */
  breathe: number;
  blink: number;
}

const DEFAULT_EASE = EASINGS.indexOf('inOut');

function push(track: CompiledTrack, prop: keyof CompiledTrack, key: Key, value: number | undefined) {
  if (value == null) return;
  const ch = (track[prop] ??= { t: [], v: [], e: [] });
  ch.t.push(key.t);
  ch.v.push(value);
  ch.e.push(key.ease ? Math.max(0, EASINGS.indexOf(key.ease)) : DEFAULT_EASE);
}

function compileTrack(keys: Key[]): CompiledTrack {
  const track: CompiledTrack = {};
  for (const key of [...keys].sort((a, b) => a.t - b.t)) {
    push(track, 'r', key, key.rotate);
    push(track, 'x', key, key.x);
    push(track, 'y', key, key.y);
    push(track, 'sx', key, key.scaleX ?? key.scale);
    push(track, 'sy', key, key.scaleY ?? key.scale);
    push(track, 'o', key, key.opacity);
  }
  return track;
}

const cache = new Map<CowAnimation, Compiled>();

export function compile(anim: CowAnimation): Compiled {
  const hit = cache.get(anim);
  if (hit) return hit;
  const tracks: Compiled['tracks'] = {};
  for (const name of TRACK_NAMES) {
    const keys = anim.tracks?.[name];
    if (keys && keys.length) tracks[name] = compileTrack(keys);
  }
  const eyes: Steps = { t: [], k: [] };
  const mouth: Steps = { t: [], k: [] };
  const brows: Steps = { t: [], k: [] };
  for (const x of [...(anim.expressions ?? [])].sort((a, b) => a.t - b.t)) {
    if (x.eyes) {
      eyes.t.push(x.t);
      eyes.k.push(EYE_KINDS.indexOf(x.eyes));
    }
    if (x.mouth) {
      mouth.t.push(x.t);
      mouth.k.push(MOUTH_KINDS.indexOf(x.mouth));
    }
    if (x.brows) {
      brows.t.push(x.t);
      brows.k.push(BROW_KINDS.indexOf(x.brows));
    }
  }
  const out: Compiled = {
    id: anim.id,
    tracks,
    eyes,
    mouth,
    brows,
    breathe: anim.idle?.breathe === false ? 0 : 1,
    blink: anim.idle?.blink === false ? 0 : 1,
  };
  cache.set(anim, out);
  return out;
}

/* ------------------------------------------------------------------ worklets */

export function ease(code: number, u: number): number {
  'worklet';
  switch (code) {
    case 0: // linear
      return u;
    case 1: // in
      return u * u * u;
    case 2: // out
      return 1 - (1 - u) * (1 - u) * (1 - u);
    case 4: // sine
      return 0.5 - 0.5 * Math.cos(Math.PI * u);
    case 5: {
      // outBack
      const c = 1.70158;
      const v = u - 1;
      return 1 + (c + 1) * v * v * v + c * v * v;
    }
    case 6: {
      // inBack
      const c = 1.70158;
      return (c + 1) * u * u * u - c * u * u;
    }
    case 7: {
      // outBounce
      const n = 7.5625;
      const d = 2.75;
      let v = u;
      if (v < 1 / d) return n * v * v;
      if (v < 2 / d) {
        v -= 1.5 / d;
        return n * v * v + 0.75;
      }
      if (v < 2.5 / d) {
        v -= 2.25 / d;
        return n * v * v + 0.9375;
      }
      v -= 2.625 / d;
      return n * v * v + 0.984375;
    }
    case 8: // outElastic
      if (u <= 0) return 0;
      if (u >= 1) return 1;
      return Math.pow(2, -9 * u) * Math.sin(((u * 10 - 0.75) * (2 * Math.PI)) / 3) + 1;
    case 9: // hold
      return u >= 1 ? 1 : 0;
    default: // inOut (cubic)
      return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  }
}

export function sample(ch: Channel | undefined, t: number, fallback: number): number {
  'worklet';
  if (!ch) return fallback;
  const ts = ch.t;
  const n = ts.length;
  if (t <= (ts[0] as number)) return ch.v[0] as number;
  if (t >= (ts[n - 1] as number)) return ch.v[n - 1] as number;
  let i = 1;
  while ((ts[i] as number) < t) i++;
  const t0 = ts[i - 1] as number;
  const t1 = ts[i] as number;
  const v0 = ch.v[i - 1] as number;
  const v1 = ch.v[i] as number;
  const u = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
  return v0 + (v1 - v0) * ease(ch.e[i] as number, u);
}

/** Value of a step timeline at t (`fallback` before its first key). */
export function stepAt(steps: Steps, t: number, fallback: number): number {
  'worklet';
  let k = fallback;
  for (let i = 0; i < steps.t.length; i++) {
    if ((steps.t[i] as number) <= t) k = steps.k[i] as number;
    else break;
  }
  return k;
}

/** [rotate, x, y, scaleX, scaleY, opacity] */
export type Pose = [number, number, number, number, number, number];

/**
 * Samples the first of `names` that the animation has a track for. `gains[i]` scales the
 * rotation taken from `names[i]` (used when an arm track drives a leg).
 */
export function samplePart(c: Compiled, names: readonly TrackName[], gains: readonly number[], t: number): Pose {
  'worklet';
  for (let i = 0; i < names.length; i++) {
    const tr = c.tracks[names[i] as TrackName];
    if (tr) {
      return [sample(tr.r, t, 0) * (gains[i] as number), sample(tr.x, t, 0), sample(tr.y, t, 0), sample(tr.sx, t, 1), sample(tr.sy, t, 1), sample(tr.o, t, 1)];
    }
  }
  return [0, 0, 0, 1, 1, 1];
}

export interface RigState {
  cur: Compiled;
  prev: Compiled;
  /** Where the previous animation was frozen when this one took over. */
  prevT: number;
}

/** Current pose of a part, cross-settling from the previous animation while blend < 1. */
export function poseOf(s: RigState, names: readonly TrackName[], gains: readonly number[], t: number, blend: number): Pose {
  'worklet';
  const p = samplePart(s.cur, names, gains, t);
  if (blend >= 1) return p;
  const q = samplePart(s.prev, names, gains, s.prevT);
  for (let i = 0; i < 6; i++) p[i] = (q[i] as number) + ((p[i] as number) - (q[i] as number)) * blend;
  return p;
}
