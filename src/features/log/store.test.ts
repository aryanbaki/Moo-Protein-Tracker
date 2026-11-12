import { createJsonRepository, createMemoryStore, JSON_STORAGE_KEY } from '../../storage/jsonRepository';
import { getAllRowsForSync, listChangedSince, LogValidationError, setLogRepository, upsertFromRemote, useLog } from './index';

jest.mock('expo-sqlite', () => ({}));
jest.mock('../../lib/id', () => {
  let i = 0;
  return { newId: () => `id-${++i}` };
});

const food = { name: 'Chicken', proteinG: 40, calories: 300, carbsG: 0, fatG: 8, source: 'manual' as const };
let kv: ReturnType<typeof createMemoryStore>;

async function boot(store = createMemoryStore()) {
  kv = store;
  setLogRepository(createJsonRepository(kv));
  await useLog.getState().init();
}
/** Simulate an app restart on the same storage. */
const restart = () => boot(kv);

beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 2, 10, 9, 0, 0) });
  await boot();
});
afterEach(() => jest.useRealTimers());

const tick = (ms = 1000) => jest.setSystemTime(Date.now() + ms);

describe('useLog (JSON repository)', () => {
  it('starts ready and empty', () => {
    const s = useLog.getState();
    expect(s.ready).toBe(true);
    expect(s.entries).toEqual([]);
    expect(s.storageError).toBeNull();
  });

  it('adds an entry on the local day and persists it across a restart', async () => {
    const e = await useLog.getState().addEntry(food);
    expect(e.day).toBe('2026-03-10');
    expect(e.deletedAt).toBeNull();
    await restart();
    expect(useLog.getState().entries).toEqual([e]);
  });

  it('files a late-night entry under the local day, and it stays there', async () => {
    jest.setSystemTime(new Date(2026, 2, 10, 23, 59, 30));
    const late = await useLog.getState().addEntry(food);
    jest.setSystemTime(new Date(2026, 2, 11, 0, 0, 30));
    const early = await useLog.getState().addEntry(food);
    expect(late.day).toBe('2026-03-10');
    expect(early.day).toBe('2026-03-11');
    await useLog.getState().updateEntry(late.id, { proteinG: 45 });
    expect(useLog.getState().entries.find((x) => x.id === late.id)).toMatchObject({ day: '2026-03-10', proteinG: 45 });
  });

  it('honours an explicit day and lists newest first', async () => {
    const a = await useLog.getState().addEntry({ ...food, day: '2026-03-08' });
    tick();
    const b = await useLog.getState().addEntry(food);
    expect(a.day).toBe('2026-03-08');
    expect(useLog.getState().entries.map((x) => x.id)).toEqual([b.id, a.id]);
  });

  it('validates on the way in and stores nothing when invalid', async () => {
    await expect(useLog.getState().addEntry({ ...food, proteinG: -1 })).rejects.toBeInstanceOf(LogValidationError);
    await expect(useLog.getState().addEntry({ ...food, calories: Number.NaN })).rejects.toBeInstanceOf(LogValidationError);
    expect(useLog.getState().entries).toHaveLength(0);
    expect(kv.dump()[JSON_STORAGE_KEY]).toBeUndefined();
    const quick = await useLog.getState().addEntry({ ...food, name: '   ', source: 'quick' });
    expect(quick.name).toBe('Quick add');
  });

  it('updates fields, bumps updatedAt and rejects a bad patch', async () => {
    const e = await useLog.getState().addEntry(food);
    tick();
    await useLog.getState().updateEntry(e.id, { name: ' Tofu ', proteinG: 22 });
    const after = useLog.getState().entries[0]!;
    expect(after).toMatchObject({ name: 'Tofu', proteinG: 22, calories: 300, createdAt: e.createdAt });
    expect(after.updatedAt > e.updatedAt).toBe(true);
    await expect(useLog.getState().updateEntry(e.id, { fatG: -3 })).rejects.toBeInstanceOf(LogValidationError);
    expect(useLog.getState().entries[0]!.fatG).toBe(8);
    await expect(useLog.getState().updateEntry('nope', { proteinG: 1 })).resolves.toBeUndefined();
  });

  it('soft-deletes: gone from the mirror, kept in storage with deletedAt, and restorable', async () => {
    const e = await useLog.getState().addEntry(food);
    tick();
    await useLog.getState().deleteEntry(e.id);
    expect(useLog.getState().entries).toHaveLength(0);
    const rows = await getAllRowsForSync();
    expect(rows.foodEntries).toHaveLength(1);
    expect(rows.foodEntries[0]!.deletedAt).not.toBeNull();
    await restart();
    expect(useLog.getState().entries).toHaveLength(0);
    tick();
    expect(await useLog.getState().restoreEntry(e.id)).toBe(true);
    expect(useLog.getState().entries.map((x) => x.id)).toEqual([e.id]);
    expect((await getAllRowsForSync()).foodEntries[0]!.deletedAt).toBeNull();
    expect(await useLog.getState().restoreEntry('nope')).toBe(false);
  });

  it('checks creatine off and on, one row per day', async () => {
    const { setCreatineTaken } = useLog.getState();
    await setCreatineTaken('2026-03-10', 5, true);
    await setCreatineTaken('2026-03-10', 5, true);
    expect(useLog.getState().creatineLogs).toHaveLength(1);
    tick();
    await setCreatineTaken('2026-03-10', 5, false);
    expect(useLog.getState().creatineLogs).toHaveLength(0);
    const rows = await getAllRowsForSync();
    expect(rows.creatineLogs).toHaveLength(1);
    expect(rows.creatineLogs[0]!.deletedAt).not.toBeNull();
    await setCreatineTaken('2026-03-10', 3, true);
    await restart();
    expect(useLog.getState().creatineLogs).toMatchObject([{ day: '2026-03-10', doseG: 3 }]);
    await expect(setCreatineTaken('today', 5, true)).rejects.toBeInstanceOf(LogValidationError);
  });

  it('logs one weight per day, replacing the earlier one', async () => {
    await useLog.getState().logWeight('2026-03-10', 80);
    await useLog.getState().logWeight('2026-03-09', 80.5);
    await useLog.getState().logWeight('2026-03-10', 79.64);
    expect(useLog.getState().weightLogs).toEqual([
      { day: '2026-03-09', weightKg: 80.5 },
      { day: '2026-03-10', weightKg: 79.6 },
    ]);
    await expect(useLog.getState().logWeight('2026-03-10', 0)).rejects.toBeInstanceOf(LogValidationError);
  });

  it('clearAll wipes mirror and storage', async () => {
    await useLog.getState().addEntry(food);
    await useLog.getState().setCreatineTaken('2026-03-10', 5, true);
    await useLog.getState().clearAll();
    await restart();
    const s = useLog.getState();
    expect([s.entries, s.creatineLogs, s.weightLogs]).toEqual([[], [], []]);
  });

  it('keeps the app usable when storage cannot open', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    setLogRepository({
      init: async () => {
        throw new Error('disk on fire');
      },
      loadAll: async () => ({ foodEntries: [], creatineLogs: [], weightLogs: [] }),
      listChangedSince: async () => ({ foodEntries: [], creatineLogs: [], weightLogs: [] }),
      upsert: async () => {},
      clearAll: async () => {},
    });
    await useLog.getState().init();
    expect(useLog.getState()).toMatchObject({ ready: true, storageError: 'disk on fire' });
    warn.mockRestore();
  });
});

