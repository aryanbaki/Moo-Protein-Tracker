/**
 * Log feature contract: food entries, creatine check-offs, weight.
 *
 * BASE STUB: in-memory only. The core-loop work replaces the internals with
 * SQLite-backed storage (src/storage) while keeping these exports and
 * signatures stable, because scanner, progress and settings code import them.
 */
import { create } from 'zustand';

import { localDay } from '../../lib/date';
import { newId } from '../../lib/id';
import type { CreatineLog, DayTotals, FoodEntry, NewFoodEntry, WeightLog } from '../../types';

export interface LogState {
  ready: boolean;
  /** Non-deleted entries, newest first. */
  entries: FoodEntry[];
  creatineLogs: CreatineLog[];
  weightLogs: WeightLog[];
  init: () => Promise<void>;
  addEntry: (entry: NewFoodEntry) => Promise<FoodEntry>;
  updateEntry: (id: string, patch: Partial<NewFoodEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setCreatineTaken: (day: string, doseG: number, taken: boolean) => Promise<void>;
  logWeight: (day: string, weightKg: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useLog = create<LogState>()((set, get) => ({
  ready: false,
  entries: [],
  creatineLogs: [],
  weightLogs: [],
  init: async () => set({ ready: true }),
  addEntry: async (e) => {
    const now = new Date().toISOString();
    const entry: FoodEntry = {
      id: newId(),
      day: e.day ?? localDay(),
      name: e.name,
      proteinG: e.proteinG,
      calories: e.calories,
      carbsG: e.carbsG,
      fatG: e.fatG,
      source: e.source,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    set({ entries: [entry, ...get().entries] });
    return entry;
  },
  updateEntry: async (id, patch) =>
    set({
      entries: get().entries.map((x) =>
        x.id === id ? { ...x, ...patch, day: patch.day ?? x.day, updatedAt: new Date().toISOString() } : x,
      ),
    }),
  deleteEntry: async (id) => set({ entries: get().entries.filter((x) => x.id !== id) }),
  setCreatineTaken: async (day, doseG, taken) => {
    const rest = get().creatineLogs.filter((l) => l.day !== day);
    set({ creatineLogs: taken ? [...rest, { day, doseG, takenAt: new Date().toISOString() }] : rest });
  },
  logWeight: async (day, weightKg) =>
    set({ weightLogs: [...get().weightLogs.filter((w) => w.day !== day), { day, weightKg }] }),
  clearAll: async () => set({ entries: [], creatineLogs: [], weightLogs: [] }),
}));

/** Pure: totals for one day from a list of entries. */
export function totalsForDay(entries: FoodEntry[], day: string): DayTotals {
  const t: DayTotals = { day, proteinG: 0, calories: 0, carbsG: 0, fatG: 0, entryCount: 0 };
  for (const e of entries) {
    if (e.day !== day || e.deletedAt) continue;
    t.proteinG += e.proteinG;
    t.calories += e.calories;
    t.carbsG += e.carbsG;
    t.fatG += e.fatG;
    t.entryCount += 1;
  }
  return t;
}

/** Pure: consecutive days up to `today` whose protein total met `goalG`. Today counts only if met. */
export function currentStreak(entries: FoodEntry[], goalG: number, today: string = localDay()): number {
  if (goalG <= 0) return 0;
  const byDay = new Map<string, number>();
  for (const e of entries) if (!e.deletedAt) byDay.set(e.day, (byDay.get(e.day) ?? 0) + e.proteinG);
  let streak = 0;
  const d = new Date(`${today}T12:00:00`);
  if ((byDay.get(today) ?? 0) < goalG) d.setDate(d.getDate() - 1);
  for (;;) {
    const key = localDay(d);
    if ((byDay.get(key) ?? 0) >= goalG) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}
