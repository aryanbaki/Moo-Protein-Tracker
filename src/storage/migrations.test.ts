import { LATEST_SCHEMA_VERSION, MIGRATIONS, runMigrations, type Migration, type MigrationDb } from './migrations';
import { createSqliteRepository, type SqlDb } from './sqliteRepository';

/** Fake connection that tracks user_version and honours BEGIN/COMMIT/ROLLBACK for it. */
function fakeDb(startVersion = 0, failOn?: string) {
  let version = startVersion;
  let saved: number | null = null;
  const log: string[] = [];
  const db: MigrationDb = {
    execAsync: async (sql) => {
      const s = sql.trim();
      log.push(s);
      if (failOn && s.includes(failOn)) throw new Error(`boom: ${failOn}`);
      if (s === 'BEGIN') saved = version;
      else if (s === 'ROLLBACK') {
        if (saved !== null) version = saved;
        saved = null;
      } else if (s === 'COMMIT') saved = null;
      else {
        const m = /^PRAGMA user_version = (\d+)$/.exec(s);
        if (m) version = Number(m[1]);
      }
    },
    getFirstAsync: async <T,>(sql: string) => {
      if (sql !== 'PRAGMA user_version') throw new Error(`unexpected query ${sql}`);
      return { user_version: version } as T;
    },
  };
  return { db, log, version: () => version };
}

const three: Migration[] = [
  { version: 2, sql: 'CREATE TABLE b (x)' },
  { version: 1, sql: 'CREATE TABLE a (x)' },
  { version: 3, sql: 'CREATE TABLE c (x)' },
];

describe('runMigrations', () => {
  it('applies everything, in version order, on a fresh database', async () => {
    const f = fakeDb(0);
    expect(await runMigrations(f.db, three)).toEqual([1, 2, 3]);
    expect(f.version()).toBe(3);
    expect(f.log.filter((s) => s.startsWith('CREATE'))).toEqual(['CREATE TABLE a (x)', 'CREATE TABLE b (x)', 'CREATE TABLE c (x)']);
  });

  it('wraps each migration and its version bump in one transaction', async () => {
    const f = fakeDb(2);
    await runMigrations(f.db, three);
    expect(f.log).toEqual(['BEGIN', 'CREATE TABLE c (x)', 'PRAGMA user_version = 3', 'COMMIT']);
  });

  it('skips migrations already applied and is a no-op when up to date', async () => {
    const f = fakeDb(1);
    expect(await runMigrations(f.db, three)).toEqual([2, 3]);
    expect(await runMigrations(f.db, three)).toEqual([]);
    expect(f.log.filter((s) => s === 'BEGIN')).toHaveLength(2);
  });

  it('rolls back a failing migration and stops at the last good version', async () => {
    const f = fakeDb(0, 'TABLE b');
    await expect(runMigrations(f.db, three)).rejects.toThrow('boom');
    expect(f.version()).toBe(1);
    expect(f.log).toContain('ROLLBACK');
    expect(f.log).not.toContain('CREATE TABLE c (x)');
  });

  it('refuses a database written by a newer app', async () => {
    await expect(runMigrations(fakeDb(9).db, three)).rejects.toThrow(/newer/);
  });

  it('rejects duplicate or invalid versions before touching the database', async () => {
    const f = fakeDb(0);
    await expect(runMigrations(f.db, [three[0]!, three[0]!])).rejects.toThrow(/Duplicate/);
    await expect(runMigrations(f.db, [{ version: 0, sql: '' }])).rejects.toThrow(/Invalid/);
    expect(f.log).toEqual([]);
  });

  it('treats a missing user_version row as version 0', async () => {
    const f = fakeDb(0);
    f.db.getFirstAsync = async () => null;
    expect(await runMigrations(f.db, three)).toEqual([1, 2, 3]);
  });
});

describe('shipped migrations', () => {
  it('are numbered 1..N with no gaps', () => {
    expect(MIGRATIONS.map((m) => m.version)).toEqual(MIGRATIONS.map((_, i) => i + 1));
    expect(LATEST_SCHEMA_VERSION).toBe(MIGRATIONS.length);
  });

  it('v1 creates the three log tables with sync columns', () => {
    const sql = MIGRATIONS[0]!.sql;
    for (const table of ['food_entries', 'creatine_logs', 'weight_logs']) {
      const body = new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([^;]+)\\);`).exec(sql)?.[1] ?? '';
      expect(body).toContain('updated_at TEXT NOT NULL');
      expect(body).toContain('deleted_at TEXT');
    }
  });
});

describe('SQLite repository (fake connection)', () => {
  function fakeSql() {
    const m = fakeDb(0);
    const runs: { sql: string; params: unknown[] }[] = [];
    const queries: { sql: string; params: unknown[] }[] = [];
    let opened = 0;
    const db: SqlDb = {
      ...m.db,
      runAsync: async (sql, params) => {
        runs.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      },
      getAllAsync: async <T,>(sql: string, params: (string | number | null)[]) => {
        queries.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
        if (sql.includes('food_entries')) {
          return [{ id: 'a', day: '2026-03-10', name: 'Egg', protein_g: 6, calories: 70, carbs_g: 0.5, fat_g: 5, source: 'manual', created_at: 'c', updated_at: 'u', deleted_at: null }] as T[];
        }
        return [] as T[];
      },
      withTransactionAsync: async (task) => task(),
    };
    const repo = createSqliteRepository(async () => {
      opened += 1;
      return db;
    });
    return { repo, runs, queries, m, opened: () => opened };
  }

  it('migrates once on first use and maps columns to row fields', async () => {
    const f = fakeSql();
    await f.repo.init();
    const all = await f.repo.loadAll();
    expect(f.opened()).toBe(1);
    expect(f.m.version()).toBe(LATEST_SCHEMA_VERSION);
    expect(all.foodEntries[0]).toEqual({ id: 'a', day: '2026-03-10', name: 'Egg', proteinG: 6, calories: 70, carbsG: 0.5, fatG: 5, source: 'manual', createdAt: 'c', updatedAt: 'u', deletedAt: null });
  });

  it('binds parameters for upserts and the changed-since query', async () => {
    const f = fakeSql();
    await f.repo.upsert({ creatineLogs: [{ day: '2026-03-10', doseG: 5, takenAt: 't', updatedAt: 'u', deletedAt: null }] });
    expect(f.runs).toEqual([{ sql: 'INSERT OR REPLACE INTO creatine_logs (day, dose_g, taken_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)', params: ['2026-03-10', 5, 't', 'u', null] }]);
    await f.repo.listChangedSince('2026-03-01T00:00:00.000Z');
    expect(f.queries.every((q) => q.sql.includes('WHERE updated_at > ?') && q.params[0] === '2026-03-01T00:00:00.000Z')).toBe(true);
    expect(f.queries).toHaveLength(3);
  });

  it('retries opening after a failure', async () => {
    let attempts = 0;
    const repo = createSqliteRepository(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('locked');
      return { ...fakeDb(0).db, runAsync: async () => {}, getAllAsync: async () => [], withTransactionAsync: async (t: () => Promise<void>) => t() } as SqlDb;
    });
    await expect(repo.init()).rejects.toThrow('locked');
    await expect(repo.init()).resolves.toBeUndefined();
    expect(attempts).toBe(2);
  });
});
