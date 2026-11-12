/**
 * Cow Lab (/dev/lab): choose a cow by looking. Pick a skin, browse every animation on it,
 * compare one animation across all skins, check the fill and the UFO scene, see the line-up.
 *
 * URL params (all optional):
 *   skin=<id>            selected skin
 *   anim=<id>            selected animation (stage, compare)
 *   view=browse|compare|fill|ufo|lineup|checks
 *   cat=<category id>    animation category shown in the grid (and toured)
 *   still=1              Reduce Motion look
 *   loop=0               stage plays once and holds instead of looping
 *   level=<0..100>       fill view: starting level
 *   beam=0               UFO view: start with the beam off
 *   tour=1               play every animation once in sequence with its name as a caption
 *                        (on the stage, or in the compare grid with view=compare); dwell=<ms>
 *   bare=1               hide the skin picker and tabs (clean screenshots and recordings)
 *   only=checks|stage    skin builders: just the check sheet / just the big preview
 * Test ids: stage, stage-name, checks, compare, fill, ufo, lineup, tour-caption, tour-done.
 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText, Card, Screen } from '../../components';
import { Chip, IconButton, SkinPicker } from '../../features/lab/ui';
import { AnimGrid, Checks, CompareGrid, FillView, Lineup, Stage, UfoView } from '../../features/lab/views';
import { ANIMATIONS, CATEGORIES, DEFAULT_ANIMATION_ID, DEFAULT_SKIN_ID, getAnimation, getSkin, SKINS } from '../../mascot';
import { colors, spacing } from '../../theme';

const VIEWS = [
  { id: 'browse', name: 'Moves' },
  { id: 'compare', name: 'Compare' },
  { id: 'fill', name: 'Fill' },
  { id: 'ufo', name: 'UFO' },
  { id: 'lineup', name: 'Line-up' },
  { id: 'checks', name: 'Checks' },
] as const;
type ViewId = (typeof VIEWS)[number]['id'];

/** Chip labels: the registry's names, shortened where they would not fit a phone. */
const CATEGORY_LABEL: Record<string, string> = { entrances: 'In & out' };

