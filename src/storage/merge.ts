import type { CreatineRow, FoodEntryRow, LogRows, WeightRow } from './types';

/**
 * Last-write-wins: keep `incoming` only when it is strictly newer than what we
 * have (or we have nothing). ISO-8601 UTC strings compare correctly as text.
 */
export function isNewer(incoming: { updatedAt: string }, existing: { updatedAt: string } | undefined): boolean {
  return !existing || incoming.updatedAt > existing.updatedAt;
}

function pick<T extends { updatedAt: string }>(existing: T[], incoming: T[], key: (r: T) => string): T[] {
  const have = new Map(existing.map((r) => [key(r), r]));
  const winners = new Map<string, T>();
  for (const r of incoming) {
    const k = key(r);
    if (isNewer(r, winners.get(k) ?? have.get(k))) winners.set(k, r);
  }
  return [...winners.values()];
}

/** Pure: the subset of `incoming` that should overwrite `existing` under last-write-wins. */
export function rowsToApply(existing: LogRows, incoming: Partial<LogRows>): LogRows {
  return {
    foodEntries: pick<FoodEntryRow>(existing.foodEntries, incoming.foodEntries ?? [], (r) => r.id),
    creatineLogs: pick<CreatineRow>(existing.creatineLogs, incoming.creatineLogs ?? [], (r) => r.day),
    weightLogs: pick<WeightRow>(existing.weightLogs, incoming.weightLogs ?? [], (r) => r.day),
  };
}

/** Pure: `base` with `changes` upserted by primary key. */
export function applyRows(base: LogRows, changes: Partial<LogRows>): LogRows {
  const up = <T>(a: T[], b: T[] | undefined, key: (r: T) => string): T[] => {
    if (!b || b.length === 0) return a;
    const m = new Map(a.map((r) => [key(r), r]));
    for (const r of b) m.set(key(r), r);
    return [...m.values()];
  };
  return {
    foodEntries: up(base.foodEntries, changes.foodEntries, (r) => r.id),
    creatineLogs: up(base.creatineLogs, changes.creatineLogs, (r) => r.day),
    weightLogs: up(base.weightLogs, changes.weightLogs, (r) => r.day),
  };
}
