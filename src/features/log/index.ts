/**
 * Log feature: food entries, creatine check-offs, weight.
 *
 * `useLog` is an in-memory mirror of the repository in src/storage (SQLite on
 * native, JSON on web). `init()` loads it; every mutation writes through to
 * the repository first and only then updates the mirror, so what the UI shows
 * is what is on disk. Deletes are soft (deletedAt) so sync can carry them.
 */
import { create } from 'zustand';

import { localDay } from '../../lib/date';
import { newId } from '../../lib/id';
import { createDefaultRepository } from '../../storage/driver';
import { rowsToApply } from '../../storage/merge';
import type { CreatineRow, LogRepository, LogRows, WeightRow } from '../../storage/types';
import type { CreatineLog, FoodEntry, NewFoodEntry, WeightLog } from '../../types';
import { cleanAmount, cleanDay, cleanNewEntry, cleanPatch, LogValidationError } from './validate';

export { bestStreak, currentStreak, dayTotalsMap, goalHitDays, totalsForDay, totalsForDays, totalsForRange } from './totals';
export { cleanNewEntry, FALLBACK_NAMES, isValidDay, LogValidationError, MAX_NAME_LENGTH } from './validate';
export type { CreatineRow, FoodEntryRow, LogRows, WeightRow } from '../../storage/types';

