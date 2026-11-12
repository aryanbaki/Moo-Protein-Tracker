/**
 * Cloud sync. Local storage stays the source of truth; when signed in, changed
 * rows are pushed to and pulled from Supabase with last-write-wins on
 * `updatedAt` (soft deletes travel as rows with `deletedAt`).
 *
 * Everything here is a quiet no-op when signed out or when Supabase is not
 * configured, and a failed sync never throws into the UI: it is retried on the
 * next trigger (sign-in, app foreground, or a few seconds after a local change).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { create } from 'zustand';

import { getSupabase } from '../../lib/supabase';
import { useProfile } from '../../state/profile';
import type { LogRows } from '../../storage/types';
import { useAuth } from '../auth';
import { useBilling } from '../billing';
import { listChangedSince, upsertFromRemote, useLog } from '../log';
import {
  countRows,
  creatineFromRemote,
  creatineToRemote,
  decideProfile,
  foodFromRemote,
  foodToRemote,
  nextCursor,
  planLogMerge,
  profileFromRemote,
  profileToRemote,
  weightFromRemote,
  weightToRemote,
  type RemoteCreatineLog,
  type RemoteFoodEntry,
  type RemoteProfileRow,
  type RemoteWeightLog,
  type SyncedProfile,
} from './merge';
import { emptySyncMeta, readSyncMeta, writeSyncMeta, type SyncMeta, type SyncTable } from './meta';

export { decideProfile, lastWriteWins, planLogMerge, planMerge } from './merge';
export type { SyncedProfile } from './merge';
export { SYNC_META_KEY, clearSyncMeta, readSyncMeta } from './meta';

export interface SyncStatus {
  syncing: boolean;
  /** ISO time the last successful sync finished on this device, or null. */
  lastSyncedAt: string | null;
  /** Short human message for the last failure, cleared on success. */
  lastError: string | null;
}

/** Observable sync status for Settings ("Last synced ..."). */
export const useSyncStatus = create<SyncStatus>()(() => ({ syncing: false, lastSyncedAt: null, lastError: null }));

export type SyncResult =
  | { ok: true; pushed: number; pulled: number; profile: 'push' | 'pull' | 'none' }
  | { ok: false; skipped: true; reason: 'not_configured' | 'signed_out' }
  | { ok: false; skipped?: false; error: string };

const PAGE = 500;
const PROFILE_COLUMNS = 'id, goals, answers, creatine, units, updated_at, photo_scans_used';
const DEBOUNCE_MS = 3000;

/** True while this module is writing pulled data into the stores, so those writes are not mistaken for user edits. */
let applyingRemote = false;
let running: Promise<SyncResult> | null = null;
let rerun = false;

async function metaFor(userId: string): Promise<SyncMeta> {
  const meta = await readSyncMeta();
  if (meta.userId === userId) return meta;
  // First sync for this account on this device: start the cursors over, but
  // keep the local profile edit time so a freshly finished onboarding counts.
  return writeSyncMeta({ ...emptySyncMeta, userId, profileUpdatedAt: meta.userId ? null : meta.profileUpdatedAt });
}

async function pullTable<T extends { server_updated_at?: string }>(supabase: SupabaseClient, table: SyncTable, userId: string, cursor: string | null): Promise<{ rows: T[]; cursor: string | null }> {
  const rows: T[] = [];
  let at = cursor;
  for (;;) {
    let q = supabase.from(table).select('*').eq('user_id', userId).order('server_updated_at', { ascending: true }).limit(PAGE);
    if (at) q = q.gt('server_updated_at', at);
    const { data, error } = await q;
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    const next = nextCursor(at, page);
    if (page.length < PAGE || next === at) return { rows, cursor: next };
    at = next;
  }
}

async function pushTable(supabase: SupabaseClient, table: SyncTable | 'profiles', rows: object[], onConflict: string): Promise<void> {
  for (let i = 0; i < rows.length; i += PAGE) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + PAGE), { onConflict });
    if (error) throw error;
  }
}

