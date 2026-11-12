import { runMigrations, type MigrationDb } from './migrations';
import type { CreatineRow, FoodEntryRow, LogRepository, LogRows, WeightRow } from './types';
import type { EntrySource } from '../types';

type Param = string | number | null;

/** The slice of expo-sqlite's SQLiteDatabase this repository uses. */
export interface SqlDb extends MigrationDb {
  runAsync(sql: string, params: Param[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params: Param[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

interface FoodSql {
  id: string;
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
}
interface CreatineSql {
  day: string;
  dose_g: number;
  taken_at: string;
  updated_at: string;
  deleted_at: string | null;
}
interface WeightSql {
  day: string;
  weight_kg: number;
  updated_at: string;
  deleted_at: string | null;
}

const toFood = (r: FoodSql): FoodEntryRow => ({
  id: r.id,
  day: r.day,
  name: r.name,
  proteinG: r.protein_g,
  calories: r.calories,
  carbsG: r.carbs_g,
  fatG: r.fat_g,
  source: r.source as EntrySource,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});
const toCreatine = (r: CreatineSql): CreatineRow => ({ day: r.day, doseG: r.dose_g, takenAt: r.taken_at, updatedAt: r.updated_at, deletedAt: r.deleted_at });
const toWeight = (r: WeightSql): WeightRow => ({ day: r.day, weightKg: r.weight_kg, updatedAt: r.updated_at, deletedAt: r.deleted_at });

/** SQLite repository. `open` is injected so this file never imports expo-sqlite itself. */
export function createSqliteRepository(open: () => Promise<SqlDb>): LogRepository {
  let dbPromise: Promise<SqlDb> | null = null;
  const db = (): Promise<SqlDb> => {
    if (!dbPromise) {
      dbPromise = (async () => {
        const d = await open();
        await runMigrations(d);
        return d;
      })();
      // Let a later call retry after a failed open.
      dbPromise.catch(() => {
        dbPromise = null;
      });
    }
    return dbPromise;
  };

  const read = async (where: string, params: Param[]): Promise<LogRows> => {
    const d = await db();
    const [food, creatine, weight] = await Promise.all([
      d.getAllAsync<FoodSql>(`SELECT * FROM food_entries ${where} ORDER BY created_at DESC`, params),
      d.getAllAsync<CreatineSql>(`SELECT * FROM creatine_logs ${where} ORDER BY day ASC`, params),
      d.getAllAsync<WeightSql>(`SELECT * FROM weight_logs ${where} ORDER BY day ASC`, params),
    ]);
    return { foodEntries: food.map(toFood), creatineLogs: creatine.map(toCreatine), weightLogs: weight.map(toWeight) };
  };

  return {
    init: async () => {
      await db();
    },
    loadAll: () => read('', []),
    listChangedSince: (iso) => read('WHERE updated_at > ?', [iso]),
    upsert: async (rows) => {
      const d = await db();
      await d.withTransactionAsync(async () => {
        for (const r of rows.foodEntries ?? []) {
          await d.runAsync(
            `INSERT OR REPLACE INTO food_entries
             (id, day, name, protein_g, calories, carbs_g, fat_g, source, created_at, updated_at, deleted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [r.id, r.day, r.name, r.proteinG, r.calories, r.carbsG, r.fatG, r.source, r.createdAt, r.updatedAt, r.deletedAt],
          );
        }
        for (const r of rows.creatineLogs ?? []) {
          await d.runAsync(
            'INSERT OR REPLACE INTO creatine_logs (day, dose_g, taken_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
            [r.day, r.doseG, r.takenAt, r.updatedAt, r.deletedAt],
          );
        }
        for (const r of rows.weightLogs ?? []) {
          await d.runAsync('INSERT OR REPLACE INTO weight_logs (day, weight_kg, updated_at, deleted_at) VALUES (?, ?, ?, ?)', [
            r.day,
            r.weightKg,
            r.updatedAt,
            r.deletedAt,
          ]);
        }
      });
    },
    clearAll: async () => {
      const d = await db();
      await d.withTransactionAsync(async () => {
        await d.runAsync('DELETE FROM food_entries', []);
        await d.runAsync('DELETE FROM creatine_logs', []);
        await d.runAsync('DELETE FROM weight_logs', []);
      });
    },
  };
}