describe('sync helpers', () => {
  it('listChangedSince returns rows after the cursor, including deletions', async () => {
    const a = await useLog.getState().addEntry(food);
    tick();
    const cursor = new Date().toISOString();
    tick();
    const b = await useLog.getState().addEntry(food);
    await useLog.getState().deleteEntry(a.id);
    await useLog.getState().setCreatineTaken('2026-03-10', 5, true);
    await useLog.getState().logWeight('2026-03-10', 80);
    const changed = await listChangedSince(cursor);
    expect(changed.foodEntries.map((x) => x.id).sort()).toEqual([a.id, b.id].sort());
    expect(changed.foodEntries.find((x) => x.id === a.id)!.deletedAt).not.toBeNull();
    expect(changed.creatineLogs).toHaveLength(1);
    expect(changed.weightLogs).toHaveLength(1);
    expect((await listChangedSince('')).foodEntries).toHaveLength(2);
    tick();
    expect((await listChangedSince(new Date().toISOString())).foodEntries).toHaveLength(0);
  });

  it('upsertFromRemote applies newer rows, ignores older ones, and carries deletions', async () => {
    const local = await useLog.getState().addEntry(food);
    const older = { ...local, name: 'Stale', updatedAt: '2020-01-01T00:00:00.000Z' };
    expect(await upsertFromRemote({ foodEntries: [older] })).toBe(0);
    expect(useLog.getState().entries[0]!.name).toBe('Chicken');

    const newer = { ...local, name: 'From phone', updatedAt: '2030-01-01T00:00:00.000Z' };
    const fresh = { ...local, id: 'remote-1', name: 'Remote', day: '2026-03-09' };
    expect(await upsertFromRemote({ foodEntries: [newer, fresh], weightLogs: [{ day: '2026-03-09', weightKg: 81, updatedAt: '2030-01-01T00:00:00.000Z', deletedAt: null }] })).toBe(3);
    expect(useLog.getState().entries.map((x) => x.name).sort()).toEqual(['From phone', 'Remote']);
    expect(useLog.getState().weightLogs).toEqual([{ day: '2026-03-09', weightKg: 81 }]);

    const tombstone = { ...newer, updatedAt: '2031-01-01T00:00:00.000Z', deletedAt: '2031-01-01T00:00:00.000Z' };
    expect(await upsertFromRemote({ foodEntries: [tombstone] })).toBe(1);
    expect(useLog.getState().entries.map((x) => x.id)).toEqual(['remote-1']);
    await restart();
    expect(useLog.getState().entries.map((x) => x.id)).toEqual(['remote-1']);
  });
});
