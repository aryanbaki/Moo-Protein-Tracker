/** Pure, derived numbers. Nothing here is ever stored. */
import { addDays, localDay } from '../../lib/date';
import type { DayTotals, FoodEntry } from '../../types';

const zero = (day: string): DayTotals => ({ day, proteinG: 0, calories: 0, carbsG: 0, fatG: 0, entryCount: 0 });

function add(t: DayTotals, e: FoodEntry): void {
  t.proteinG += e.proteinG;
  t.calories += e.calories;
  t.carbsG += e.carbsG;
  t.fatG += e.fatG;
  t.entryCount += 1;
}

/** Totals for one day from a list of entries. Soft-deleted entries are ignored. */
export function totalsForDay(entries: FoodEntry[], day: string): DayTotals {
  const t = zero(day);
  for (const e of entries) if (e.day === day && !e.deletedAt) add(t, e);
  return t;
}

/** Totals per day, for every day that has at least one live entry. */
export function dayTotalsMap(entries: FoodEntry[]): Map<string, DayTotals> {
  const map = new Map<string, DayTotals>();
  for (const e of entries) {
    if (e.deletedAt) continue;
    let t = map.get(e.day);
    if (!t) map.set(e.day, (t = zero(e.day)));
    add(t, e);
  }
  return map;
}

/** One DayTotals per requested day, in order; days without entries are zeros. */
export function totalsForDays(entries: FoodEntry[], days: string[]): DayTotals[] {
  const map = dayTotalsMap(entries);
  return days.map((d) => map.get(d) ?? zero(d));
}

/** Summed totals for the inclusive range [fromDay, toDay]. `day` on the result is `fromDay`. */
export function totalsForRange(entries: FoodEntry[], fromDay: string, toDay: string): DayTotals {
  const t = zero(fromDay);
  for (const e of entries) if (!e.deletedAt && e.day >= fromDay && e.day <= toDay) add(t, e);
  return t;
}

/** Consecutive days up to `today` whose protein total met `goalG`. Today counts only once it is met. */
export function currentStreak(entries: FoodEntry[], goalG: number, today: string = localDay()): number {
  if (!(goalG > 0)) return 0;
  const map = dayTotalsMap(entries);
  const met = (d: string) => (map.get(d)?.proteinG ?? 0) >= goalG;
  let day = met(today) ? today : addDays(today, -1);
  let streak = 0;
  while (met(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

/** Longest run of consecutive goal-met days anywhere in the history. */
export function bestStreak(entries: FoodEntry[], goalG: number): number {
  if (!(goalG > 0)) return 0;
  const days = [...dayTotalsMap(entries).values()]
    .filter((t) => t.proteinG >= goalG)
    .map((t) => t.day)
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/** How many of the given days met the protein goal. */
export function goalHitDays(entries: FoodEntry[], goalG: number, days: string[]): number {
  if (!(goalG > 0)) return 0;
  return totalsForDays(entries, days).filter((t) => t.proteinG >= goalG).length;
}
