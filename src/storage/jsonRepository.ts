import { applyRows } from './merge';
import { emptyRows, type KeyValueStore, type LogRepository, type LogRows } from './types';

export const JSON_STORAGE_KEY = 'moo.log.v1';
export const JSON_SCHEMA_VERSION = 1;

interface Snapshot extends LogRows {
  version: number;
}

function parse(raw: string | null): LogRows {
  if (!raw) return emptyRows();
  try {
    const data = JSON.parse(raw) as Partial<Snapshot> | null;
    if (!data || typeof data !== 'object') return emptyRows();
    return {
      foodEntries: Array.isArray(data.foodEntries) ? data.foodEntries : [],
      creatineLogs: Array.isArray(data.creatineLogs) ? data.creatineLogs : [],
      weightLogs: Array.isArray(data.weightLogs) ? data.weightLogs : [],
    };
  } catch {
    // Corrupt blob: start clean rather than crash on launch.
    return emptyRows();
  }
}

/**
 * JSON repository: the whole log is one JSON document in a key-value store.
 * Used on web (AsyncStorage → localStorage) and in tests. Writes are queued so
 * two quick mutations cannot interleave and drop one another.
 */
export function createJsonRepository(kv: KeyValueStore, key: string = JSON_STORAGE_KEY): LogRepository {
  let cache: LogRows | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  const load = async (): Promise<LogRows> => {
    if (!cache) cache = parse(await kv.getItem(key));
    return cache;
  };
  const enqueue = <T>(job: () => Promise<T>): Promise<T> => {
    const run = queue.then(job, job);
    queue = run.catch(() => undefined);
    return run;
  };
  const persist = (rows: LogRows) => {
    const snapshot: Snapshot = { version: JSON_SCHEMA_VERSION, ...rows };
    return kv.setItem(key, JSON.stringify(snapshot));
  };

  return {
    init: async () => {
      await enqueue(load);
    },
    loadAll: () =>
      enqueue(async () => {
        const r = await load();
        return { foodEntries: [...r.foodEntries], creatineLogs: [...r.creatineLogs], weightLogs: [...r.weightLogs] };
      }),
    listChangedSince: (iso) =>
      enqueue(async () => {
        const r = await load();
        return {
          foodEntries: r.foodEntries.filter((x) => x.updatedAt > iso),
          creatineLogs: r.creatineLogs.filter((x) => x.updatedAt > iso),
          weightLogs: r.weightLogs.filter((x) => x.updatedAt > iso),
        };
      }),
    upsert: (rows) =>
      enqueue(async () => {
        const next = applyRows(await load(), rows);
        await persist(next);
        cache = next;
      }),
    clearAll: () =>
      enqueue(async () => {
        await kv.removeItem(key);
        cache = emptyRows();
      }),
  };
}

/** In-memory key-value store (tests, and a last-resort fallback). */
export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore & { dump: () => Record<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => {
      data.set(k, v);
    },
    removeItem: async (k) => {
      data.delete(k);
    },
    dump: () => Object.fromEntries(data),
  };
}
