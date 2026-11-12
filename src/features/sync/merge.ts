/**
 * Pure sync logic: last-write-wins on `updatedAt`, and the mapping between
 * local rows (camelCase) and Supabase rows (snake_case). No I/O in here.
 */
import type { CreatineRow, FoodEntryRow, LogRows, WeightRow } from '../../storage/types';
import type { CreatineSettings, EntrySource, Goals, OnboardingAnswers, Units } from '../../types';

export type Winner = 'local' | 'remote' | 'same';

interface Stamped {
  updatedAt: string;
}

/**
 * Which copy of a row survives. Timestamps are compared as instants (not as
 * text) because Postgres returns "+00:00" where JavaScript writes "Z".
 * A missing side loses; a tie keeps what each side already has.
 */
export function lastWriteWins(local: Stamped | null | undefined, remote: Stamped | null | undefined): Winner {
  if (!local && !remote) return 'same';
  if (!local) return 'remote';
  if (!remote) return 'local';
  const l = Date.parse(local.updatedAt);
  const r = Date.parse(remote.updatedAt);
  // An unreadable timestamp never beats a readable one.
  if (Number.isNaN(l) && Number.isNaN(r)) return 'same';
  if (Number.isNaN(l)) return 'remote';
  if (Number.isNaN(r)) return 'local';
  return l > r ? 'local' : r > l ? 'remote' : 'same';
}

export interface MergePlan<T> {
  /** Remote rows to write into local storage. */
  applyLocal: T[];
  /** Local rows to send to the server. */
  push: T[];
}

/**
 * Given the local rows changed since the last push and the remote rows changed
 * since the last pull, decide what goes where. A row changed on both sides
 * goes one way only: towards the older copy.
 */
export function planMerge<T extends Stamped>(localChanged: T[], remoteChanged: T[], key: (row: T) => string): MergePlan<T> {
  const local = new Map(localChanged.map((r) => [key(r), r]));
  const remote = new Map<string, T>();
  // If the server page somehow repeats a key, keep its newest copy.
  for (const r of remoteChanged) if (lastWriteWins(remote.get(key(r)), r) === 'remote') remote.set(key(r), r);

  const applyLocal: T[] = [];
  for (const [k, r] of remote) if (lastWriteWins(local.get(k), r) === 'remote') applyLocal.push(r);
  const push: T[] = [];
  for (const [k, l] of local) if (lastWriteWins(l, remote.get(k)) === 'local') push.push(l);
  return { applyLocal, push };
}

export function planLogMerge(localChanged: LogRows, remoteChanged: LogRows): { applyLocal: LogRows; push: LogRows } {
  const food = planMerge(localChanged.foodEntries, remoteChanged.foodEntries, (r) => r.id);
  const creatine = planMerge(localChanged.creatineLogs, remoteChanged.creatineLogs, (r) => r.day);
  const weight = planMerge(localChanged.weightLogs, remoteChanged.weightLogs, (r) => r.day);
  return {
    applyLocal: { foodEntries: food.applyLocal, creatineLogs: creatine.applyLocal, weightLogs: weight.applyLocal },
    push: { foodEntries: food.push, creatineLogs: creatine.push, weightLogs: weight.push },
  };
}

export function countRows(rows: LogRows): number {
  return rows.foodEntries.length + rows.creatineLogs.length + rows.weightLogs.length;
}

/* ---------- Profile ---------- */

export type ProfileDecision = 'push' | 'pull' | 'none';

/**
 * Profile (goals, answers, creatine, units) is one document, so it is merged
 * whole. A side without goals has nothing worth keeping and never wins.
 */
export function decideProfile(local: { hasGoals: boolean; updatedAt: string | null }, remote: { hasGoals: boolean; updatedAt: string | null } | null): ProfileDecision {
  const remoteHasGoals = !!remote?.hasGoals;
  if (!local.hasGoals && !remoteHasGoals) return 'none';
  if (!local.hasGoals) return 'pull';
  if (!remoteHasGoals) return 'push';
  // Both have a plan. An untracked local edit time means this device has not
  // changed it since it last matched the server, so the server copy stands.
  if (!local.updatedAt) return 'pull';
  const w = lastWriteWins({ updatedAt: local.updatedAt }, remote?.updatedAt ? { updatedAt: remote.updatedAt } : null);
  return w === 'local' ? 'push' : w === 'remote' ? 'pull' : 'none';
}

export interface SyncedProfile {
  goals: Goals | null;
  answers: OnboardingAnswers;
  creatine: CreatineSettings | null;
  units: Units | null;
  updatedAt: string | null;
}

