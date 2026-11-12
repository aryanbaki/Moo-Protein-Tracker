import { createJsonRepository, createMemoryStore, JSON_SCHEMA_VERSION, JSON_STORAGE_KEY } from './jsonRepository';
import { applyRows, rowsToApply } from './merge';
import { emptyRows, type FoodEntryRow } from './types';

const row = (id: string, updatedAt: string, extra: Partial<FoodEntryRow> = {}): FoodEntryRow => ({
  id,
  day: '2026-03-10',
  name: id,
  proteinG: 10,
  calories: 100,
  carbsG: 1,
  fatG: 1,
  source: 'manual',
  createdAt: updatedAt,
  updatedAt,
  deletedAt: null,
  ...extra,
});

describe('JSON repository', () => {
  it('is empty before anything is written', async () => {
    const repo = createJsonRepository(createMemoryStore());
    await repo.init();
    expect(await repo.loadAll()).toEqual(emptyRows());
  });

  it('upserts by primary key and writes a versioned document', async () => {
    const kv = createMemoryStore();
    const repo = createJsonRepository(kv);
    await repo.upsert({ foodEntries: [row('a', '2026-03-10T08:00:00.000Z')] });
    await repo.upsert({ foodEntries: [row('a', '2026-03-10T09:00:00.000Z', { name: 'renamed' }), row('b', '2026-03-10T09:00:00.000Z')] });
    await repo.upsert({ creatineLogs: [{ day: '2026-03-10', doseG: 5, takenAt: 't', updatedAt: 'u', deletedAt: null }] });
    await repo.upsert({ creatineLogs: [{ day: '2026-03-10', doseG: 3, takenAt: 't', updatedAt: 'v', deletedAt: null }] });
    const all = await repo.loadAll();
    expect(all.foodEntries.map((r) => [r.id, r.name])).toEqual([
      ['a', 'renamed'],
      ['b', 'b'],
    ]);
    expect(all.creatineLogs).toHaveLength(1);
    expect(all.creatineLogs[0]!.doseG).toBe(3);
    expect(JSON.parse(kv.dump()[JSON_STORAGE_KEY]!).version).toBe(JSON_SCHEMA_VERSION);
  });

  it('a second repository on the same store sees the data (reload)', async () => {
    const kv = createMemoryStore();
    await createJsonRepository(kv).upsert({ weightLogs: [{ day: '2026-03-10', weightKg: 80, updatedAt: 'u', deletedAt: null }] });
    expect((await createJsonRepository(kv).loadAll()).weightLogs).toHaveLength(1);
  });

  it('keeps soft-deleted rows and reports them as changed', async () => {
    const repo = createJsonRepository(createMemoryStore());
    await repo.upsert({ foodEntries: [row('a', '2026-03-10T08:00:00.000Z'), row('b', '2026-03-10T10:00:00.000Z', { deletedAt: '2026-03-10T10:00:00.000Z' })] });
    const changed = await repo.listChangedSince('2026-03-10T09:00:00.000Z');
    expect(changed.foodEntries.map((r) => r.id)).toEqual(['b']);
    expect((await repo.listChangedSince('2026-03-10T10:00:00.000Z')).foodEntries).toEqual([]);
  });

  it('does not lose writes fired without awaiting', async () => {
    const repo = createJsonRepository(createMemoryStore());
    await Promise.all(Array.from({ length: 20 }, (_, i) => repo.upsert({ foodEntries: [row(`r${i}`, '2026-03-10T08:00:00.000Z')] })));
    expect((await repo.loadAll()).foodEntries).toHaveLength(20);
  });

  it('keeps working after a failed write and does not keep the unsaved row', async () => {
    const kv = createMemoryStore();
    const real = kv.setItem;
    kv.setItem = async () => {
      throw new Error('quota');
    };
    const repo = createJsonRepository(kv);
    await expect(repo.upsert({ foodEntries: [row('a', 'u')] })).rejects.toThrow('quota');
    kv.setItem = real;
    await repo.upsert({ foodEntries: [row('b', 'u')] });
    expect((await repo.loadAll()).foodEntries.map((r) => r.id)).toEqual(['b']);
  });

  it('survives a corrupt or foreign document', async () => {
    for (const bad of ['{not json', 'null', '"hi"', '{"foodEntries":7}']) {
      const repo = createJsonRepository(createMemoryStore({ [JSON_STORAGE_KEY]: bad }));
      await repo.init();
      expect(await repo.loadAll()).toEqual(emptyRows());
    }
  });

  it('clearAll removes the document', async () => {
    const kv = createMemoryStore();
    const repo = createJsonRepository(kv);
    await repo.upsert({ foodEntries: [row('a', 'u')] });
    await repo.clearAll();
    expect(kv.dump()).toEqual({});
    expect(await repo.loadAll()).toEqual(emptyRows());
  });

  it('returns copies, so callers cannot mutate the cache', async () => {
    const repo = createJsonRepository(createMemoryStore());
    await repo.upsert({ foodEntries: [row('a', 'u')] });
    (await repo.loadAll()).foodEntries.length = 0;
    expect((await repo.loadAll()).foodEntries).toHaveLength(1);
  });
});

describe('merge helpers', () => {
  it('rowsToApply is last-write-wins, with ties going to what we already have', () => {
    const existing = { ...emptyRows(), foodEntries: [row('a', '2026-03-10T08:00:00.000Z')] };
    const out = rowsToApply(existing, {
      foodEntries: [
        row('a', '2026-03-10T08:00:00.000Z', { name: 'tie' }),
        row('b', '2026-03-10T07:00:00.000Z'),
        row('b', '2026-03-10T09:00:00.000Z', { name: 'b-newest' }),
        row('b', '2026-03-10T08:00:00.000Z', { name: 'b-middle' }),
      ],
    });
    expect(out.foodEntries.map((r) => r.name)).toEqual(['b-newest']);
  });

  it('applyRows does not mutate its input', () => {
    const base = { ...emptyRows(), foodEntries: [row('a', 'u')] };
    const next = applyRows(base, { foodEntries: [row('b', 'u')] });
    expect(base.foodEntries).toHaveLength(1);
    expect(next.foodEntries).toHaveLength(2);
    expect(applyRows(base, {}).foodEntries).toBe(base.foodEntries);
  });
});
