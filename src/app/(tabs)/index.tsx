import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Card } from '../../components';
import { presentPaywall, useBilling } from '../../features/billing';
import { formatDose, isTakenOn } from '../../features/creatine';
import { AddSheet, type AddAction } from '../../features/home/AddSheet';
import { dayName, emptyLine, formatNumber, goalReachedLine, ratio, remainingLine } from '../../features/home/copy';
import { EntryRow } from '../../features/home/EntryRow';
import { successHaptic, tapHaptic, thumpHaptic } from '../../features/home/haptics';
import { MacroTile } from '../../features/home/MacroTile';
import { Segmented } from '../../features/home/Segmented';
import { UndoToast } from '../../features/home/UndoToast';
import { useToday } from '../../features/home/useToday';
import { WeekStrip } from '../../features/home/WeekStrip';
import { currentStreak, totalsForDays, useLog } from '../../features/log';
import { weekDays } from '../../lib/date';
import { Confetti, Cow, type CowPose } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors, fonts, radius, shadow, spacing } from '../../theme';
import type { FoodEntry } from '../../types';

type Range = 'day' | 'week';

const FILL_MS = 3500;
const CHEW_MS = 1800;
const FLEX_MS = 1800;
const DANCE_MS = 3500;

export default function Home() {
  const today = useToday();
  const entries = useLog((s) => s.entries);
  const creatineLogs = useLog((s) => s.creatineLogs);
  const goals = useProfile((s) => s.goals);
  const creatine = useProfile((s) => s.creatine);
  const isPremium = useBilling((s) => s.isPremium);

  const [selectedDay, setSelectedDay] = useState(today);
  const [range, setRange] = useState<Range>('day');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showFill, setShowFill] = useState(false);
  const [pose, setPose] = useState<CowPose>('idle');
  const [confettiKey, setConfettiKey] = useState(0);
  const [undo, setUndo] = useState<{ id: string; name: string } | null>(null);

  // If midnight passes while the app is open, follow the new day.
  const lastToday = useRef(today);
  useEffect(() => {
    if (lastToday.current !== today) {
      setSelectedDay((d) => (d === lastToday.current ? today : d));
      lastToday.current = today;
    }
  }, [today]);

  const week = useMemo(() => weekDays(today), [today]);
  const weekTotals = useMemo(() => totalsForDays(entries, week), [entries, week]);
  const dayTotals = useMemo(() => totalsForDays(entries, [selectedDay])[0]!, [entries, selectedDay]);
  const weekSum = useMemo(
    () => weekTotals.reduce((a, t) => ({ proteinG: a.proteinG + t.proteinG, calories: a.calories + t.calories, carbsG: a.carbsG + t.carbsG, fatG: a.fatG + t.fatG }), { proteinG: 0, calories: 0, carbsG: 0, fatG: 0 }),
    [weekTotals],
  );
  const dayEntries = useMemo(() => entries.filter((e) => e.day === selectedDay), [entries, selectedDay]);

  // A goal of 0 (or a broken one) is treated as "no goal" so nothing divides by zero.
  const proteinGoal = goals && goals.proteinG > 0 ? goals.proteinG : null;
  const streak = useMemo(() => (proteinGoal ? currentStreak(entries, proteinGoal, today) : 0), [entries, proteinGoal, today]);

  const isWeek = range === 'week';
  const isToday = selectedDay === today;
  const mult = isWeek ? 7 : 1;
  const shown = isWeek ? weekSum : dayTotals;
  const shownGoal = proteinGoal ? proteinGoal * mult : null;
  const progress = ratio(shown.proteinG, shownGoal);
  const dayMet = !!proteinGoal && dayTotals.proteinG >= proteinGoal;
  const goalMet = !!shownGoal && shown.proteinG >= shownGoal;

  /* ---- Cow reactions ---- */
  const fillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (fillTimer.current) clearTimeout(fillTimer.current);
      if (poseTimer.current) clearTimeout(poseTimer.current);
    },
    [],
  );

  const flashFill = useCallback(() => {
    setShowFill(true);
    if (fillTimer.current) clearTimeout(fillTimer.current);
    fillTimer.current = setTimeout(() => setShowFill(false), FILL_MS);
  }, []);

  const strike = useCallback((next: CowPose, ms: number) => {
    setPose(next);
    if (poseTimer.current) clearTimeout(poseTimer.current);
    poseTimer.current = setTimeout(() => setPose('idle'), ms);
  }, []);

  // Anything logged, edited or removed today: show the fill. More protein: chew. Crossing the goal: party.
  const todayProtein = useMemo(() => totalsForDays(entries, [today])[0]!, [entries, today]);
  const seen = useRef({ day: today, protein: todayProtein.proteinG, count: todayProtein.entryCount });
  useEffect(() => {
    const prev = seen.current;
    seen.current = { day: today, protein: todayProtein.proteinG, count: todayProtein.entryCount };
    if (prev.day !== today) return;
    if (prev.protein === todayProtein.proteinG && prev.count === todayProtein.entryCount) return;
    flashFill();
    const crossed = !!proteinGoal && prev.protein < proteinGoal && todayProtein.proteinG >= proteinGoal;
    if (crossed) {
      setConfettiKey((k) => k + 1);
      strike('dance', DANCE_MS);
      successHaptic();
    } else if (todayProtein.proteinG > prev.protein || todayProtein.entryCount > prev.count) {
      strike('chew', CHEW_MS);
    }
  }, [todayProtein.proteinG, todayProtein.entryCount, today, proteinGoal, flashFill, strike]);

  /* ---- Actions ---- */
  const onCowPress = () => {
    tapHaptic();
    flashFill();
  };

  const onRange = (next: Range) => {
    if (next === 'week' && !isPremium) {
      presentPaywall('weekly');
      return;
    }
    setRange(next);
    if (next === 'week') setSelectedDay(today);
    flashFill();
  };

  const onSelectDay = (day: string) => {
    setSelectedDay(day);
    setRange('day');
    flashFill();
  };

  const takenToday = isTakenOn(creatineLogs, today);
  const onCreatine = () => {
    const next = !takenToday;
    void useLog
      .getState()
      .setCreatineTaken(today, creatine.doseG, next)
      .catch(() => undefined);
    if (next) {
      thumpHaptic();
      strike('flex', FLEX_MS);
    } else {
      tapHaptic();
    }
  };

  const onPick = (action: AddAction) => {
    setSheetOpen(false);
    if (action === 'photo' || action === 'barcode') {
      router.push({ pathname: '/scan', params: { mode: action } });
    } else {
      router.push({ pathname: '/entry', params: isToday ? { mode: action } : { mode: action, day: selectedDay } });
    }
  };

  const onDelete = useCallback((entry: FoodEntry) => {
    thumpHaptic();
    setUndo({ id: entry.id, name: entry.name });
    void useLog
      .getState()
      .deleteEntry(entry.id)
      .catch(() => setUndo(null));
  }, []);

  const onUndo = () => {
    if (undo) void useLog.getState().restoreEntry(undo.id).catch(() => undefined);
    setUndo(null);
  };
  const dismissUndo = useCallback(() => setUndo(null), []);
  const onEdit = useCallback((entry: FoodEntry) => router.push({ pathname: '/entry', params: { id: entry.id } }), []);

  /* ---- Words ---- */
  const scopeLabel = isWeek ? 'protein this week' : isToday ? 'protein today' : `protein on ${dayName(selectedDay)}`;
  const headline = !isWeek && dayMet ? goalReachedLine(selectedDay) : isWeek && goalMet ? 'A whole week, fully loaded!' : null;
  const percent = Math.round(progress * 100);
  const cowLabel = shownGoal
    ? `Moo the cow, ${percent} percent full: ${formatNumber(shown.proteinG)} of ${formatNumber(shownGoal)} grams of ${scopeLabel}. Tap to see the fill.`
    : `Moo the cow. ${formatNumber(shown.proteinG)} grams of ${scopeLabel}. No goal set yet.`;
  const listTitle = isToday ? 'Today' : dayName(selectedDay);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <WeekStrip days={week} totals={weekTotals} today={today} selected={isWeek ? '' : selectedDay} goalG={proteinGoal} onSelect={onSelectDay} />
          <View
            style={[styles.streak, streak > 0 ? styles.streakLit : null]}
            accessible
            accessibilityLabel={streak === 1 ? '1 day streak' : `${streak} day streak`}
            testID="streak"
          >
            <AppText style={{ fontSize: 16, opacity: streak > 0 ? 1 : 0.45 }}>🔥</AppText>
            <AppText variant="label" style={{ fontFamily: fonts.black }} color={streak > 0 ? colors.text : colors.textSecondary}>
              {streak}
            </AppText>
          </View>
        </View>

        <View style={styles.readout} accessible accessibilityRole="text" accessibilityLabel={shownGoal ? `${formatNumber(shown.proteinG)} grams of ${formatNumber(shownGoal)} grams, ${scopeLabel}. ${remainingLine(shown.proteinG, shownGoal)}.` : `${formatNumber(shown.proteinG)} grams, ${scopeLabel}.`}>
          {headline ? (
            <AppText variant="heading" center color={colors.primary} style={styles.headline} testID="goal-headline">
              {headline}
            </AppText>
          ) : null}
          <AppText center testID="readout">
            <AppText variant="display" style={styles.big}>
              {formatNumber(shown.proteinG)}
            </AppText>
            <AppText variant="heading" color={colors.textSecondary} style={styles.of}>
              {shownGoal ? ` g of ${formatNumber(shownGoal)} g` : ' g'}
            </AppText>
          </AppText>
          <AppText variant="caption" center>
            {scopeLabel}
            {shownGoal ? ` · ${remainingLine(shown.proteinG, shownGoal)}` : ''}
          </AppText>
        </View>

        <View style={styles.stage}>
          <Confetti fireKey={confettiKey} />
          <Pressable onPress={onCowPress} accessibilityRole="button" accessibilityLabel={cowLabel} testID="cow">
            <Cow size={230} pose={goalMet && pose === 'idle' && showFill ? 'dance' : pose} progress={progress} showFill={showFill} accessibilityLabel={cowLabel} />
          </Pressable>
        </View>

        {!isToday && !isWeek ? (
          <Pressable onPress={() => onSelectDay(today)} accessibilityRole="button" style={styles.backToday} testID="back-to-today">
            <AppText variant="label" color={colors.primaryDark}>
              ← Back to today
            </AppText>
          </Pressable>
        ) : null}

        <Segmented<Range>
          accessibilityLabel="Show protein for"
          value={range}
          onChange={onRange}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week', badge: isPremium ? undefined : 'premium' },
          ]}
        />

        {!proteinGoal ? (
          <Card style={styles.noGoal}>
            <AppText variant="label" style={{ fontSize: 18 }}>
              Moo needs a target
            </AppText>
            <AppText variant="caption">Set a daily protein goal so the cow knows when she is full. You can still log food in the meantime.</AppText>
            <Button title="Set a goal" onPress={() => router.push('/settings')} testID="set-goal" />
          </Card>
        ) : null}

        <View style={styles.tiles}>
          <MacroTile label="Calories" unit="" value={shown.calories} goal={goals && goals.calories > 0 ? goals.calories * mult : null} color={colors.calories} />
          <MacroTile label="Carbs" unit="g" value={shown.carbsG} goal={goals && goals.carbsG > 0 ? goals.carbsG * mult : null} color={colors.carbs} />
          <MacroTile label="Fat" unit="g" value={shown.fatG} goal={goals && goals.fatG > 0 ? goals.fatG * mult : null} color={colors.fat} />
        </View>

        {creatine.enabled && isToday ? (
          <Pressable
            onPress={onCreatine}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: takenToday }}
            aria-checked={takenToday}
            accessibilityLabel={`Creatine ${formatDose(creatine.doseG)}, ${takenToday ? 'taken today' : 'not taken yet today'}`}
            style={({ pressed }) => [styles.creatine, takenToday ? styles.creatineDone : null, pressed ? { opacity: 0.85 } : null]}
            testID="creatine-chip"
          >
            <View style={[styles.checkbox, takenToday ? styles.checkboxOn : null]}>
              {takenToday ? (
                <AppText variant="label" color={colors.textOnPrimary} style={{ lineHeight: 20 }}>
                  ✓
                </AppText>
              ) : null}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="label">Creatine {formatDose(creatine.doseG)}</AppText>
              <AppText variant="small">{takenToday ? 'Done for today. Flex approved.' : 'Tap when you have taken it'}</AppText>
            </View>
            <AppText style={{ fontSize: 22 }}>{takenToday ? '💪' : '🥄'}</AppText>
          </Pressable>
        ) : null}

        <View style={styles.listHeader}>
          <AppText variant="heading" accessibilityRole="header" style={{ fontSize: 22 }}>
            {listTitle}
          </AppText>
          {dayEntries.length > 0 ? (
            <AppText variant="caption">
              {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'} · swipe left to delete
            </AppText>
          ) : null}
        </View>

        {dayEntries.length === 0 ? (
          <Card style={styles.empty}>
            <AppText style={{ fontSize: 34 }}>🌾</AppText>
            <AppText variant="label" center style={{ fontSize: 18 }}>
              “{emptyLine(selectedDay)}”
            </AppText>
            <AppText variant="caption" center>
              {isToday ? 'Nothing logged yet today.' : `Nothing logged on ${dayName(selectedDay)}.`}
            </AppText>
            <Button title={isToday ? 'Log my first bite' : 'Add something'} onPress={() => setSheetOpen(true)} style={{ alignSelf: 'stretch' }} testID="empty-add" />
          </Card>
        ) : (
          <View style={styles.list}>
            {dayEntries.map((e) => (
              <EntryRow key={e.id} entry={e} onPress={onEdit} onDelete={onDelete} />
            ))}
          </View>
        )}
      </ScrollView>

      <UndoToast message={undo ? `Deleted ${undo.name}` : null} onUndo={onUndo} onDismiss={dismissUndo} bottom={spacing.md + 6} />

      <Pressable
        onPress={() => {
          tapHaptic();
          setSheetOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add food"
        style={({ pressed }) => [styles.fab, pressed ? { transform: [{ scale: 0.94 }] } : null]}
        testID="fab"
      >
        <AppText style={styles.fabPlus}>+</AppText>
      </Pressable>

      <AddSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onPick={onPick} dayLabel={isToday ? null : dayName(selectedDay)} />
    </SafeAreaView>
  );
}

const FAB = 64;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md + 4, paddingTop: spacing.sm, paddingBottom: FAB + spacing.xl, gap: spacing.md, width: '100%', maxWidth: 560, alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: spacing.sm + 4, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  streakLit: { backgroundColor: '#FFE7C2' },
  readout: { alignItems: 'center', gap: 0 },
  headline: { fontSize: 24, marginBottom: 2 },
  big: { fontSize: 60, lineHeight: 66 },
  of: { fontSize: 22 },
  stage: { alignItems: 'center', justifyContent: 'center', minHeight: 190 },
  backToday: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
  noGoal: { gap: spacing.sm, borderWidth: 2, borderColor: colors.primarySoft },
  tiles: { flexDirection: 'row', gap: spacing.sm + 2 },
  creatine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.creatine },
  creatineDone: { backgroundColor: '#EFE9FB' },
  checkbox: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: colors.creatine, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.creatine },
  listHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.xs },
  list: { gap: spacing.sm + 2 },
  empty: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  fab: { position: 'absolute', right: spacing.md + 4, bottom: spacing.md, width: FAB, height: FAB, borderRadius: FAB / 2, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', ...shadow.card, shadowOpacity: 0.25, elevation: 6 },
  fabPlus: { color: colors.textOnPrimary, fontFamily: fonts.bold, fontSize: 36, lineHeight: 40 },
});