export interface RemoteProfileRow {
  id?: string;
  goals: unknown;
  answers: unknown;
  creatine: unknown;
  units: unknown;
  updated_at: string | null;
  photo_scans_used?: number | null;
  is_premium?: boolean | null;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Validate what came off the wire; anything malformed becomes null rather than reaching the UI. */
export function profileFromRemote(row: RemoteProfileRow | null | undefined): SyncedProfile | null {
  if (!row) return null;
  const g = row.goals;
  const goals = isObj(g) && isNum(g.proteinG) && isNum(g.calories) && isNum(g.carbsG) && isNum(g.fatG) && g.proteinG > 0 && g.calories > 0
    ? { proteinG: g.proteinG, calories: g.calories, carbsG: g.carbsG, fatG: g.fatG }
    : null;
  const c = row.creatine;
  const creatine = isObj(c) && typeof c.enabled === 'boolean' && isNum(c.doseG)
    ? { enabled: c.enabled, doseG: c.doseG, reminderTime: typeof c.reminderTime === 'string' ? c.reminderTime : null }
    : null;
  const units = row.units === 'metric' || row.units === 'imperial' ? row.units : null;
  return { goals, answers: isObj(row.answers) ? (row.answers as OnboardingAnswers) : {}, creatine, units, updatedAt: row.updated_at ?? null };
}

export function profileToRemote(userId: string, p: { goals: Goals | null; answers: OnboardingAnswers; creatine: CreatineSettings; units: Units }, updatedAt: string) {
  // Deliberately no is_premium / photo_scans_used: the client may not write those.
  return { id: userId, goals: p.goals, answers: p.answers, creatine: p.creatine, units: p.units, updated_at: updatedAt };
}

/* ---------- Row mapping ---------- */

export interface RemoteFoodEntry {
  id: string;
  user_id?: string;
  day: string;
  name: string;
  protein_g: number;
  calories: number;
  carbs_g: number;
  fat_g: number;
  source: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  server_updated_at?: string;
}

export interface RemoteCreatineLog {
  user_id?: string;
  day: string;
  dose_g: number;
  taken_at: string;
  updated_at: string;
  deleted_at: string | null;
  server_updated_at?: string;
}

export interface RemoteWeightLog {
  user_id?: string;
  day: string;
  weight_kg: number;
  updated_at: string;
  deleted_at: string | null;
  server_updated_at?: string;
}

const SOURCES: EntrySource[] = ['manual', 'quick', 'photo', 'barcode'];
/** Postgres returns timestamptz as "2026-01-02T03:04:05.678+00:00"; local rows use toISOString(). */
export function toIso(ts: string): string {
  const t = Date.parse(ts);
  return Number.isNaN(t) ? ts : new Date(t).toISOString();
}
const toIsoOrNull = (ts: string | null | undefined) => (ts ? toIso(ts) : null);
const num = (v: unknown) => (isNum(v) ? v : Number(v) || 0);

export const foodToRemote = (userId: string, r: FoodEntryRow): RemoteFoodEntry => ({
  id: r.id,
  user_id: userId,
  day: r.day,
  name: r.name,
  protein_g: r.proteinG,
  calories: r.calories,
  carbs_g: r.carbsG,
  fat_g: r.fatG,
  source: r.source,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
  deleted_at: r.deletedAt,
});

export const foodFromRemote = (r: RemoteFoodEntry): FoodEntryRow => ({
  id: r.id,
  day: r.day,
  name: r.name,
  proteinG: num(r.protein_g),
  calories: num(r.calories),
  carbsG: num(r.carbs_g),
  fatG: num(r.fat_g),
  source: SOURCES.includes(r.source as EntrySource) ? (r.source as EntrySource) : 'manual',
  createdAt: toIso(r.created_at),
  updatedAt: toIso(r.updated_at),
  deletedAt: toIsoOrNull(r.deleted_at),
});

export const creatineToRemote = (userId: string, r: CreatineRow): RemoteCreatineLog => ({
  user_id: userId,
  day: r.day,
  dose_g: r.doseG,
  taken_at: r.takenAt,
  updated_at: r.updatedAt,
  deleted_at: r.deletedAt,
});

export const creatineFromRemote = (r: RemoteCreatineLog): CreatineRow => ({
  day: r.day,
  doseG: num(r.dose_g),
  takenAt: toIso(r.taken_at),
  updatedAt: toIso(r.updated_at),
  deletedAt: toIsoOrNull(r.deleted_at),
});

export const weightToRemote = (userId: string, r: WeightRow): RemoteWeightLog => ({
  user_id: userId,
  day: r.day,
  weight_kg: r.weightKg,
  updated_at: r.updatedAt,
  deleted_at: r.deletedAt,
});

export const weightFromRemote = (r: RemoteWeightLog): WeightRow => ({
  day: r.day,
  weightKg: num(r.weight_kg),
  updatedAt: toIso(r.updated_at),
  deletedAt: toIsoOrNull(r.deleted_at),
});

/** Newest server stamp in a page of pulled rows, or the previous cursor. */
export function nextCursor(prev: string | null, rows: { server_updated_at?: string }[]): string | null {
  let best = prev;
  let bestT = prev ? Date.parse(prev) : -Infinity;
  for (const r of rows) {
    if (!r.server_updated_at) continue;
    const t = Date.parse(r.server_updated_at);
    if (t > bestT) {
      bestT = t;
      best = r.server_updated_at;
    }
  }
  return best;
}