export interface LogState {
  ready: boolean;
  /** Non-deleted entries, newest first. */
  entries: FoodEntry[];
  creatineLogs: CreatineLog[];
  weightLogs: WeightLog[];
  /** Set when storage could not be opened; the app still runs, in memory only. */
  storageError: string | null;
  init: () => Promise<void>;
  addEntry: (entry: NewFoodEntry) => Promise<FoodEntry>;
  updateEntry: (id: string, patch: Partial<NewFoodEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  /** Undo a deleteEntry. Resolves false if the entry is unknown. */
  restoreEntry: (id: string) => Promise<boolean>;
  setCreatineTaken: (day: string, doseG: number, taken: boolean) => Promise<void>;
  logWeight: (day: string, weightKg: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

let repository: LogRepository | null = null;
let initPromise: Promise<void> | null = null;

function repo(): LogRepository {
  if (!repository) repository = createDefaultRepository();
  return repository;
}

/** Swap the storage backend (tests). Resets the mirror; call `init()` afterwards. */
export function setLogRepository(next: LogRepository | null): void {
  repository = next;
  initPromise = null;
  useLog.setState({ ready: false, entries: [], creatineLogs: [], weightLogs: [], storageError: null });
}

const nowIso = () => new Date().toISOString();
const newestFirst = (a: FoodEntry, b: FoodEntry) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);
const byDay = <T extends { day: string }>(a: T, b: T) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0);

/** Pure: what the UI sees for a set of stored rows (soft-deleted rows dropped, sorted). */
export function mirrorFromRows(rows: LogRows): Pick<LogState, 'entries' | 'creatineLogs' | 'weightLogs'> {
  return {
    entries: rows.foodEntries.filter((e) => !e.deletedAt).sort(newestFirst),
    creatineLogs: rows.creatineLogs
      .filter((c) => !c.deletedAt)
      .map(({ day, doseG, takenAt }) => ({ day, doseG, takenAt }))
      .sort(byDay),
    weightLogs: rows.weightLogs
      .filter((w) => !w.deletedAt)
      .map(({ day, weightKg }) => ({ day, weightKg }))
      .sort(byDay),
  };
}

export const useLog = create<LogState>()((set, get) => ({
  ready: false,
  entries: [],
  creatineLogs: [],
  weightLogs: [],
  storageError: null,

  init: () => {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          await repo().init();
          set({ ...mirrorFromRows(await repo().loadAll()), ready: true, storageError: null });
        } catch (e) {
          // Never leave the app stuck on the splash screen: run empty and say why.
          console.warn('[log] storage failed to open', e);
          initPromise = null;
          set({ ready: true, storageError: e instanceof Error ? e.message : String(e) });
        }
      })();
    }
    return initPromise;
  },

  addEntry: async (input) => {
    const e = cleanNewEntry(input);
    const now = nowIso();
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
    await repo().upsert({ foodEntries: [entry] });
    set((s) => ({ entries: [entry, ...s.entries].sort(newestFirst) }));
    return entry;
  },

  updateEntry: async (id, patch) => {
    const current = get().entries.find((x) => x.id === id);
    if (!current) return;
    // The entry keeps the day it was logged on unless a new day is given explicitly.
    const next: FoodEntry = { ...current, ...cleanPatch(patch, current.source), updatedAt: nowIso() };
    await repo().upsert({ foodEntries: [next] });
    set((s) => ({ entries: s.entries.map((x) => (x.id === id ? next : x)) }));
  },

  deleteEntry: async (id) => {
    const current = get().entries.find((x) => x.id === id);
    if (!current) return;
    const now = nowIso();
    await repo().upsert({ foodEntries: [{ ...current, updatedAt: now, deletedAt: now }] });
    set((s) => ({ entries: s.entries.filter((x) => x.id !== id) }));
  },

  restoreEntry: async (id) => {
    if (get().entries.some((x) => x.id === id)) return true;
    const row = (await repo().loadAll()).foodEntries.find((x) => x.id === id);
    if (!row) return false;
    const next: FoodEntry = { ...row, updatedAt: nowIso(), deletedAt: null };
    await repo().upsert({ foodEntries: [next] });
    set((s) => ({ entries: [next, ...s.entries.filter((x) => x.id !== id)].sort(newestFirst) }));
    return true;
  },

  setCreatineTaken: async (dayInput, doseInput, taken) => {
    const day = cleanDay(dayInput);
    const doseG = cleanAmount(doseInput, 'doseG');
    const now = nowIso();
    const existing = get().creatineLogs.find((l) => l.day === day);
    if (!taken && !existing) return;
    const row: CreatineRow = { day, doseG, takenAt: taken ? now : (existing?.takenAt ?? now), updatedAt: now, deletedAt: taken ? null : now };
    await repo().upsert({ creatineLogs: [row] });
    set((s) => {
      const rest = s.creatineLogs.filter((l) => l.day !== day);
      return { creatineLogs: taken ? [...rest, { day, doseG, takenAt: now }].sort(byDay) : rest };
    });
  },

  logWeight: async (dayInput, weightInput) => {
    const day = cleanDay(dayInput);
    const weightKg = cleanAmount(weightInput, 'weightKg');
    if (weightKg <= 0) throw new LogValidationError('weightKg', 'weightKg must be above zero');
    const row: WeightRow = { day, weightKg, updatedAt: nowIso(), deletedAt: null };
    await repo().upsert({ weightLogs: [row] });
    set((s) => ({ weightLogs: [...s.weightLogs.filter((w) => w.day !== day), { day, weightKg }].sort(byDay) }));
  },

  clearAll: async () => {
    await repo().clearAll();
    set({ entries: [], creatineLogs: [], weightLogs: [] });
  },
}));

/* ---------- Sync helpers (used by src/features/sync) ---------- */

/**
 * Every food/creatine/weight row changed after `iso` (an ISO timestamp),
 * including soft-deleted rows. Pass '' to get everything.
 */
export function listChangedSince(iso: string): Promise<LogRows> {
  return repo().listChangedSince(iso);
}

/** Every stored row, including soft-deleted ones. */
export function getAllRowsForSync(): Promise<LogRows> {
  return repo().loadAll();
}

/**
 * Merge rows pulled from the server: last write wins on `updatedAt`, per row.
 * Local rows that are newer are left alone. Refreshes the mirror and returns
 * how many rows were actually applied.
 */
export async function upsertFromRemote(rows: Partial<LogRows>): Promise<number> {
  const winners = rowsToApply(await repo().loadAll(), rows);
  const count = winners.foodEntries.length + winners.creatineLogs.length + winners.weightLogs.length;
  if (count === 0) return 0;
  await repo().upsert(winners);
  useLog.setState(mirrorFromRows(await repo().loadAll()));
  return count;
}

/** Alias kept for readability at call sites. */
export const applyRemoteRows = upsertFromRemote;
