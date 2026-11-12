/** Pure aggregation for the Progress tab. No React, no storage. */
import { addDays, localDay, parseDay } from '../../lib/date';
import type { CreatineLog, DayTotals, FoodEntry, WeightLog } from '../../types';

export type Range = 'week' | 'month' | 'year';

/** The `n` days ending at (and including) `today`, oldest first. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}

/** The `n` months ("YYYY-MM") ending at the month of `today`, oldest first. */
export function lastMonths(today: string, n: number): string[] {
  const d = parseDay(today);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1, 12);
    out.push(localDay(m).slice(0, 7));
  }
  return out;
}

function totalsMap(entries: FoodEntry[]): Map<string, DayTotals> {
  const map = new Map<string, DayTotals>();
  for (const e of entries) {
    if (e.deletedAt) continue;
    let t = map.get(e.day);
    if (!t) {
      t = { day: e.day, proteinG: 0, calories: 0, carbsG: 0, fatG: 0, entryCount: 0 };
      map.set(e.day, t);
    }
    t.proteinG += e.proteinG;
    t.calories += e.calories;
    t.carbsG += e.carbsG;
    t.fatG += e.fatG;
    t.entryCount += 1;
  }
  return map;
}

/** One DayTotals per requested day, in the order given; days without entries are zeros. */
export function bucketByDay(entries: FoodEntry[], days: string[]): DayTotals[] {
  const map = totalsMap(entries);
  return days.map((day) => map.get(day) ?? { day, proteinG: 0, calories: 0, carbsG: 0, fatG: 0, entryCount: 0 });
}

export interface MonthAverage {
  /** "YYYY-MM" */
  month: string;
  /** Days in the month with at least one entry. */
  loggedDays: number;
  /** Average per logged day; 0 when nothing was logged. */
  avgProteinG: number;
  avgCalories: number;
}

/** Average per LOGGED day for each requested month (unlogged days don't drag the average down). */
export function monthlyAverages(entries: FoodEntry[], months: string[]): MonthAverage[] {
  const acc = new Map<string, { p: number; c: number; n: number }>();
  for (const t of totalsMap(entries).values()) {
    const key = t.day.slice(0, 7);
    const a = acc.get(key) ?? { p: 0, c: 0, n: 0 };
    a.p += t.proteinG;
    a.c += t.calories;
    a.n += 1;
    acc.set(key, a);
  }
  return months.map((month) => {
    const a = acc.get(month);
    return a
      ? { month, loggedDays: a.n, avgProteinG: a.p / a.n, avgCalories: a.c / a.n }
      : { month, loggedDays: 0, avgProteinG: 0, avgCalories: 0 };
  });
}

/** Longest ever run of consecutive calendar days whose protein total met `goalG`. */
export function bestStreak(entries: FoodEntry[], goalG: number): number {
  if (goalG <= 0) return 0;
  const met = [...totalsMap(entries).values()]
    .filter((t) => t.proteinG >= goalG)
    .map((t) => t.day)
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of met) {
    run = prev !== null && addDays(prev, 1) === day ? run + 1 : 1;
    if (run > best) best = run;
    prev = day;
  }
  return best;
}

/** How many of `days` met the protein goal. */
export function goalHitDays(entries: FoodEntry[], goalG: number, days: string[]): number {
  if (goalG <= 0) return 0;
  return bucketByDay(entries, days).filter((t) => t.proteinG >= goalG).length;
}

export interface RangeAverages {
  loggedDays: number;
  /** Per logged day; null when nothing was logged in the range. */
  avgProteinG: number | null;
  avgCalories: number | null;
}

export function averages(entries: FoodEntry[], days: string[]): RangeAverages {
  const logged = bucketByDay(entries, days).filter((t) => t.entryCount > 0);
  if (logged.length === 0) return { loggedDays: 0, avgProteinG: null, avgCalories: null };
  const sum = logged.reduce((a, t) => ({ p: a.p + t.proteinG, c: a.c + t.calories }), { p: 0, c: 0 });
  return { loggedDays: logged.length, avgProteinG: sum.p / logged.length, avgCalories: sum.c / logged.length };
}

export interface CreatineConsistency {
  /** One flag per requested day, same order. */
  taken: boolean[];
  takenDays: number;
  /** 0..100, rounded. */
  percent: number;
}

export function creatineConsistency(logs: CreatineLog[], days: string[]): CreatineConsistency {
  const set = new Set(logs.map((l) => l.day));
  const taken = days.map((d) => set.has(d));
  const takenDays = taken.filter(Boolean).length;
  return { taken, takenDays, percent: days.length ? Math.round((takenDays / days.length) * 100) : 0 };
}

/** Weight logs inside [from, to], oldest first, one per day. */
export function weightSeries(logs: WeightLog[], from: string, to: string): WeightLog[] {
  const byDay = new Map<string, WeightLog>();
  for (const w of logs) if (w.day >= from && w.day <= to) byDay.set(w.day, w);
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
}
