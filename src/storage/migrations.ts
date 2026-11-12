/**
 * Versioned schema migrations, tracked with SQLite's `PRAGMA user_version`.
 * Migration N brings the schema from version N-1 to N. Never edit a shipped
 * migration: add a new one.
 */

/** The slice of a SQLite connection the runner needs (expo-sqlite's SQLiteDatabase fits). */
export interface MigrationDb {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}

export interface Migration {
  version: number;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
CREATE TABLE IF NOT EXISTS food_entries (
  id TEXT PRIMARY KEY NOT NULL,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  protein_g REAL NOT NULL DEFAULT 0,
  calories REAL NOT NULL DEFAULT 0,
  carbs_g REAL NOT NULL DEFAULT 0,
  fat_g REAL NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_food_entries_day ON food_entries(day);
CREATE INDEX IF NOT EXISTS idx_food_entries_updated ON food_entries(updated_at);
CREATE TABLE IF NOT EXISTS creatine_logs (
  day TEXT PRIMARY KEY NOT NULL,
  dose_g REAL NOT NULL,
  taken_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS weight_logs (
  day TEXT PRIMARY KEY NOT NULL,
  weight_kg REAL NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);`,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.reduce((m, x) => Math.max(m, x.version), 0);

/**
 * Apply every migration above the database's current version, in order, each
 * in its own transaction together with its version bump, so a failure leaves
 * the database at the last good version. Returns the versions applied.
 */
export async function runMigrations(db: MigrationDb, migrations: Migration[] = MIGRATIONS): Promise<number[]> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  sorted.forEach((m, i) => {
    if (!Number.isInteger(m.version) || m.version < 1) throw new Error(`Invalid migration version ${m.version}`);
    if (i > 0 && sorted[i - 1]!.version === m.version) throw new Error(`Duplicate migration version ${m.version}`);
  });
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  const latest = sorted.length ? sorted[sorted.length - 1]!.version : 0;
  if (current > latest) {
    // A newer app wrote this database. Refuse rather than guess at its schema.
    throw new Error(`Database schema v${current} is newer than this app supports (v${latest})`);
  }
  const applied: number[] = [];
  for (const m of sorted) {
    if (m.version <= current) continue;
    await db.execAsync('BEGIN');
    try {
      await db.execAsync(m.sql);
      await db.execAsync(`PRAGMA user_version = ${m.version}`);
      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK').catch(() => undefined);
      throw e;
    }
    applied.push(m.version);
  }
  return applied;
}
