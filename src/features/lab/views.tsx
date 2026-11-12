/** The Cow Lab's views: stage, animation grid, compare, fill, UFO, line-up, skin checks. */
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { Cow, type CowAnimation, CowRig, type CowSkin, getAnimation, UfoScene } from '../../mascot';
import { colors, radius, spacing } from '../../theme';
import { IconButton, LevelSlider, useUid } from './ui';

export const STAGE = 280;
const CELL = 96;
const CELL_W = 106;
/** Pause before a play-once animation starts again. */
const REPLAY_PAUSE_MS = 700;

/** `loop`: loops forever (play-once animations replay after a pause). `once`: play once and hold. `natural`: the animation's own setting, no replay. */
export type PlayMode = 'loop' | 'once' | 'natural';

/** Replays a play-once animation after a short pause while `on`. Returns the run counter and the done callback. */
function useReplay(on: boolean): [number, () => void] {
  const [run, setRun] = useState(0);
  const [waiting, setWaiting] = useState(0);
  useEffect(() => {
    if (!waiting || !on) return;
    const timer = setTimeout(() => setRun((r) => r + 1), REPLAY_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [waiting, on]);
  return [run, () => setWaiting((n) => n + 1)];
}

/** The big preview. */
export function Stage({ skin, animation, still, mode = 'loop', replay = 0, size = STAGE }: { skin: CowSkin; animation: CowAnimation; still: boolean; mode?: PlayMode; replay?: number; size?: number }) {
  const uid = useUid('lab');
  const [run, onDone] = useReplay(mode === 'loop');
  return (
    <View style={[styles.stage, { height: size * 1.38, paddingTop: size * 0.24 }]} testID="stage">
      <CowRig skin={skin} animation={animation} size={size} reduced={still} loop={mode === 'once' ? false : undefined} playKey={`${run}-${replay}`} onDone={onDone} uid={uid} />
    </View>
  );
}

/** Small live tiles for a set of animations on one skin. */
export function AnimGrid({ skinId, items, value, still, onPick }: { skinId: string; items: readonly CowAnimation[]; value: string; still: boolean; onPick: (id: string) => void }) {
  return (
    <View style={styles.grid} testID="anim-grid">
      {items.map((a) => (
        <Pressable
          key={a.id}
          accessibilityRole="button"
          accessibilityLabel={a.name}
          accessibilityState={{ selected: a.id === value }}
          onPress={() => onPick(a.id)}
          testID={`anim-${a.id}`}
          style={[styles.cell, a.id === value ? styles.cellOn : null]}
        >
          <Cow skin={skinId} animation={a.id} loop size={CELL} still={still} accessibilityLabel={a.name} />
          <AppText variant="small" center numberOfLines={1}>
            {a.name}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

/** Columns and tile width for an all-skins grid. */
function gridFor(width: number, count: number): { cols: number; tile: number } {
  const cols = width < 620 ? 2 : Math.min(count, 5);
  const tile = Math.floor((width - spacing.sm * (cols - 1)) / cols);
  return { cols, tile: Math.min(tile, 240) };
}

function SkinTile({ skin, tile, selected, onPress, children }: { skin: CowSkin; tile: number; selected: boolean; onPress?: () => void; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={skin.name} accessibilityState={{ selected }} onPress={onPress} testID={`tile-${skin.id}`} style={[styles.tile, { width: tile }, selected ? styles.tileOn : null]}>
      {children}
      <AppText variant="label" center numberOfLines={1} color={selected ? colors.primaryDark : colors.text}>
        {skin.name}
      </AppText>
    </Pressable>
  );
}

/** One animation on every skin, started together. */
export function CompareGrid({ skins, animation, still, width, selected, onPick, mode = 'loop' }: { skins: readonly CowSkin[]; animation: CowAnimation; still: boolean; width: number; selected: string; onPick?: (id: string) => void; mode?: PlayMode }) {
  const uid = useUid('cmp');
  const [run, onDone] = useReplay(mode === 'loop');
  const { tile } = gridFor(width, skins.length);
  const cow = Math.round(tile * 0.8);
  return (
    <View style={styles.tiles} testID="compare">
      {skins.map((s, i) => (
        <SkinTile key={s.id} skin={s} tile={tile} selected={s.id === selected} onPress={onPick ? () => onPick(s.id) : undefined}>
          <View style={[styles.tileArt, { height: tile * 0.92, paddingTop: cow * 0.2 }]}>
            <CowRig skin={s} animation={animation} size={cow} reduced={still} loop={mode === 'once' ? false : undefined} playKey={run} onDone={i === 0 ? onDone : undefined} uid={`${uid}${i}`} />
          </View>
        </SkinTile>
      ))}
    </View>
  );
}

const LEVELS = [0, 0.25, 0.5, 0.75, 1] as const;

/** The see-through fill: five fixed levels, one adjustable cow, and every skin at that level. */
export function FillView({ skins, skin, still, width, initial, onPick }: { skins: readonly CowSkin[]; skin: CowSkin; still: boolean; width: number; initial: number; onPick: (id: string) => void }) {
  const [level, setLevel] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
  };
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);
  const play = () => {
    if (playing) return stop();
    setPlaying(true);
    setLevel(0);
    let v = 0;
    timer.current = setInterval(() => {
      v = Math.min(1, Math.round((v + 0.05) * 100) / 100);
      setLevel(v);
      if (v >= 1) stop();
    }, 130);
  };
  const nudge = (d: number) => {
    stop();
    setLevel((v) => Math.max(0, Math.min(1, Math.round((v + d) * 100) / 100)));
  };
  const small = Math.min(120, Math.floor((width - spacing.xs * 4) / 5));
  const big = Math.min(260, width - spacing.xl * 2);
  const { tile } = gridFor(width, skins.length);
  return (
    <View style={styles.block} testID="fill">
      <View style={styles.levels} testID="fill-levels">
        {LEVELS.map((p) => (
          <Pressable key={p} accessibilityRole="button" accessibilityLabel={`${p * 100}%`} onPress={() => { stop(); setLevel(p); }} testID={`fill-level-${p * 100}`} style={styles.level}>
            <Cow skin={skin.id} size={small} progress={p} showFill still />
            <AppText variant="small" center>
              {p * 100}%
            </AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.center} testID="fill-main">
        <Cow skin={skin.id} size={big} progress={level} showFill still={still} />
        <AppText variant="heading" center testID="fill-value">
          {Math.round(level * 100)}%
        </AppText>
      </View>
      <View style={styles.controls}>
        <IconButton glyph={playing ? '■' : '▶'} label={playing ? 'Stop' : 'Play'} onPress={play} on={playing} testID="fill-play" />
        <IconButton glyph="−" label="Less" onPress={() => nudge(-0.05)} testID="fill-minus" />
        <LevelSlider value={level} onChange={(v) => { stop(); setLevel(v); }} testID="fill-slider" />
        <IconButton glyph="+" label="More" onPress={() => nudge(0.05)} testID="fill-plus" />
      </View>

      <View style={styles.tiles} testID="fill-all">
        {skins.map((s) => (
          <SkinTile key={s.id} skin={s} tile={tile} selected={s.id === skin.id} onPress={() => onPick(s.id)}>
            <View style={[styles.tileArt, styles.tileArtEnd, { height: tile * 0.8 }]}>
              <Cow skin={s.id} size={Math.round(tile * 0.72)} progress={level} showFill still={still} />
            </View>
          </SkinTile>
        ))}
      </View>
    </View>
  );
}

/** The abduction scene on the chosen skin, then on every skin. */
export function UfoView({ skins, skin, width, initial, onPick }: { skins: readonly CowSkin[]; skin: CowSkin; width: number; initial: boolean; onPick: (id: string) => void }) {
  const [active, setActive] = useState(initial);
  const { tile } = gridFor(width, skins.length);
  return (
    <View style={styles.block} testID="ufo">
      <View style={styles.center} testID="ufo-main">
        <UfoScene key={skin.id} size={Math.min(300, width - spacing.xl)} active={active} skin={skin.id} />
      </View>
      <View style={[styles.controls, styles.controlsCenter]}>
        <IconButton glyph={active ? '■' : '▶'} label={active ? 'Beam off' : 'Beam on'} onPress={() => setActive((v) => !v)} on={active} testID="ufo-toggle" />
      </View>
      <View style={styles.tiles} testID="ufo-all">
        {skins.map((s) => (
          <SkinTile key={s.id} skin={s} tile={tile} selected={s.id === skin.id} onPress={() => onPick(s.id)}>
            <UfoScene size={Math.round(tile * 0.86)} active={active} skin={s.id} />
          </SkinTile>
        ))}
      </View>
    </View>
  );
}

/**
 * Every skin in a row on one ground line at the same visual scale: each cow is sized so
 * the distance from its feet to the top of its outline is the same on screen.
 */
export function Lineup({ skins, still, width, selected, onPick }: { skins: readonly CowSkin[]; still: boolean; width: number; selected?: string; onPick?: (id: string) => void }) {
  const uid = useUid('line');
  const perRow = width < 620 ? 3 : skins.length;
  const rows: CowSkin[][] = [];
  skins.forEach((s, i) => {
    if (i % perRow === 0) rows.push([]);
    rows[rows.length - 1]?.push(s);
  });
  const gap = width < 620 ? spacing.sm : spacing.lg;
  const tall = (s: CowSkin) => Math.max(1, s.rootPivot[1] - s.fillRange.top);
  // Cow height in points: the largest that lets the widest row fit.
  const fit = Math.min(...rows.map((row) => (width - gap * (row.length - 1)) / row.reduce((sum, s) => sum + s.viewBox.w / tall(s), 0)));
  const H = Math.max(40, Math.min(250, Math.floor(fit)));
  let n = 0;
  return (
    <View style={styles.lineup} testID="lineup">
      {rows.map((row, r) => {
        const laid = row.map((s) => {
          const k = H / tall(s);
          return { s, k, w: Math.round(s.viewBox.w * k), above: (s.rootPivot[1] - s.viewBox.y) * k, below: (s.viewBox.y + s.viewBox.h - s.rootPivot[1]) * k, i: n++ };
        });
        const above = Math.max(...laid.map((c) => c.above));
        const below = Math.max(...laid.map((c) => c.below));
        return (
          <View key={r} style={[styles.lineRow, { gap }]}>
            {laid.map((c) => (
              <Pressable key={c.s.id} accessibilityRole="button" accessibilityLabel={c.s.name} disabled={!onPick} onPress={() => onPick?.(c.s.id)} testID={`lineup-${c.s.id}`} style={styles.lineCell}>
                <View style={{ width: c.w, height: above + below }}>
                  <View style={{ position: 'absolute', left: 0, top: above - c.above }}>
                    <CowRig skin={c.s} animation={getAnimation('breathe')} size={c.w} reduced={still} uid={`${uid}${c.i}`} />
                  </View>
                </View>
                <AppText variant="label" center numberOfLines={1} color={c.s.id === selected ? colors.primaryDark : colors.text}>
                  {c.s.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        );
      })}
    </View>
  );
}

/** One still cow showing a given face, for checking a skin's expression drawings. */
const FACES: CowAnimation[] = (
  [
    ['open', 'smile', 'none'],
    ['closed', 'flat', 'none'],
    ['wide', 'open', 'raised'],
    ['squint', 'flat', 'angry'],
    ['wonky', 'tongue', 'none'],
    ['happy', 'wavy', 'worried'],
  ] as const
).map(([eyes, mouth, brows]) => ({
  id: `face-${eyes}`,
  name: `${eyes} · ${mouth}${brows === 'none' ? '' : ` · ${brows}`}`,
  category: 'alive',
  loop: false,
  durationMs: 1,
  restFrame: 0,
  expressions: [{ t: 0, eyes, mouth, brows }],
}));

/** Limbs swung out and props on, to check pivots and anchors. */
const PIVOT_CHECK: CowAnimation = {
  id: 'pivot-check',
  name: 'pivots + anchors',
  category: 'alive',
  loop: false,
  durationMs: 1,
  restFrame: 0.5,
  tracks: {
    legFL: [{ t: 0, rotate: -40 }],
    legFR: [{ t: 0, rotate: -20 }],
    legBL: [{ t: 0, rotate: 35 }],
    legBR: [{ t: 0, rotate: 18 }],
    armR: [{ t: 0, rotate: -60 }],
    tail: [{ t: 0, rotate: 40 }],
    earL: [{ t: 0, rotate: 25 }],
    earR: [{ t: 0, rotate: -25 }],
    head: [{ t: 0, rotate: -10 }],
    jaw: [{ t: 0, y: 0.03 }],
  },
  props: [
    { kind: 'crown', from: 0, to: 1 },
    { kind: 'sunglasses', from: 0, to: 1 },
    { kind: 'grass', from: 0, to: 1 },
    { kind: 'zzz', from: 0, to: 1 },
    { kind: 'dust', from: 0, to: 1 },
  ],
};

/** The skin builders' check sheet: faces, pivots and anchors, fill, head fill, small size. */
export function Checks({ skin }: { skin: CowSkin }) {
  const uid = useUid('chk');
  return (
    <View style={styles.grid} testID="checks">
      {FACES.map((face, i) => (
        <View key={face.id} style={styles.check}>
          <CowRig skin={skin} animation={face} size={150} headOnly reduced uid={`${uid}f${i}`} />
          <AppText variant="small" center>
            {face.name}
          </AppText>
        </View>
      ))}
      <View style={styles.check}>
        <CowRig skin={skin} animation={PIVOT_CHECK} size={150} reduced uid={`${uid}p`} />
        <AppText variant="small" center>
          {PIVOT_CHECK.name}
        </AppText>
      </View>
      <View style={styles.check}>
        <Cow skin={skin.id} size={150} progress={0.6} showFill still />
        <AppText variant="small" center>
          fill 60%
        </AppText>
      </View>
      <View style={styles.check}>
        <Cow skin={skin.id} size={110} headOnly progress={0.5} showFill still />
        <AppText variant="small" center>
          head fill 50%
        </AppText>
      </View>
      <View style={styles.check}>
        <Cow skin={skin.id} size={96} still />
        <AppText variant="small" center>
          96 px
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  cell: { width: CELL_W, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent' },
  cellOn: { borderColor: colors.primary, backgroundColor: colors.surface },
  check: { alignItems: 'center', gap: spacing.xs, padding: spacing.xs },
  block: { gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.xs },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  tile: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: 'transparent' },
  tileOn: { borderColor: colors.primary },
  tileArt: { alignItems: 'center', justifyContent: 'center' },
  tileArtEnd: { justifyContent: 'flex-end' },
  levels: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  level: { alignItems: 'center', gap: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, maxWidth: 460, width: '100%', alignSelf: 'center' },
  controlsCenter: { justifyContent: 'center' },
  lineup: { backgroundColor: colors.background, paddingVertical: spacing.lg, gap: spacing.lg, alignItems: 'center' },
  lineRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  lineCell: { alignItems: 'center', gap: spacing.sm },
});
