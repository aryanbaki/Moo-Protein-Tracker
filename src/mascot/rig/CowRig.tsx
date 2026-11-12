/**
 * CowRig: draws any CowSkin and plays any CowAnimation on it.
 *
 * One Animated.View per part; Reanimated only ever touches transforms and opacity.
 * A single clock (`t`, 0..1) drives every part's worklet, which samples the animation's
 * keyframes directly, so there is no React re-render per frame. When the animation
 * changes, parts settle from where they were frozen into the new one (`blend`).
 */
import { Fragment, type ReactNode, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { compile, poseOf, type RigState, stepAt } from './engine';
import { fillStyle, type Frame, Layer, originOf } from './Layer';
import { propSpace, PropView } from './props';
import {
  BODY_RIDERS,
  BROW_KINDS,
  type BrowKind,
  type CowAnimation,
  type CowSkin,
  EYE_KINDS,
  type EyeKind,
  HEAD_PARTS,
  MOUTH_KINDS,
  type MouthKind,
  type PartName,
  type Pt,
  type Shape,
  type SkinExtra,
  type TrackName,
} from './types';

export interface CowRigProps {
  skin: CowSkin;
  animation: CowAnimation;
  /** Rendered width in points. */
  size: number;
  headOnly?: boolean;
  /** Overrides the animation's own `loop`. */
  loop?: boolean;
  /** Called when a play-once animation reaches its end (it then holds its last frame). */
  onDone?: () => void;
  /** Static presentation: the animation's `restFrame`, no idle. */
  reduced?: boolean;
  /** Change to restart the same animation. */
  playKey?: number | string;
  /** Unique id prefix for SVG clip paths. */
  uid: string;
}

interface Clock {
  state: SharedValue<RigState>;
  t: SharedValue<number>;
  blend: SharedValue<number>;
  breath: SharedValue<number>;
  blink: SharedValue<number>;
}

const BLEND_MS = 220;

/* What the always-on idle adds to a part. */
type Idle = 'none' | 'body' | 'head' | 'eyes';

interface Drive {
  names: readonly TrackName[];
  gains: readonly number[];
  /** -1 mirrors rotation and x. */
  sign: number;
  /** Scales x / y (the muzzle follows the jaw at a fraction). */
  follow: number;
  idle: Idle;
}

function usePartStyle(clock: Clock, drive: Drive, unit: number) {
  const { names, gains, sign, follow, idle } = drive;
  return useAnimatedStyle(() => {
    const s = clock.state.value;
    const p = poseOf(s, names, gains, clock.t.value, clock.blend.value);
    let y = p[2] * unit * follow;
    let sx = p[3];
    let sy = p[4];
    if (idle === 'body') {
      const b = clock.breath.value * s.cur.breathe;
      sx *= 1 + b * 0.008;
      sy *= 1 + b * 0.022;
    } else if (idle === 'head') {
      y -= clock.breath.value * s.cur.breathe * 0.00375 * unit;
    } else if (idle === 'eyes') {
      sy *= 1 - clock.blink.value * s.cur.blink * 0.9;
    }
    return {
      opacity: p[5],
      transform: [{ translateX: p[1] * unit * follow * sign }, { translateY: y }, { rotate: `${p[0] * sign * follow}deg` }, { scaleX: sx }, { scaleY: sy }],
    };
  });
}

type AnimStyle = ReturnType<typeof usePartStyle>;

function Group({ frame, pivot, style, children }: { frame: Frame; pivot: Pt; style?: AnimStyle; children?: ReactNode }) {
  return <Animated.View style={[fillStyle, { transformOrigin: originOf(frame, pivot) }, style]}>{children}</Animated.View>;
}

/** A part with its own track. */
function RigPart({ frame, clock, drive, pivot, shapes, children }: { frame: Frame; clock: Clock; drive: Drive; pivot: Pt; shapes?: readonly Shape[]; children?: ReactNode }) {
  const style = usePartStyle(clock, drive, frame.unit);
  return (
    <Group frame={frame} pivot={pivot} style={style}>
      {shapes && shapes.length ? <Layer shapes={shapes} frame={frame} /> : null}
      {children}
    </Group>
  );
}

/** One expression drawing; visible only while its kind is the active one. */
function Variant({ frame, clock, channel, index, fallback, shapes }: { frame: Frame; clock: Clock; channel: 'eyes' | 'mouth' | 'brows'; index: number; fallback: number; shapes: readonly Shape[] }) {
  const style = useAnimatedStyle(() => {
    const c = clock.state.value.cur;
    return { opacity: stepAt(c[channel], clock.t.value, fallback) === index ? 1 : 0 };
  });
  return (
    <Animated.View style={[fillStyle, style]}>
      <Layer shapes={shapes} frame={frame} />
    </Animated.View>
  );
}

/** An eyelid: drawn shut, scaled open from its top edge by the idle blink. */
function Lid({ frame, clock, pivot, shapes }: { frame: Frame; clock: Clock; pivot: Pt; shapes: readonly Shape[] }) {
  const style = useAnimatedStyle(() => {
    const b = clock.blink.value * clock.state.value.cur.blink;
    return { opacity: b > 0.02 ? 1 : 0, transform: [{ scaleY: b }] };
  });
  return (
    <Animated.View style={[fillStyle, { transformOrigin: originOf(frame, pivot) }, style]}>
      <Layer shapes={shapes} frame={frame} />
    </Animated.View>
  );
}

/** Ground shadow: tightens and fades as the cow lifts off. */
function Shadow({ frame, clock, at, dir }: { frame: Frame; clock: Clock; at: NonNullable<CowSkin['shadow']>; dir: number }) {
  const style = useAnimatedStyle(() => {
    const p = poseOf(clock.state.value, ROOT_NAMES, ONE, clock.t.value, clock.blend.value);
    const lift = Math.max(0, -p[2]);
    const s = Math.max(0.35, 1 - lift * 1.6);
    return { opacity: Math.max(0, 0.34 * p[5] * (1 - lift * 1.4)), transform: [{ translateX: p[1] * frame.unit * dir }, { scaleX: s * Math.abs(p[3]) }, { scaleY: s }] };
  });
  const { vb, k } = frame;
  const sw = at.rx * 2 * k;
  const sh = at.ry * 2 * k;
  return (
    <Animated.View style={[{ position: 'absolute', left: (at.cx - at.rx - vb.x) * k, top: (at.cy - at.ry - vb.y) * k, width: sw, height: sh }, style]}>
      <Svg width={sw} height={sh} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={`${frame.uid}-shadow`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#3B2F22" stopOpacity={1} />
            <Stop offset="0.55" stopColor="#3B2F22" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#3B2F22" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={50} cy={50} rx={50} ry={50} fill={`url(#${frame.uid}-shadow)`} />
      </Svg>
    </Animated.View>
  );
}

const ROOT_NAMES: readonly TrackName[] = ['root'];
const ONE: readonly number[] = [1];

function drive(names: readonly TrackName[], over: Partial<Drive> = {}): Drive {
  return { names, gains: over.gains ?? names.map(() => 1), sign: 1, follow: 1, idle: 'none', ...over };
}

/** The set of expression kinds an animation can show (so only those layers are mounted). */
function kindsUsed(anim: CowAnimation) {
  const eyes = new Set<EyeKind>(['open']);
  const mouth = new Set<MouthKind>(['smile']);
  const brows = new Set<BrowKind>();
  for (const x of anim.expressions ?? []) {
    if (x.eyes) eyes.add(x.eyes);
    if (x.mouth) mouth.add(x.mouth);
    if (x.brows) brows.add(x.brows);
  }
  return { eyes, mouth, brows };
}

export function CowRig({ skin, animation, size, headOnly = false, loop, onDone, reduced = false, playKey, uid }: CowRigProps) {
  const vb = headOnly ? skin.headBox : skin.viewBox;
  const w = size;
  const h = Math.round((size * vb.h) / vb.w);
  const k = size / vb.w;
  const unit = skin.viewBox.w * k;
  const frame = useMemo<Frame>(() => ({ vb, w, h, k, unit, uid, clips: skin.clips }), [vb, w, h, k, unit, uid, skin.clips]);

  const compiled = compile(animation);
  const state = useSharedValue<RigState>({ cur: compiled, prev: compiled, prevT: 0 });
  const t = useSharedValue(reduced ? animation.restFrame : 0);
  const blend = useSharedValue(1);
  const breath = useSharedValue(0);
  const blink = useSharedValue(0);
  const clock: Clock = { state, t, blend, breath, blink };

  const loops = loop ?? animation.loop;
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);
  const last = useRef(compiled);
  const mounted = useRef(false);

  // Start (or restart) the animation, settling from wherever the cow was.
  useEffect(() => {
    const next = compile(animation);
    cancelAnimation(t);
    cancelAnimation(blend);
    if (reduced) {
      state.value = { cur: next, prev: next, prevT: 0 };
      blend.value = 1;
      t.value = animation.restFrame;
      last.current = next;
      mounted.current = true;
      return;
    }
    const prevT = t.value;
    state.value = { cur: next, prev: last.current, prevT };
    last.current = next;
    if (mounted.current) {
      blend.value = 0;
      blend.value = withTiming(1, { duration: BLEND_MS, easing: Easing.out(Easing.cubic) });
    } else {
      blend.value = 1;
    }
    mounted.current = true;
    t.value = 0;
    const run = { duration: Math.max(1, animation.durationMs), easing: Easing.linear };
    if (loops) {
      t.value = withRepeat(withTiming(1, run), -1, false);
    } else {
      const done = () => doneRef.current?.();
      t.value = withTiming(1, run, (finished) => {
        if (finished) runOnJS(done)();
      });
    }
    // Shared values are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation, loops, reduced, playKey]);

  // The always-on idle: a slow breath and an occasional blink.
  useEffect(() => {
    if (reduced) {
      cancelAnimation(breath);
      cancelAnimation(blink);
      breath.value = 0;
      blink.value = 0;
      return;
    }
    breath.value = 0;
    breath.value = withRepeat(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), -1, true);
    const shut = () => withTiming(1, { duration: 70 });
    const open = () => withTiming(0, { duration: 110 });
    blink.value = withRepeat(
      withSequence(withDelay(2300, shut()), open(), withDelay(3100, shut()), open(), withDelay(160, shut()), open(), withDelay(900, withTiming(0, { duration: 1 }))),
      -1,
    );
    return () => {
      cancelAnimation(breath);
      cancelAnimation(blink);
    };
  }, [reduced, breath, blink]);

  useEffect(
    () => () => {
      cancelAnimation(t);
      cancelAnimation(blend);
    },
    [t, blend],
  );

  const flip = skin.facing === 'left';
  const rootStyle = usePartStyle(clock, flip ? ROOT_FLIP : ROOT, unit);
  const bodyStyle = usePartStyle(clock, flip ? BODY_FLIP : BODY, unit);
  const headStyle = usePartStyle(clock, flip ? HEAD_FLIP : HEAD, unit);

  // Mount only the expression layers this animation can show.
  const kinds = useMemo(() => {
    const used = kindsUsed(animation);
    return {
      eyes: EYE_KINDS.filter((e) => used.eyes.has(e)),
      mouth: MOUTH_KINDS.filter((m) => m !== 'none' && used.mouth.has(m)),
      brows: BROW_KINDS.filter((b) => b !== 'none' && used.brows.has(b)),
    };
  }, [animation]);

  const fallbackGain = skin.armFallbackGain ?? 0.55;
  const jawFollow = skin.jawFollow ?? (skin.parts.jaw ? 0.3 : 1);

  const renderPart = (name: PartName): ReactNode => {
    const part = skin.parts[name as keyof CowSkin['parts']];
    if (!part) return null;
    const sign = part.mirror ? -1 : 1;
    const g = part.rotateGain ?? 1;
    const own = (names: readonly TrackName[], over: Partial<Drive> = {}) => drive(names, { sign, gains: names.map(() => g), ...over });
    switch (name) {
      case 'body':
      case 'patches':
      case 'head':
        // Driven by their group (see below); nothing of their own to animate.
        return <Layer key={name} shapes={part.shapes} frame={frame} />;
      case 'legFL':
      case 'legFR': {
        const arm = name === 'legFL' ? 'armL' : 'armR';
        const d = skin.parts[arm] ? own([name]) : own([arm, name], { gains: [g * fallbackGain, g] });
        return <RigPart key={name} frame={frame} clock={clock} drive={d} pivot={part.pivot} shapes={part.shapes} />;
      }
      case 'eyes':
        return (
          <RigPart key={name} frame={frame} clock={clock} drive={own(['eyes'], { idle: skin.lids ? 'none' : 'eyes' })} pivot={part.pivot}>
            {skin.lids?.map((lid, i) => (
              <Lid key={`lid${i}`} frame={frame} clock={clock} pivot={lid.pivot} shapes={lid.shapes} />
            ))}
            {kinds.eyes.map((kind) => (
              <Variant key={kind} frame={frame} clock={clock} channel="eyes" index={EYE_KINDS.indexOf(kind)} fallback={0} shapes={skin.eyes[kind].shapes} />
            ))}
            <RigPart frame={frame} clock={clock} drive={PUPILS} pivot={part.pivot}>
              {kinds.eyes.map((kind) => {
                const pupils = skin.eyes[kind].pupils;
                return pupils && pupils.length ? <Variant key={kind} frame={frame} clock={clock} channel="eyes" index={EYE_KINDS.indexOf(kind)} fallback={0} shapes={pupils} /> : null;
              })}
            </RigPart>
          </RigPart>
        );
      case 'mouth':
        return (
          <RigPart key={name} frame={frame} clock={clock} drive={own(['jaw'], { follow: jawFollow })} pivot={part.pivot}>
            {kinds.mouth.map((kind) => (
              <Variant key={kind} frame={frame} clock={clock} channel="mouth" index={MOUTH_KINDS.indexOf(kind)} fallback={0} shapes={skin.mouth[kind as Exclude<MouthKind, 'none'>]} />
            ))}
          </RigPart>
        );
      case 'muzzle':
        return <RigPart key={name} frame={frame} clock={clock} drive={own(['jaw'], { follow: jawFollow })} pivot={part.pivot} shapes={part.shapes} />;
      case 'brows':
        return (
          <RigPart key={name} frame={frame} clock={clock} drive={own(['brows'])} pivot={part.pivot}>
            {kinds.brows.map((kind) => {
              const shapes = skin.brows?.[kind as Exclude<BrowKind, 'none'>];
              return shapes ? <Variant key={kind} frame={frame} clock={clock} channel="brows" index={BROW_KINDS.indexOf(kind)} fallback={0} shapes={shapes} /> : null;
            })}
          </RigPart>
        );
      default:
        return <RigPart key={name} frame={frame} clock={clock} drive={own([name as TrackName])} pivot={part.pivot} shapes={part.shapes} />;
    }
  };

  // Walk the z-order, wrapping runs of head parts / body riders in their group transform.
  const groups: { space: 'head' | 'body' | 'root'; nodes: ReactNode[] }[] = [];
  skin.zOrder.forEach((entry, i) => {
    let space: 'head' | 'body' | 'root';
    let node: ReactNode;
    if (typeof entry === 'string') {
      space = (HEAD_PARTS as readonly string[]).includes(entry) ? 'head' : (BODY_RIDERS as readonly string[]).includes(entry) ? 'body' : 'root';
      node = renderPart(entry);
    } else {
      space = (entry as SkinExtra).follows;
      node = <Layer key={`x${i}`} shapes={entry.shapes} frame={frame} />;
    }
    if (!node || (headOnly && space !== 'head')) return;
    const tail = groups[groups.length - 1];
    if (tail && tail.space === space) tail.nodes.push(node);
    else groups.push({ space, nodes: [node] });
  });

  const cues = animation.props ?? [];
  const cuesIn = (space: 'head' | 'root' | 'world') =>
    cues.map((cue, i) =>
      propSpace(cue.kind) === space && !(headOnly && (cue.anchor ?? (cue.kind === 'dust' ? 'feet' : '')) === 'feet') ? (
        <PropView key={`${animation.id}-${i}`} cue={cue} skin={skin} frame={frame} clock={clock} />
      ) : null,
    );
  const headCues = cuesIn('head');

  return (
    <View style={{ width: w, height: h }}>
      {skin.shadow && !headOnly ? <Shadow frame={frame} clock={clock} at={skin.shadow} dir={flip ? -1 : 1} /> : null}
      <Group frame={frame} pivot={skin.rootPivot} style={headOnly ? undefined : rootStyle}>
        {groups.map((g, i) =>
          g.space === 'root' ? (
            <Fragment key={`g${i}`}>{g.nodes}</Fragment>
          ) : (
            <Group key={`g${i}`} frame={frame} pivot={g.space === 'head' ? skin.parts.head.pivot : skin.parts.body.pivot} style={g.space === 'head' ? headStyle : bodyStyle}>
              {g.nodes}
            </Group>
          ),
        )}
        {headCues.some(Boolean) ? (
          <Group frame={frame} pivot={skin.parts.head.pivot} style={headStyle}>
            {headCues}
          </Group>
        ) : null}
        {cuesIn('root')}
      </Group>
      {cuesIn('world')}
    </View>
  );
}

const ROOT = drive(['root']);
const BODY = drive(['body'], { idle: 'body' });
const HEAD = drive(['head'], { idle: 'head' });
const PUPILS = drive(['pupils']);
const ROOT_FLIP = drive(['root'], { sign: -1 });
const BODY_FLIP = drive(['body'], { idle: 'body', sign: -1 });
const HEAD_FLIP = drive(['head'], { idle: 'head', sign: -1 });