/** Fetch the signed-in user's profile document from the server, or null. */
export async function pullProfile(): Promise<(SyncedProfile & { photoScansUsed: number }) | null> {
  const supabase = getSupabase();
  const user = useAuth.getState().user;
  if (!supabase || !user) return null;
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', user.id).maybeSingle();
  if (error) throw error;
  const row = data as RemoteProfileRow | null;
  const profile = profileFromRemote(row);
  return profile ? { ...profile, photoScansUsed: Math.max(0, Number(row?.photo_scans_used) || 0) } : null;
}

/** Write a server profile into local state. Returns false when it has no goals (nothing to restore). */
export function applyRemoteProfile(remote: SyncedProfile): boolean {
  if (!remote.goals) return false;
  applyingRemote = true;
  try {
    const p = useProfile.getState();
    p.setGoals(remote.goals);
    p.setAnswers(remote.answers);
    if (remote.creatine) p.setCreatine(remote.creatine);
    if (remote.units) p.setUnits(remote.units);
  } finally {
    applyingRemote = false;
  }
  return true;
}

/**
 * For "I already have an account": after sign-in, restore the saved plan from
 * the server. Resolves true when goals were found and written into useProfile
 * (the caller then completes onboarding), false otherwise.
 */
export async function restoreProfileFromServer(): Promise<boolean> {
  try {
    const remote = await pullProfile();
    if (!remote || !applyRemoteProfile(remote)) return false;
    const user = useAuth.getState().user;
    if (user) {
      await metaFor(user.id);
      await writeSyncMeta({ profileUpdatedAt: remote.updatedAt });
    }
    adoptScanCount(remote.photoScansUsed);
    return true;
  } catch {
    return false;
  }
}

/** The server counts photo scans too; never let a reinstall reset the free allowance. */
function adoptScanCount(remoteUsed: number): void {
  if (remoteUsed > useBilling.getState().photoScansUsed) useBilling.setState({ photoScansUsed: remoteUsed });
}

async function syncProfile(supabase: SupabaseClient, userId: string, meta: SyncMeta): Promise<'push' | 'pull' | 'none'> {
  const remote = await pullProfile();
  if (remote) adoptScanCount(remote.photoScansUsed);
  const local = useProfile.getState();
  const decision = decideProfile({ hasGoals: !!local.goals, updatedAt: meta.profileUpdatedAt }, remote ? { hasGoals: !!remote.goals, updatedAt: remote.updatedAt } : null);
  if (decision === 'pull' && remote) {
    applyRemoteProfile(remote);
    await writeSyncMeta({ profileUpdatedAt: remote.updatedAt });
  } else if (decision === 'push') {
    const updatedAt = meta.profileUpdatedAt ?? new Date().toISOString();
    const { error } = await supabase.from('profiles').upsert(profileToRemote(userId, local, updatedAt), { onConflict: 'id' });
    if (error) throw error;
    await writeSyncMeta({ profileUpdatedAt: updatedAt });
  }
  return decision;
}

