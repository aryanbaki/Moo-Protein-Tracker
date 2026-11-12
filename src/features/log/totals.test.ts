import type { FoodEntry } from '../../types';
import { bestStreak, currentStreak, dayTotalsMap, goalHitDays, totalsForDay, totalsForDays, totalsForRange } from './totals';

let n = 0;
function entry(day: string, proteinG: number, extra: Partial<FoodEntry> = {}): FoodEntry {
  n += 1;
  return {
    id: `e${n}`,
    day,
    name: 'Food',
    proteinG,
    calories: proteinG * 10,
    carbsG: 1,
    fatG: 2,
    source: 'manual',
    createdAt: `${day}T10:00:00.000Z`,
    updatedAt: `${day}T10:00:00.000Z`,
    deletedAt: null,
    ...extra,
  };
}

describe('totalsForDay', () => {
  it('sums only that day and ignores soft-deleted entries', () => {
    const entries = [entry('2026-03-10', 30), entry('2026-03-10', 20.5), entry('2026-03-11', 99), entry('2026-03-10', 50, { deletedAt: 'x' })];
    expect(totalsForDay(entries, '2026-03-10')).toEqual({ day: '2026-03-10', proteinG: 50.5, calories: 505, carbsG: 2, fatG: 4, entryCount: 2 });
  });

  it('returns zeros for an empty day', () => {
    expect(totalsForDay([], '2026-03-10')).toEqual({ day: '2026-03-10', proteinG: 0, calories: 0, carbsG: 0, fatG: 0, entryCount: 0 });
  });

  it('uses the stored day, not the timestamp (day boundary)', () => {
    // Logged at 23:30 local on the 10th; in UTC that is already the 11th.
    const late = entry('2026-03-10', 40, { createdAt: '2026-03-11T04:30:00.000Z' });
    expect(totalsForDay([late], '2026-03-10').proteinG).toBe(40);
    expect(totalsForDay([late], '2026-03-11').proteinG).toBe(0);
  });
});

describe('range helpers', () => {
  const entries = [entry('2026-02-28', 10), entry('2026-03-01', 20), entry('2026-03-02', 30), entry('2026-03-03', 40, { deletedAt: 'x' })];

  it('totalsForRange is inclusive and crosses a month boundary', () => {
    const t = totalsForRange(entries, '2026-02-28', '2026-03-02');
    expect(t.proteinG).toBe(60);
    expect(t.entryCount).toBe(3);
    expect(totalsForRange(entries, '2026-03-01', '2026-03-03').proteinG).toBe(50);
  });

  it('totalsForDays keeps order and fills gaps with zeros', () => {
    expect(totalsForDays(entries, ['2026-03-02', '2026-03-05', '2026-02-28']).map((t) => t.proteinG)).toEqual([30, 0, 10]);
  });

  it('dayTotalsMap skips days with only deleted entries', () => {
    expect([...dayTotalsMap(entries).keys()].sort()).toEqual(['2026-02-28', '2026-03-01', '2026-03-02']);
  });

  it('goalHitDays counts days at or above the goal', () => {
    expect(goalHitDays(entries, 20, ['2026-02-28', '2026-03-01', '2026-03-02', '2026-03-03'])).toBe(2);
    expect(goalHitDays(entries, 0, ['2026-03-01'])).toBe(0);
  });
});

describe('currentStreak', () => {
  const today = '2026-03-10';

  it('is 0 with no entries or no goal', () => {
    expect(currentStreak([], 100, today)).toBe(0);
    expect(currentStreak([entry(today, 500)], 0, today)).toBe(0);
    expect(currentStreak([entry(today, 500)], Number.NaN, today)).toBe(0);
  });

  it('counts today once the goal is met', () => {
    expect(currentStreak([entry(today, 60), entry(today, 40)], 100, today)).toBe(1);
  });

  it('does not break the streak while today is still in progress', () => {
    const entries = [entry('2026-03-08', 100), entry('2026-03-09', 120), entry(today, 30)];
    expect(currentStreak(entries, 100, today)).toBe(2);
  });

  it('adds today on top of earlier days when met', () => {
    const entries = [entry('2026-03-08', 100), entry('2026-03-09', 120), entry(today, 100)];
    expect(currentStreak(entries, 100, today)).toBe(3);
  });

  it('stops at a gap', () => {
    const entries = [entry('2026-03-06', 100), entry('2026-03-08', 100), entry('2026-03-09', 100)];
    expect(currentStreak(entries, 100, today)).toBe(2);
  });

  it('is 0 when yesterday was missed and today is not met', () => {
    expect(currentStreak([entry('2026-03-08', 100), entry(today, 10)], 100, today)).toBe(0);
  });

  it('ignores deleted entries', () => {
    expect(currentStreak([entry('2026-03-09', 100, { deletedAt: 'x' })], 100, today)).toBe(0);
  });

  it('walks back across month and year boundaries', () => {
    const entries = ['2025-12-30', '2025-12-31', '2026-01-01'].map((d) => entry(d, 150));
    expect(currentStreak(entries, 150, '2026-01-01')).toBe(3);
    expect(currentStreak(entries, 150, '2026-01-02')).toBe(3);
    expect(currentStreak(entries, 150, '2026-01-03')).toBe(0);
  });
});

describe('bestStreak', () => {
  it('finds the longest run, not the latest', () => {
    const days = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05', '2026-03-06'];
    const entries = [...days.map((d) => entry(d, 100)), entry('2026-03-04', 50)];
    expect(bestStreak(entries, 100)).toBe(3);
  });

  it('is 0 when the goal was never met', () => {
    expect(bestStreak([entry('2026-03-01', 10)], 100)).toBe(0);
    expect(bestStreak([], 100)).toBe(0);
  });
});
