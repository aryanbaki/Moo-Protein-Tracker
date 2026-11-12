import type { FoodEntry } from '../../types';
import {
  averages,
  bestStreak,
  bucketByDay,
  creatineConsistency,
  goalHitDays,
  lastDays,
  lastMonths,
  monthlyAverages,
  weightSeries,
} from './index';

let n = 0;
function e(day: string, proteinG: number, calories = 0, deleted = false): FoodEntry {
  n += 1;
  return {
    id: `e${n}`, day, name: 'hay', proteinG, calories, carbsG: 0, fatG: 0, source: 'manual',
    createdAt: `${day}T10:00:00.000Z`, updatedAt: `${day}T10:00:00.000Z`, deletedAt: deleted ? `${day}T11:00:00.000Z` : null,
  };
}

describe('lastDays / lastMonths', () => {
  it('ends on today and crosses month ends', () => {
    expect(lastDays('2026-03-02', 4)).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
  });
  it('crosses year ends', () => {
    expect(lastMonths('2026-02-15', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(lastMonths('2026-03-31', 2)).toEqual(['2026-02', '2026-03']);
  });
});

describe('bucketByDay', () => {
  it('sums per day, zero-fills, skips deleted', () => {
    const out = bucketByDay([e('2026-01-02', 30, 200), e('2026-01-02', 20, 100), e('2026-01-02', 99, 999, true), e('2026-01-05', 5)], ['2026-01-01', '2026-01-02']);
    expect(out).toEqual([
      { day: '2026-01-01', proteinG: 0, calories: 0, carbsG: 0, fatG: 0, entryCount: 0 },
      { day: '2026-01-02', proteinG: 50, calories: 300, carbsG: 0, fatG: 0, entryCount: 2 },
    ]);
  });
});

describe('monthlyAverages', () => {
  it('averages per logged day, not per calendar day', () => {
    const out = monthlyAverages([e('2026-01-02', 100, 2000), e('2026-01-02', 50, 0), e('2026-01-20', 50, 1000), e('2026-03-01', 80, 500)], ['2026-01', '2026-02', '2026-03']);
    expect(out[0]).toEqual({ month: '2026-01', loggedDays: 2, avgProteinG: 100, avgCalories: 1500 });
    expect(out[1]).toEqual({ month: '2026-02', loggedDays: 0, avgProteinG: 0, avgCalories: 0 });
    expect(out[2].avgProteinG).toBe(80);
  });
});

describe('bestStreak', () => {
  it('finds the longest consecutive run, across month boundaries', () => {
    const entries = [e('2026-01-30', 150), e('2026-01-31', 160), e('2026-02-01', 150), e('2026-02-02', 10), e('2026-02-03', 150), e('2026-02-04', 150)];
    expect(bestStreak(entries, 150)).toBe(3);
  });
  it('adds entries within a day and handles empties', () => {
    expect(bestStreak([e('2026-01-01', 80), e('2026-01-01', 70)], 150)).toBe(1);
    expect(bestStreak([], 150)).toBe(0);
    expect(bestStreak([e('2026-01-01', 80)], 0)).toBe(0);
  });
});

describe('goalHitDays / averages', () => {
  const entries = [e('2026-01-01', 150, 2000), e('2026-01-02', 100, 1000), e('2026-01-04', 200, 3000)];
  const days = lastDays('2026-01-04', 4);
  it('counts met days in range', () => {
    expect(goalHitDays(entries, 150, days)).toBe(2);
    expect(goalHitDays(entries, 150, ['2026-01-02', '2026-01-03'])).toBe(0);
  });
  it('averages over logged days only', () => {
    expect(averages(entries, days)).toEqual({ loggedDays: 3, avgProteinG: 150, avgCalories: 2000 });
    expect(averages(entries, ['2026-01-03'])).toEqual({ loggedDays: 0, avgProteinG: null, avgCalories: null });
  });
});

describe('creatineConsistency', () => {
  it('flags days and rounds the percent', () => {
    const logs = [{ day: '2026-01-01', doseG: 5, takenAt: '' }, { day: '2026-01-03', doseG: 5, takenAt: '' }];
    expect(creatineConsistency(logs, ['2026-01-01', '2026-01-02', '2026-01-03'])).toEqual({ taken: [true, false, true], takenDays: 2, percent: 67 });
    expect(creatineConsistency([], [])).toEqual({ taken: [], takenDays: 0, percent: 0 });
  });
});

describe('weightSeries', () => {
  it('filters and sorts', () => {
    const logs = [{ day: '2026-01-05', weightKg: 80 }, { day: '2026-01-01', weightKg: 81 }, { day: '2025-01-01', weightKg: 90 }];
    expect(weightSeries(logs, '2026-01-01', '2026-01-31').map((w) => w.weightKg)).toEqual([81, 80]);
  });
});