async function runSync(): Promise<SyncResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, skipped: true, reason: 'not_configured' };
  const user = useAuth.getState().user;
  if (!user) return { ok: false, skipped: true, reason: 'signed_out' };

  useSyncStatus.setState({ syncing: true });
  try {
    const meta = await metaFor(user.id);
    // Taken before reading local changes: anything edited while we are busy is picked up next time.
    const startedAt = new Date().toISOString();

    const profile = await syncProfile(supabase, user.id, meta);

    const [food, creatine, weight] = await Promise.all([
      pullTable<RemoteFoodEntry>(supabase, 'food_entries', user.id, meta.pullCursors.food_entries ?? null),
      pullTable<RemoteCreatineLog>(supabase, 'creatine_logs', user.id, meta.pullCursors.creatine_logs ?? null),
      pullTable<RemoteWeightLog>(supabase, 'weight_logs', user.id, meta.pullCursors.weight_logs ?? null),
    ]);
    const remoteChanged: LogRows = {
      foodEntries: food.rows.map(foodFromRemote),
      creatineLogs: creatine.rows.map(creatineFromRemote),
      weightLogs: weight.rows.map(weightFromRemote),
    };
    const localChanged = await listChangedSince(meta.lastPushedAt ?? '');
    const plan = planLogMerge(localChanged, remoteChanged);

    let pulled = 0;
    if (countRows(plan.applyLocal) > 0) {
      applyingRemote = true;
      try {
        pulled = await upsertFromRemote(plan.applyLocal);
      } finally {
        applyingRemote = false;
      }
    }

    await pushTable(supabase, 'food_entries', plan.push.foodEntries.map((r) => foodToRemote(user.id, r)), 'user_id,id');
    await pushTable(supabase, 'creatine_logs', plan.push.creatineLogs.map((r) => creatineToRemote(user.id, r)), 'user_id,day');
    await pushTable(supabase, 'weight_logs', plan.push.weightLogs.map((r) => weightToRemote(user.id, r)), 'user_id,day');

    // Sign-out or account switch mid-flight: do not record cursors for the wrong user.
    if (useAuth.getState().user?.id !== user.id) return { ok: false, error: 'Account changed during sync.' };

    const lastSyncedAt = new Date().toISOString();
    await writeSyncMeta({
      userId: user.id,
      lastPushedAt: startedAt,
      pullCursors: { food_entries: food.cursor, creatine_logs: creatine.cursor, weight_logs: weight.cursor },
      lastSyncedAt,
    });
    useSyncStatus.setState({ syncing: false, lastSyncedAt, lastError: null });
    return { ok: true, pushed: countRows(plan.push), pulled, profile };
  } catch (err) {
    const offline = err && typeof err === 'object' && 'message' in err && /network|fetch/i.test(String((err as { message: unknown }).message));
    const error = offline ? "Can't reach the server. Moo will try again." : "Sync didn't finish. Moo will try again.";
    useSyncStatus.setState({ syncing: false, lastError: error });
    return { ok: false, error };
  }
}

/**
 * Push local changes, pull remote ones, merge. Calls made while a sync is
 * running share its result and queue exactly one follow-up run.
 */
export function syncNow(): Promise<SyncResult> {
  if (running) {
    rerun = true;
    return running;
  }
  running = runSync().finally(() => {
    running = null;
    if (rerun) {
      rerun = false;
      void syncNow();
    }
  });
  return running;
}

let stop: (() => void) | null = null;

/**
 * Start automatic syncing: on sign-in, when the app returns to the foreground,
 * and a few seconds after a local change. Call once from the root layout after
 * initAuth(); calling it again is harmless.
 */
export function startSync(): void {
  if (stop) return;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (!useAuth.getState().user) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void syncNow();
    }, DEBOUNCE_MS);
  };

  void readSyncMeta().then((m) => useSyncStatus.setState({ lastSyncedAt: m.lastSyncedAt }));

  let lastUserId = useAuth.getState().user?.id ?? null;
  const unsubAuth = useAuth.subscribe((s) => {
    const id = s.user?.id ?? null;
    if (id === lastUserId) return;
    lastUserId = id;
    if (id) void syncNow();
  });

  const unsubLog = useLog.subscribe((s, prev) => {
    if (applyingRemote || !s.ready || !prev.ready) return;
    if (s.entries !== prev.entries || s.creatineLogs !== prev.creatineLogs || s.weightLogs !== prev.weightLogs) schedule();
  });

  // Profile edits are stamped even while signed out, so the plan made during
  // onboarding is newer than an empty server profile when the account appears.
  const unsubProfile = useProfile.subscribe((s, prev) => {
    if (applyingRemote || !prev.hydrated) return;
    if (s.goals !== prev.goals || s.answers !== prev.answers || s.creatine !== prev.creatine || s.units !== prev.units) {
      void writeSyncMeta({ profileUpdatedAt: new Date().toISOString() }).then(schedule);
    }
  });

  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') void syncNow();
  });

  if (lastUserId) void syncNow();

  stop = () => {
    if (timer) clearTimeout(timer);
    unsubAuth();
    unsubLog();
    unsubProfile();
    appState.remove();
  };
}

export function stopSync(): void {
  stop?.();
  stop = null;
}
