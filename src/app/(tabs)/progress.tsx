import { useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

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
      return { data, summary, title: 'Average protein per logged day, by month' };
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
    return { data, summary, title: `Protein per day, ${RANGE_LABEL[range]}` };
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
        <AppText variant="label">{chart.title}</AppText>
        {!hasAnyEntries && !locked ? (
          <View style={styles.empty}>
            <Cow size={130} pose="shrug" accessibilityLabel="Moo the cow, shrugging" />
            <AppText variant="label" center>Nothing to chew on yet</AppText>
            <AppText variant="caption" center>Log some protein and these bars will start growing. The cow is ready when you are.</AppText>
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
              <Cow size={84} pose="crown" accessibilityLabel="Moo the cow wearing a crown" />
              <AppText variant="label" center>{range === 'month' ? 'Month view is a Premium thing' : 'Year view is a Premium thing'}</AppText>
              <AppText variant="caption" center>Your data is safe in the barn. Premium opens the long view.</AppText>
              <Button title="Unlock history" onPress={() => presentPaywall('history')} style={styles.lockButton} />
            </View>
          </View>
        ) : (
          <BarChart data={chart.data} goal={goal} summary={chart.summary} />
        )}
      </Card>

      <View style={styles.grid}>
        <Stat label="Current streak" value={plural(stats.current, 'day')} sub={stats.current > 0 ? 'Keep the herd moving' : 'Hit your goal to start one'} />
        <Stat label="Best streak" value={plural(stats.best, 'day')} sub={stats.best > 0 && stats.best === stats.current ? "You're on it right now" : 'Longest run of goal days'} />
        {locked ? null : (
          <>
            <Stat label="Goal days" value={`${stats.hit} of ${stats.total}`} sub={`In the ${range === 'year' ? 'last 365 days' : RANGE_LABEL[range]}`} />
            <Stat label="Avg protein" value={stats.avg.avgProteinG === null ? 'No data' : `${round(stats.avg.avgProteinG)} g`} sub={stats.avg.loggedDays ? `Per logged day (${stats.avg.loggedDays})` : 'Nothing logged in range'} />
            <Stat label="Avg calories" value={stats.avg.avgCalories === null ? 'No data' : `${round(stats.avg.avgCalories)} kcal`} sub={goals ? `Goal ${goals.calories} kcal` : 'Per logged day'} wide />
          </>
        )}
      </View>

      {creatine.enabled ? (
        <Card style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="label" style={{ flex: 1 }}>Creatine, last 30 days</AppText>
            <AppText variant="label">{creatineStats.percent}%</AppText>
          </View>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Creatine taken on ${creatineStats.takenDays} of the last 30 days, ${creatineStats.percent} percent.`}
            style={styles.dots}
          >
            {creatineStats.taken.map((on, i) => (
              <View key={i} style={styles.dotCell}>
                <View style={[styles.dot, on ? styles.dotOn : null, i === creatineStats.taken.length - 1 ? styles.dotToday : null]} />
              </View>
            ))}
          </View>
          <AppText variant="caption">
            {creatineStats.takenDays === 0
              ? 'No scoops ticked off yet. Filled dots are days you took it; the last dot is today.'
              : `${creatineStats.takenDays} of 30 days. Filled dots are days you took it; the last dot is today.`}
          </AppText>
        </Card>
      ) : null}

      <WeightSection range={range} today={today} units={units} logs={weightLogs} />
    </Screen>
  );
}

function Stat({ label, value, sub, wide }: { label: string; value: string; sub: string; wide?: boolean }) {
  return (
    <Card style={[styles.stat, wide ? styles.statWide : null]}>
      <View accessible accessibilityLabel={`${label}: ${value}. ${sub}`}>
        <AppText variant="caption">{label}</AppText>
        <AppText variant="heading" numberOfLines={1} adjustsFontSizeToFit>{value}</AppText>
        <AppText variant="small">{sub}</AppText>
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
        <AppText variant="caption">{range === 'year' ? 'Last 12 months' : 'Last 90 days'}</AppText>
      </View>

      {points.length === 0 ? (
        <View style={styles.emptySmall}>
          <AppText variant="caption" center>No weigh-ins yet. Hop on the scale (hooves optional) and log your first one.</AppText>
        </View>
      ) : (
        <>
          <LineChart
            points={points}
            formatValue={(v) => `${v.toFixed(1)} ${unit}`}
            summary={`Line chart of weight. ${plural(points.length, 'weigh-in')}. Latest ${format(last.weightKg)} on ${shortDate(last.day)}.${change !== null ? ` Change since ${shortDate(first.day)}: ${change > 0 ? '+' : ''}${change.toFixed(1)} ${unit}.` : ''}`}
          />
          <AppText variant="caption">
            {points.length === 1
              ? 'One weigh-in so far. Add another on a different day and the line appears.'
              : `${change !== null && change > 0 ? '+' : ''}${(change ?? 0).toFixed(1)} ${unit} since ${shortDate(first.day)}`}
          </AppText>
        </>
      )}

      {open ? (
        <View style={{ gap: spacing.sm }}>
          <Field
            label="Today's weight"
            value={text}
            onChangeText={(t) => {
              setText(t);
              setSaved(false);
            }}
            suffix={unit}
            keyboardType="decimal-pad"
            placeholder={units === 'metric' ? '80.0' : '176.0'}
            tone={text !== '' && !valid ? 'bad' : 'neutral'}
            note={text !== '' && !valid ? `That doesn't look like a weight in ${unit}. Even for a cow.` : undefined}
          />
          <View style={styles.formButtons}>
            <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => { setOpen(false); setText(''); }} />
            <Button title="Save" style={{ flex: 1 }} disabled={!valid} onPress={() => void save()} />
          </View>
        </View>
      ) : (
        <Button
          title="Log weight"
          variant="secondary"
          onPress={() => {
            setOpen(true);
            setSaved(false);
          }}
        />
      )}
      {saved ? <AppText variant="caption" center accessibilityLiveRegion="polite">Saved. The scale survived.</AppText> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  chartCard: { gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  emptySmall: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  blurred: { opacity: 0.35 },
  lock: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  lockButton: { alignSelf: 'stretch', marginTop: spacing.sm, minHeight: 50 },
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
