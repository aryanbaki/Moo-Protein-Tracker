import type { FoodEntryRow } from '../../storage/types';
import {
  creatineFromRemote,
  creatineToRemote,
  decideProfile,
  foodFromRemote,
  foodToRemote,
  lastWriteWins,
  nextCursor,
  planLogMerge,
  planMerge,
  profileFromRemote,
  profileToRemote,
  toIso,
  weightFromRemote,
  weightToRemote,
} from './merge';

const T1 = '2026-03-01T10:00:00.000Z';
const T2 = '2026-03-01T11:00:00.000Z';
const T3 = '2026-03-01T12:00:00.000Z';

const food = (id: string, updatedAt: string, extra: Partial<FoodEntryRow> = {}): FoodEntryRow => ({
  id,
  day: '2026-03-01',
  name: 'Eggs',
  proteinG: 18,
  calories: 210,
  carbsG: 1,
  fatG: 15,
  source: 'manual',
  createdAt: T1,
  updatedAt,
  deletedAt: null,
  ...extra,
});

describe('lastWriteWins', () => {
  it('picks the newer side', () => {
    expect(lastWriteWins({ updatedAt: T2 }, { updatedAt: T1 })).toBe('local');
    expect(lastWriteWins({ updatedAt: T1 }, { updatedAt: T2 })).toBe('remote');
    expect(lastWriteWins({ updatedAt: T1 }, { updatedAt: T1 })).toBe('same');
  });
  it('treats a missing side as the loser', () => {
    expect(lastWriteWins(undefined, { updatedAt: T1 })).toBe('remote');
    expect(lastWriteWins({ updatedAt: T1 }, null)).toBe('local');
    expect(lastWriteWins(null, null)).toBe('same');
  });
  it('compares instants, not text (Postgres offset vs JS "Z")', () => {
    expect(lastWriteWins({ updatedAt: '2026-03-01T10:00:00.000Z' }, { updatedAt: '2026-03-01T10:00:00+00:00' })).toBe('same');
    expect(lastWriteWins({ updatedAt: '2026-03-01T10:00:00.000Z' }, { updatedAt: '2026-03-01T12:30:00+02:00' })).toBe('remote');
  });
  it('never lets an unreadable timestamp win', () => {
    expect(lastWriteWins({ updatedAt: 'nope' }, { updatedAt: T1 })).toBe('remote');
    expect(lastWriteWins({ updatedAt: T1 }, { updatedAt: '' })).toBe('local');
  });
});

describe('planMerge', () => {
  const key = (r: FoodEntryRow) => r.id;
  it('pushes local-only changes and applies remote-only changes', () => {
    const plan = planMerge([food('a', T1)], [food('b', T1)], key);
    expect(plan.push.map(key)).toEqual(['a']);
    expect(plan.applyLocal.map(key)).toEqual(['b']);
  });
  it('sends a conflicting row one way only, towards the older copy', () => {
    const plan = planMerge([food('a', T3, { name: 'Local' }), food('b', T1, { name: 'Local' })], [food('a', T2, { name: 'Remote' }), food('b', T2, { name: 'Remote' })], key);
    expect(plan.push.map((r) => `${r.id}:${r.name}`)).toEqual(['a:Local']);
    expect(plan.applyLocal.map((r) => `${r.id}:${r.name}`)).toEqual(['b:Remote']);
  });
  it('does nothing for identical timestamps', () => {
    expect(planMerge([food('a', T1)], [food('a', T1)], key)).toEqual({ applyLocal: [], push: [] });
  });
  it('carries soft deletes in both directions', () => {
    const plan = planMerge([food('a', T3, { deletedAt: T3 })], [food('b', T3, { deletedAt: T3 }), food('a', T1)], key);
    expect(plan.push[0]).toMatchObject({ id: 'a', deletedAt: T3 });
    expect(plan.applyLocal[0]).toMatchObject({ id: 'b', deletedAt: T3 });
  });
  it('lets a newer edit beat an older delete', () => {
    const plan = planMerge([food('a', T3, { name: 'Edited' })], [food('a', T2, { deletedAt: T2 })], key);
    expect(plan.push).toHaveLength(1);
    expect(plan.applyLocal).toHaveLength(0);
  });
  it('keeps only the newest copy when the server repeats a key', () => {
    const plan = planMerge([], [food('a', T1, { name: 'old' }), food('a', T2, { name: 'new' })], key);
    expect(plan.applyLocal.map((r) => r.name)).toEqual(['new']);
  });
});

describe('planLogMerge', () => {
  it('merges each table by its own key', () => {
    const plan = planLogMerge(
      { foodEntries: [food('a', T2)], creatineLogs: [{ day: '2026-03-01', doseG: 5, takenAt: T1, updatedAt: T1, deletedAt: null }], weightLogs: [] },
      { foodEntries: [], creatineLogs: [{ day: '2026-03-01', doseG: 3, takenAt: T2, updatedAt: T2, deletedAt: null }], weightLogs: [{ day: '2026-03-01', weightKg: 80, updatedAt: T1, deletedAt: null }] },
    );
    expect(plan.push.foodEntries).toHaveLength(1);
    expect(plan.push.creatineLogs).toHaveLength(0);
    expect(plan.applyLocal.creatineLogs[0].doseG).toBe(3);
    expect(plan.applyLocal.weightLogs[0].weightKg).toBe(80);
  });
});

