import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { AppText, Button, Card, Screen } from '../../components';
import { BarChart, type BarDatum } from '../../components/BarChart';
import { LineChart } from '../../components/LineChart';
import { presentPaywall, useBilling } from '../../features/billing';
import { kgToLb, lbToKg } from '../../features/goals';
import { currentStreak, useLog } from '../../features/log';
import {
  averages,
  bestStreak,
  bucketByDay,
  creatineConsistency,
  goalHitDays,
  lastDays,
  lastMonths,
  monthlyAverages,
  weightSeries,
  type Range,
} from '../../features/progress';
import { parseNumber } from '../../features/settings/export';
import { Field, Segmented } from '../../features/settings/ui';
import { localDay, parseDay } from '../../lib/date';
import { Cow } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors, radius, spacing } from '../../theme';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30, year: 365 };
const RANGE_LABEL: Record<Range, string> = { week: 'last 7 days', month: 'last 30 days', year: 'last 12 months' };

const dayName = (day: string) => {
  const d = parseDay(day);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const shortDate = (day: string) => {
  const d = parseDay(day);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
const round = (n: number) => String(Math.round(n));
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const commas = (n: number) => round(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function ProgressScreen() {
  const [range, setRange] = useState<Range>('week');
  const entries = useLog((s) => s.entries);
  const creatineLogs = useLog((s) => s.creatineLogs);
  const weightLogs = useLog((s) => s.weightLogs);
  const goals = useProfile((s) => s.goals);
  const creatine = useProfile((s) => s.creatine);
  const units = useProfile((s) => s.units);
  const isPremium = useBilling((s) => s.isPremium);

  const today = localDay();
  const goal = goals?.proteinG ?? 0;
  const locked = range !== 'week' && !isPremium;
  const hasAnyEntries = entries.length > 0;

  const chart = useMemo(() => {
    if (range === 'year') {
      const months = monthlyAverages(entries, lastMonths(today, 12));
      const data: BarDatum[] = months.map((m, i) => {
        const [y, mo] = m.month.split('-').map(Number);
        return {
          key: m.month,
          label: MONTHS[mo - 1][0],
          name: `${MONTHS[mo - 1]} ${y}${m.loggedDays ? ` (${plural(m.loggedDays, 'day')} logged)` : ''}`,
          value: m.avgProteinG,
          empty: m.loggedDays === 0,
          highlight: i === months.length - 1,
        };
      });
      const logged = months.filter((m) => m.loggedDays > 0);
      const met = logged.filter((m) => goal > 0 && m.avgProteinG >= goal).length;
      const summary = logged.length
        ? `Bar chart: average protein per logged day for each of the last 12 months. ${plural(logged.length, 'month')} with entries, ${met} at or above the ${round(goal)} gram goal.`
        : 'Bar chart: nothing logged in the last 12 months.';
      return { data, summary, title: 'Avg protein' };
    }
    const days = lastDays(today, RANGE_DAYS[range]);
    const totals = bucketByDay(entries, days);
    const data: BarDatum[] = totals.map((t, i) => {
      const d = parseDay(t.day);
      const fromEnd = totals.length - 1 - i;
      return {
        key: t.day,
        label: range === 'week' ? WEEKDAYS[d.getDay()].slice(0, 2) : fromEnd % 7 === 0 ? String(d.getDate()) : '',
        name: t.day === today ? `Today, ${shortDate(t.day)}` : dayName(t.day),
        value: t.proteinG,
        empty: t.entryCount === 0,
        highlight: t.day === today,
      };
    });
    const hit = totals.filter((t) => goal > 0 && t.proteinG >= goal).length;
    const logged = totals.filter((t) => t.entryCount > 0).length;
    const summary = `Bar chart: protein per day for the ${RANGE_LABEL[range]}. ${plural(logged, 'day')} logged, goal of ${round(goal)} grams reached on ${plural(hit, 'day')}. Today: ${round(totals[totals.length - 1]?.proteinG ?? 0)} grams.`;
    return { data, summary, title: 'Protein' };
  }, [entries, range, today, goal]);

  const stats = useMemo(() => {
    const days = lastDays(today, RANGE_DAYS[range]);
    return {
      current: currentStreak(entries, goal, today),
      best: bestStreak(entries, goal),
      hit: goalHitDays(entries, goal, days),
      avg: averages(entries, days),
      total: days.length,
    };
  }, [entries, goal, range, today]);

  const creatineStats = useMemo(() => creatineConsistency(creatineLogs, lastDays(today, 30)), [creatineLogs, today]);

  return (
    <Screen scroll edges={['top']}>
      <AppText variant="title" accessibilityRole="header">Progress</AppText>

      <Segmented
        accessibilityLabel="Time range"
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month', badge: isPremium ? undefined : '🔒' },
          { value: 'year', label: 'Year', badge: isPremium ? undefined : '🔒' },
        ]}
      />

      <Card style={styles.chartCard}>
        {!hasAnyEntries && !locked ? (
          <View style={styles.empty}>
            <Cow size={150} pose="shrug" accessibilityLabel="Moo the cow, shrugging. Nothing logged yet." />
          </View>
        ) : locked ? (
          <View>
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.blurred, Platform.OS === 'web' ? ({ filter: 'blur(7px)' } as object) : null]}
            >
              <BarChart data={chart.data} goal={goal} summary="" hint=" " inert />
            </View>
            <View style={styles.lock}>
              <Text style={styles.lockGlyph} accessibilityElementsHidden importantForAccessibility="no">🔒</Text>
              <Button title="Premium" accessibilityLabel={`${range === 'month' ? 'Month' : 'Year'} view is locked. Unlock with Premium`} onPress={() => presentPaywall('history')} style={styles.lockButton} />
            </View>
          </View>
        ) : (
          <>
            <AppText variant="label">{chart.title}</AppText>
            <BarChart data={chart.data} goal={goal} summary={chart.summary} />
          </>
        )}
      </Card>

      <View style={styles.grid}>
        <Stat label="Streak" value={plural(stats.current, 'day')} spoken={`Current streak: ${plural(stats.current, 'day')}`} />
        <Stat label="Best" value={plural(stats.best, 'day')} spoken={`Best streak: ${plural(stats.best, 'day')}`} />
        {locked ? null : (
          <>
            <Stat label="Goal days" value={`${stats.hit} / ${stats.total}`} spoken={`Goal days: ${stats.hit} of ${stats.total} in the ${range === 'year' ? 'last 365 days' : RANGE_LABEL[range]}`} />
            <Stat
              label="Avg protein"
              value={stats.avg.avgProteinG === null ? '—' : `${round(stats.avg.avgProteinG)} g`}
              spoken={stats.avg.avgProteinG === null ? 'Average protein: no data' : `Average protein: ${round(stats.avg.avgProteinG)} grams per logged day, over ${plural(stats.avg.loggedDays, 'day')}`}
            />
            <Stat
              label="Avg kcal"
              value={stats.avg.avgCalories === null ? '—' : commas(stats.avg.avgCalories)}
              spoken={stats.avg.avgCalories === null ? 'Average calories: no data' : `Average calories: ${round(stats.avg.avgCalories)} per logged day${goals ? `. Goal ${goals.calories}` : ''}`}
              wide
            />
          </>
        )}
      </View>

      {creatine.enabled ? (
        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="label" style={{ flex: 1 }}>Creatine</AppText>
            <AppText variant="label">{creatineStats.percent}%</AppText>
          </View>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Creatine taken on ${creatineStats.takenDays} of the last 30 days, ${creatineStats.percent} percent. Filled dots are days taken; the last dot is today.`}
            style={styles.dots}
          >
            {creatineStats.taken.map((on, i) => (
              <View key={i} style={styles.dotCell}>
                <View style={[styles.dot, on ? styles.dotOn : null, i === creatineStats.taken.length - 1 ? styles.dotToday : null]} />
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <WeightSection range={range} today={today} units={units} logs={weightLogs} />
    </Screen>
  );
}

/** A number and a label of two words at most. `spoken` carries the longer screen-reader version. */
function Stat({ label, value, spoken, wide }: { label: string; value: string; spoken: string; wide?: boolean }) {
  return (
    <Card style={[styles.stat, wide ? styles.statWide : null]}>
      <View accessible accessibilityLabel={spoken}>
        <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
        <AppText variant="caption">{label}</AppText>
      </View>
    </Card>
  );
}

function WeightSection({ range, today, units, logs }: { range: Range; today: string; units: 'metric' | 'imperial'; logs: { day: string; weightKg: number }[] }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const unit = units === 'metric' ? 'kg' : 'lb';
  const span = range === 'year' ? 365 : 90;
  const toDisplay = (kg: number) => (units === 'metric' ? kg : kgToLb(kg));
  const format = (kg: number) => `${(Math.round(toDisplay(kg) * 10) / 10).toFixed(1)} ${unit}`;

  const series = useMemo(() => weightSeries(logs, lastDays(today, span)[0], today), [logs, today, span]);
  const points = useMemo(() => {
    const start = series[0] ? parseDay(series[0].day).getTime() : 0;
    return series.map((w) => ({
      key: w.day,
      x: Math.round((parseDay(w.day).getTime() - start) / 86400000),
      value: Math.round((units === 'metric' ? w.weightKg : kgToLb(w.weightKg)) * 10) / 10,
      name: shortDate(w.day),
    }));
  }, [series, units]);

  const parsed = parseNumber(text);
  const kg = parsed === null ? null : units === 'metric' ? parsed : lbToKg(parsed);
  const valid = kg !== null && kg >= 25 && kg <= 350;
  const first = series[0];
  const last = series[series.length - 1];
  const change = first && last && first !== last ? toDisplay(last.weightKg) - toDisplay(first.weightKg) : null;

  const save = async () => {
    if (!valid || kg === null) return;
    const rounded = Math.round(kg * 100) / 100;
    await useLog.getState().logWeight(today, rounded);
    useProfile.getState().setAnswers({ weightKg: rounded });
    setOpen(false);
    setText('');
    setSaved(true);
  };

  return (
    <Card style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="label" style={{ flex: 1 }}>Weight</AppText>
        {change !== null ? (
          <AppText variant="label" accessibilityLabel={`Change since ${shortDate(first.day)}: ${change > 0 ? '+' : ''}${change.toFixed(1)} ${unit}`}>
            {`${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change).toFixed(1)} ${unit}`}
          </AppText>
        ) : null}
      </View>

      {points.length === 0 ? null : (
        <>
          <LineChart
            points={points}
            formatValue={(v) => `${v.toFixed(1)} ${unit}`}
            summary={`Line chart of weight. ${plural(points.length, 'weigh-in')}. Latest ${format(last.weightKg)} on ${shortDate(last.day)}.${change !== null ? ` Change since ${shortDate(first.day)}: ${change > 0 ? '+' : ''}${change.toFixed(1)} ${unit}.` : ''}`}
          />
        </>
      )}

      {open ? (
        <View style={{ gap: spacing.sm }}>
          <Field
            label="Weight"
            accessibilityLabel="Today's weight"
            value={text}
            onChangeText={(t) => {
              setText(t);
              setSaved(false);
            }}
            suffix={unit}
            keyboardType="decimal-pad"
            placeholder={units === 'metric' ? '80.0' : '176.0'}
            tone={text !== '' && !valid ? 'bad' : 'neutral'}
            note={text !== '' && !valid ? (units === 'metric' ? '25–350 kg' : '56–771 lb') : undefined}
          />
          <View style={styles.formButtons}>
            <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => { setOpen(false); setText(''); }} />
            <Button title="Save" style={{ flex: 1 }} disabled={!valid} onPress={() => void save()} />
          </View>
        </View>
      ) : (
        <Button
          title="Log"
          accessibilityLabel="Log weight"
          variant="secondary"
          onPress={() => {
            setOpen(true);
            setSaved(false);
          }}
        />
      )}
      {saved ? <AppText variant="caption" center accessibilityLiveRegion="polite">Saved</AppText> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  chartCard: { gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  blurred: { opacity: 0.35 },
  lock: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  lockGlyph: { fontSize: 40, lineHeight: 48 },
  lockButton: { alignSelf: 'center', minWidth: 180, marginTop: spacing.sm, minHeight: 50 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flexGrow: 1, flexBasis: '45%', minWidth: 140 },
  statWide: { flexBasis: '100%' },
  section: { gap: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', flexWrap: 'wrap' },
  dotCell: { width: '10%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { width: '62%', aspectRatio: 1, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  dotOn: { backgroundColor: colors.creatine, borderColor: colors.creatine },
  dotToday: { borderColor: colors.text },
  formButtons: { flexDirection: 'row', gap: spacing.sm },
});
