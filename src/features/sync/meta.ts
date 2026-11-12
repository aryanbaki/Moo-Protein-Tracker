/**
 * Sync bookkeeping kept in AsyncStorage. Dependency-light on purpose so auth
 * can clear it without importing the sync engine.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SYNC_META_KEY = 'moo.sync.v1';

export type SyncTable = 'food_entries' | 'creatine_logs' | 'weight_logs';

export interface SyncMeta {
  /** Account these cursors belong to. A different account starts from scratch. */
  userId: string | null;
  /** Local clock: rows with updatedAt after this still need pushing. */
  lastPushedAt: string | null;
  /** Per table: server clock (server_updated_at) of the newest row pulled so far. */
  pullCursors: Partial<Record<SyncTable, string | null>>;
  /** When the last full sync finished (local clock). */
  lastSyncedAt: string | null;
  /** When the profile (goals, answers, creatine, units) last changed on this device. */
  profileUpdatedAt: string | null;
}

export const emptySyncMeta: SyncMeta = {
  userId: null,
  lastPushedAt: null,
  pullCursors: {},
  lastSyncedAt: null,
  profileUpdatedAt: null,
};

export async function readSyncMeta(): Promise<SyncMeta> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_META_KEY);
    if (!raw) return { ...emptySyncMeta };
    return { ...emptySyncMeta, ...(JSON.parse(raw) as Partial<SyncMeta>) };
  } catch {
    return { ...emptySyncMeta };
  }
}

export async function writeSyncMeta(patch: Partial<SyncMeta>): Promise<SyncMeta> {
  const next = { ...(await readSyncMeta()), ...patch };
  try {
    await AsyncStorage.setItem(SYNC_META_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable: the next sync simply redoes a little work.
  }
  return next;
}

export async function clearSyncMeta(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_META_KEY);
  } catch {
    // ignore
  }
}