describe('decideProfile', () => {
  it('does nothing when neither side has a plan', () => {
    expect(decideProfile({ hasGoals: false, updatedAt: null }, null)).toBe('none');
    expect(decideProfile({ hasGoals: false, updatedAt: T1 }, { hasGoals: false, updatedAt: T2 })).toBe('none');
  });
  it('never pushes an empty local profile over a real one', () => {
    expect(decideProfile({ hasGoals: false, updatedAt: T3 }, { hasGoals: true, updatedAt: T1 })).toBe('pull');
  });
  it('pushes the first plan to a fresh account', () => {
    expect(decideProfile({ hasGoals: true, updatedAt: null }, { hasGoals: false, updatedAt: T3 })).toBe('push');
    expect(decideProfile({ hasGoals: true, updatedAt: T1 }, null)).toBe('push');
  });
  it('is last-write-wins when both have a plan', () => {
    expect(decideProfile({ hasGoals: true, updatedAt: T3 }, { hasGoals: true, updatedAt: T2 })).toBe('push');
    expect(decideProfile({ hasGoals: true, updatedAt: T1 }, { hasGoals: true, updatedAt: T2 })).toBe('pull');
    expect(decideProfile({ hasGoals: true, updatedAt: T2 }, { hasGoals: true, updatedAt: T2 })).toBe('none');
    expect(decideProfile({ hasGoals: true, updatedAt: null }, { hasGoals: true, updatedAt: T2 })).toBe('pull');
  });
});

describe('profile mapping', () => {
  const goals = { proteinG: 150, calories: 2400, carbsG: 280, fatG: 70 };
  it('validates the remote document', () => {
    const p = profileFromRemote({ goals, answers: { mainGoal: 'build_muscle' }, creatine: { enabled: true, doseG: 5, reminderTime: '08:00' }, units: 'metric', updated_at: T1 });
    expect(p).toEqual({ goals, answers: { mainGoal: 'build_muscle' }, creatine: { enabled: true, doseG: 5, reminderTime: '08:00' }, units: 'metric', updatedAt: T1 });
  });
  it('drops malformed parts instead of passing them on', () => {
    const p = profileFromRemote({ goals: { proteinG: '150' }, answers: null, creatine: 'yes', units: 'stone', updated_at: null });
    expect(p).toEqual({ goals: null, answers: {}, creatine: null, units: null, updatedAt: null });
    expect(profileFromRemote(null)).toBeNull();
  });
  it('never sends the server-owned columns', () => {
    const row = profileToRemote('u1', { goals, answers: {}, creatine: { enabled: false, doseG: 5, reminderTime: null }, units: 'imperial' }, T1);
    expect(Object.keys(row).sort()).toEqual(['answers', 'creatine', 'goals', 'id', 'units', 'updated_at']);
  });
});

describe('row mapping', () => {
  it('round-trips a food entry', () => {
    const row = food('a', T2, { deletedAt: T2, source: 'photo' });
    expect(foodFromRemote(foodToRemote('u1', row))).toEqual(row);
    expect(foodToRemote('u1', row).user_id).toBe('u1');
  });
  it('normalises Postgres timestamps and numeric strings', () => {
    const r = foodFromRemote({ id: 'a', day: '2026-03-01', name: 'Eggs', protein_g: '18.5' as unknown as number, calories: 210, carbs_g: 1, fat_g: 15, source: 'mystery', created_at: '2026-03-01T10:00:00+00:00', updated_at: '2026-03-01T11:00:00.5+00:00', deleted_at: null });
    expect(r.proteinG).toBe(18.5);
    expect(r.source).toBe('manual');
    expect(r.createdAt).toBe(T1);
    expect(r.updatedAt).toBe('2026-03-01T11:00:00.500Z');
  });
  it('round-trips creatine and weight rows', () => {
    const c = { day: '2026-03-01', doseG: 5, takenAt: T1, updatedAt: T2, deletedAt: null };
    const w = { day: '2026-03-01', weightKg: 81.4, updatedAt: T2, deletedAt: T3 };
    expect(creatineFromRemote(creatineToRemote('u1', c))).toEqual(c);
    expect(weightFromRemote(weightToRemote('u1', w))).toEqual(w);
  });
  it('toIso leaves garbage alone', () => {
    expect(toIso('nope')).toBe('nope');
  });
});

describe('nextCursor', () => {
  it('advances to the newest server stamp and never goes backwards', () => {
    expect(nextCursor(null, [])).toBeNull();
    expect(nextCursor(null, [{ server_updated_at: T1 }, { server_updated_at: T3 }, { server_updated_at: T2 }])).toBe(T3);
    expect(nextCursor(T3, [{ server_updated_at: T1 }])).toBe(T3);
    expect(nextCursor(T1, [{}])).toBe(T1);
  });
});
