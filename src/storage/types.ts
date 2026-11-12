/**
 * Storage row types and the repository contract.
 *
 * Rows are what is persisted and synced: every row carries `updatedAt` and a
 * nullable `deletedAt` (soft delete), so last-write-wins sync can move
 * deletions between devices. Screens never see rows directly; they read the
 * in-memory mirror in src/features/log.
 */
import type { FoodEntry } from '../types';

/** A food entry row is exactly the domain entry (it already has the timestamps). */
export type FoodEntryRow = FoodEntry;

/** One creatine check-off per local day. */
export interface CreatineRow {
  day: string;
  doseG: number;
  takenAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** One weight per local day. */
export interface WeightRow {
  day: string;
  weightKg: number;
  updatedAt: string;
  deletedAt: string | null;
}

/** A bundle of rows from every log table. Used for loading and for sync. */
export interface LogRows {
  foodEntries: FoodEntryRow[];
  creatineLogs: CreatineRow[];
  weightLogs: WeightRow[];
}

export const emptyRows = (): LogRows => ({ foodEntries: [], creatineLogs: [], weightLogs: [] });

/**
 * Persistence contract. Two implementations: SQLite (native) and JSON over a
 * key-value store (web, tests). All writes are upserts by primary key
 * (entry id, or day for creatine/weight); a delete is an upsert with
 * `deletedAt` set.
 */
export interface LogRepository {
  /** Open the store and bring its schema up to date. Safe to call twice. */
  init(): Promise<void>;
  /** Every row, including soft-deleted ones. */
  loadAll(): Promise<LogRows>;
  /** Rows (including soft-deleted) with updatedAt strictly after `iso`. */
  listChangedSince(iso: string): Promise<LogRows>;
  /** Insert or replace the given rows by primary key, atomically where possible. */
  upsert(rows: Partial<LogRows>): Promise<void>;
  /** Hard-delete everything (account deletion / reset). */
  clearAll(): Promise<void>;
}

/** Minimal async key-value store (AsyncStorage-compatible). */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
