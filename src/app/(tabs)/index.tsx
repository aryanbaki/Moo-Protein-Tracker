import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '../../components';
import { presentPaywall, useBilling } from '../../features/billing';
import { formatDose, isTakenOn } from '../../features/creatine';
import { AddSheet, type AddAction } from '../../features/home/AddSheet';
import { useAddSheet } from '../../features/home/addSheetStore';
import { dayName, formatNumber, ratio, remainingLine } from '../../features/home/copy';
import { EntryRow } from '../../features/home/EntryRow';
import { successHaptic, tapHaptic, thumpHaptic } from '../../features/home/haptics';
import { Icon } from '../../features/home/icons';
import { MacroTile } from '../../features/home/MacroTile';
import { Segmented } from '../../features/home/Segmented';
import { UndoToast } from '../../features/home/UndoToast';
import { useToday } from '../../features/home/useToday';
import { WeekStrip } from '../../features/home/WeekStrip';
import { currentStreak, totalsForDays, useLog } from '../../features/log';
import { weekDays } from '../../lib/date';
import { Confetti, Cow, type CowPose } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors, fonts, radius, spacing } from '../../theme';
import type { FoodEntry } from '../../types';

type Range = 'day' | 'week';

const FILL_MS = 3500;
const CHEW_MS = 1800;
const FLEX_MS = 1800;
const DANCE_MS = 3500;
const GOAL_FILL_MS = 1200;

export default function Home() {
  const today = useToday();
  const entries = useLog((s) => s.entries);
  const creatineLogs = useLog((s) => s.creatineLogs);
  const goals = useProfile((s) => s.goals);
  const creatine = useProfile((s) => s.creatine);
  const isPremium = useBilling((s) => s.isPremium);

  const [selectedDay, setSelectedDay] = useState(today);
  const [range, setRange] = useState<Range>('day');
  const sheetOpen = useAddSheet((s) => s.open);
  const setSheetOpen = useAddSheet((s) => s.setOpen);
  const { width, height } = useWindowDimensions();
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

  const flashFill = useCallback((ms: number = FILL_MS) => {
    setShowFill(true);
    if (fillTimer.current) clearTimeout(fillTimer.current);
    fillTimer.current = setTimeout(() => setShowFill(false), ms);
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
    const crossed = !!proteinGoal && prev.protein < proteinGoal && todayProtein.proteinG >= proteinGoal;
    // On reaching the goal the fill is brief, so the dance is what you see.
    flashFill(crossed ? GOAL_FILL_MS : FILL_MS);
    if (crossed) {
      setConfettiKey((k) => k + 1);
      strike('dance', GOAL_FILL_MS + DANCE_MS);
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
  // Spoken only. On screen there is just the number and the goal.
  const scopeLabel = isWeek ? 'protein this week' : isToday ? 'protein today' : `protein on ${dayName(selectedDay)}`;
  const percent = Math.round(progress * 100);
  const cowLabel = shownGoal
    ? `Moo the cow, ${percent} percent full: ${formatNumber(shown.proteinG)} of ${formatNumber(shownGoal)} grams of ${scopeLabel}.${dayEntries.length === 0 && !isWeek ? ' Nothing logged yet.' : ''}`
    : `Moo the cow. ${formatNumber(shown.proteinG)} grams of ${scopeLabel}. No goal set yet.`;
  const listTitle = isToday ? 'Today' : dayName(selectedDay);
  const cowSize = Math.round(Math.max(220, Math.min(300, width - 96, height * 0.34)));

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
            <Icon name="flame" size={18} color={streak > 0 ? colors.calories : colors.textSecondary} />
            <AppText variant="label" style={{ fontFamily: fonts.black }} color={streak > 0 ? colors.text : colors.textSecondary}>
              {streak}
            </AppText>
          </View>
        </View>

        <View style={styles.readout} accessible accessibilityRole="text" accessibilityLabel={shownGoal ? `${formatNumber(shown.proteinG)} grams of ${formatNumber(shownGoal)} grams, ${scopeLabel}. ${remainingLine(shown.proteinG, shownGoal)}.` : `${formatNumber(shown.proteinG)} grams, ${scopeLabel}.`}>
          <AppText center testID="readout">
            <AppText variant="display" color={goalMet ? colors.good : colors.text} style={styles.big}>
              {formatNumber(shown.proteinG)}
            </AppText>
            <AppText variant="heading" color={colors.textSecondary} style={styles.of}>
              {shownGoal ? ` / ${formatNumber(shownGoal)} g` : ' g'}
            </AppText>
          </AppText>
          <AppText variant="small" center style={styles.unitLabel}>
            protein
          </AppText>
        </View>

        <View style={styles.stage}>
          <Confetti fireKey={confettiKey} />
          <Pressable onPress={onCowPress} accessibilityRole="button" accessibilityLabel={cowLabel} accessibilityHint="Shows how full the cow is" testID="cow">
            <Cow size={cowSize} pose={goalMet && pose === 'idle' && showFill ? 'dance' : pose} progress={progress} showFill={showFill} accessibilityLabel={cowLabel} />
          </Pressable>
        </View>

        <Segmented<Range>
          accessibilityLabel="Show protein for"
          value={range}
          onChange={onRange}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week', badge: isPremium ? undefined : 'premium' },
          ]}
        />

        {!proteinGoal ? <Button title="Set goal" variant="secondary" onPress={() => router.push('/settings')} testID="set-goal" /> : null}

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
            <View style={[styles.checkbox, takenToday ? styles.checkboxOn : null]}>{takenToday ? <Icon name="check" size={18} color={colors.textOnPrimary} strokeWidth={3} /> : null}</View>
            <AppText variant="label" style={{ flex: 1 }}>
              Creatine {formatDose(creatine.doseG)}
            </AppText>
          </Pressable>
        ) : null}

        {dayEntries.length > 0 ? (
          <>
            <AppText variant="heading" accessibilityRole="header" style={styles.listTitle}>
              {listTitle}
            </AppText>
            <View style={styles.list}>
              {dayEntries.map((e) => (
                <EntryRow key={e.id} entry={e} onPress={onEdit} onDelete={onDelete} />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <UndoToast message={undo ? 'Deleted' : null} accessibilityLabel={undo ? `Deleted ${undo.name}` : undefined} onUndo={onUndo} onDismiss={dismissUndo} bottom={spacing.md} />

      <AddSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onPick={onPick} dayLabel={isToday ? null : dayName(selectedDay)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md + 4, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 560, alignSelf: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: spacing.sm + 4, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  streakLit: { backgroundColor: '#FFE7C2' },
  readout: { alignItems: 'center', gap: 0, marginTop: spacing.sm },
  big: { fontSize: 68, lineHeight: 72 },
  of: { fontSize: 24 },
  unitLabel: { letterSpacing: 1.5, textTransform: 'uppercase' },
  stage: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  tiles: { flexDirection: 'row', gap: spacing.sm + 2 },
  creatine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.creatine },
  creatineDone: { backgroundColor: '#EFE9FB' },
  checkbox: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: colors.creatine, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.creatine },
  listTitle: { fontSize: 22, marginTop: spacing.xs },
  list: { gap: spacing.sm + 2 },
});