const MAX_W = 1100;
const TOUR_MS = 2200;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function Lab() {
  const raw = useLocalSearchParams();
  const p = (k: string) => one(raw[k] as string | string[] | undefined);
  const only = p('only');
  const tour = p('tour') === '1';
  const bare = p('bare') === '1';
  const dwell = Math.max(400, Number(p('dwell')) || TOUR_MS);

  const [skinId, setSkinId] = useState(getSkin(p('skin') ?? DEFAULT_SKIN_ID).id);
  const [animId, setAnimId] = useState(getAnimation(p('anim') ?? DEFAULT_ANIMATION_ID).id);
  const [still, setStill] = useState(p('still') === '1');
  const [loop, setLoop] = useState(p('loop') !== '0');
  const [replay, setReplay] = useState(0);
  const [view, setView] = useState<ViewId>(only === 'checks' ? 'checks' : (VIEWS.find((v) => v.id === p('view'))?.id ?? 'browse'));

  const skin = getSkin(skinId);
  const animation = getAnimation(animId);
  const groups = useMemo(() => CATEGORIES.map((c) => ({ ...c, items: ANIMATIONS.filter((a) => a.category === c.id) })).filter((g) => g.items.length), []);
  const catParam = groups.find((g) => g.id === p('cat'))?.id;
  const [cat, setCat] = useState<string>(catParam ?? animation.category);
  const group = groups.find((g) => g.id === cat) ?? groups[0];

  const pick = (id: string) => {
    const next = getAnimation(id);
    setAnimId(next.id);
    setCat(next.category);
    setReplay((n) => n + 1);
  };
  const step = (d: number) => {
    const i = ANIMATIONS.findIndex((a) => a.id === animId);
    const next = ANIMATIONS[(i + d + ANIMATIONS.length) % ANIMATIONS.length];
    if (next) pick(next.id);
  };

  // Tour: every animation (of `cat`, when given) once, in order, then stop on the last.
  const tourList = useMemo(() => (catParam ? ANIMATIONS.filter((a) => a.category === catParam) : ANIMATIONS), [catParam]);
  const [tourAt, setTourAt] = useState(0);
  const tourDone = tour && tourAt >= tourList.length;
  const touring = tour ? tourList[Math.min(tourAt, tourList.length - 1)] : undefined;
  useEffect(() => {
    if (!tour || tourAt >= tourList.length) return;
    // Play-once animations get to finish; loops get the standard dwell.
    const a = tourList[tourAt];
    const ms = a && !a.loop ? Math.min(4000, Math.max(dwell, a.durationMs + 300)) : dwell;
    const timer = setTimeout(() => setTourAt((n) => n + 1), ms);
    return () => clearTimeout(timer);
  }, [tour, tourAt, tourList, dwell]);

  const win = useWindowDimensions();
  const wide = win.width >= 900;
  const width = Math.min(win.width, MAX_W) - spacing.md * 2;

  const header =
    tour || bare ? null : (
      <View style={styles.header}>
        <SkinPicker
          skins={SKINS}
          value={skinId}
          onChange={setSkinId}
          trailing={<IconButton glyph="❚❚" glyphSize={13} label="Reduce Motion" on={still} onPress={() => setStill((v) => !v)} testID="toggle-still" />}
        />
        {only ? null : (
          <View style={styles.tabs}>
            {VIEWS.filter((v) => wide || v.id !== 'checks' || view === 'checks').map((v) => (
              <Chip key={v.id} small={!wide} label={v.name} on={v.id === view} onPress={() => setView(v.id)} testID={`view-${v.id}`} />
            ))}
          </View>
        )}
      </View>
    );

  if (touring) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.tour}>
          {view === 'compare' ? (
            <View style={{ width }}>
              <CompareGrid skins={SKINS} animation={touring} still={still} width={width} selected="" mode="natural" />
            </View>
          ) : (
            <>
              <AppText variant="label" center color={colors.textSecondary}>
                {skin.name}
              </AppText>
              <Stage skin={skin} animation={touring} still={still} mode="natural" />
            </>
          )}
          <AppText variant="caption" center testID="tour-caption">
            {touring.name}
          </AppText>
          {tourDone ? <View testID="tour-done" style={styles.marker} /> : null}
        </View>
      </Screen>
    );
  }

  const stage = (
    <View style={styles.stageBlock}>
      <Stage key={`${skinId}-${animId}`} skin={skin} animation={animation} still={still} mode={loop ? 'loop' : 'once'} replay={replay} />
      <View style={styles.nameRow}>
        {only ? null : <IconButton glyph="∞" glyphSize={26} label="Loop" on={loop} onPress={() => setLoop((v) => !v)} testID="stage-loop" />}
        <AppText variant="heading" center numberOfLines={1} testID="stage-name" style={styles.name}>
          {animation.name}
        </AppText>
        {only ? null : <IconButton glyph="↻" glyphSize={24} label="Replay" onPress={() => setReplay((n) => n + 1)} testID="stage-replay" />}
      </View>
    </View>
  );

  const browser = group ? (
    <>
      <View style={styles.cats}>
        {groups.map((g) => (
          <Chip key={g.id} small={!wide} label={CATEGORY_LABEL[g.id] ?? g.name} on={g.id === group.id} onPress={() => setCat(g.id)} testID={`cat-${g.id}`} />
        ))}
      </View>
      <AnimGrid key={group.id} skinId={skinId} items={group.items} value={animId} still={still} onPick={pick} />
    </>
  ) : null;

  let body;
  if (only === 'stage') {
    body = <ScrollView contentContainerStyle={styles.page}>{stage}</ScrollView>;
  } else if (view === 'browse' && wide) {
    body = (
      <View style={styles.split}>
        <View style={styles.splitStage}>
          <Card>{stage}</Card>
        </View>
        <ScrollView style={styles.flex} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          {browser}
        </ScrollView>
      </View>
    );
  } else if (view === 'browse') {
    body = (
      <>
        {stage}
        <ScrollView style={styles.flex} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          {browser}
        </ScrollView>
      </>
    );
  } else {
    body = (
      <ScrollView style={styles.flex} contentContainerStyle={[styles.page, view === 'lineup' ? styles.pageLineup : null]} showsVerticalScrollIndicator={false}>
        {view === 'compare' ? (
          <>
            <View style={styles.nameRow}>
              <IconButton glyph="‹" glyphSize={30} label="Previous animation" onPress={() => step(-1)} testID="compare-prev" />
              <AppText variant="heading" center numberOfLines={1} testID="compare-name" style={styles.name}>
                {animation.name}
              </AppText>
              <IconButton glyph="›" glyphSize={30} label="Next animation" onPress={() => step(1)} testID="compare-next" />
            </View>
            <CompareGrid skins={SKINS} animation={animation} still={still} width={width} selected={skinId} onPick={setSkinId} />
          </>
        ) : view === 'fill' ? (
          <FillView skins={SKINS} skin={skin} still={still} width={width} initial={Math.max(0, Math.min(100, Number(p('level') ?? 50) || 0)) / 100} onPick={setSkinId} />
        ) : view === 'ufo' ? (
          <UfoView skins={SKINS} skin={skin} width={width} initial={p('beam') !== '0'} onPick={setSkinId} />
        ) : view === 'lineup' ? (
          <Lineup skins={SKINS} still={still} width={width} selected={bare ? undefined : skinId} onPick={setSkinId} />
        ) : (
          <Checks skin={skin} />
        )}
      </ScrollView>
    );
  }

  return (
    <Screen style={styles.screen}>
      {header}
      <View style={styles.body}>{body}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: spacing.sm, paddingBottom: 0, gap: spacing.sm, overflow: 'hidden' },
  flex: { flex: 1 },
  header: { gap: spacing.sm, width: '100%', maxWidth: MAX_W, alignSelf: 'center' },
  tabs: { gap: 6, paddingHorizontal: spacing.md, justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap' },
  cats: { gap: 6, justifyContent: 'center', flexDirection: 'row', flexWrap: 'wrap' },
  body: { flex: 1, width: '100%', maxWidth: MAX_W, alignSelf: 'center' },
  page: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  pageLineup: { flexGrow: 1, justifyContent: 'center' },
  split: { flex: 1, flexDirection: 'row' },
  splitStage: { width: 380, paddingLeft: spacing.md },
  stageBlock: { gap: spacing.xs, paddingBottom: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.md },
  name: { minWidth: 180, flexShrink: 1 },
  tour: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  marker: { width: 1, height: 1 },
});
