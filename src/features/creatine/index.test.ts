import type { CreatineLog } from '../../types';
import { consistency, creatineStreak, formatDose, isTakenOn, isTakenToday, lastNDays } from './index';

const log = (day: string): CreatineLog => ({ day, doseG: 5, takenAt: `${day}T09:00:00.000Z` });
const today = '2026-03-10';

describe('isTakenToday', () => {
  it('is true only when today has a check-off', () => {
    expect(isTakenToday([log('2026-03-09')], today)).toBe(false);
    expect(isTakenToday([log('2026-03-09'), log(today)], today)).toBe(true);
    expect(isTakenToday([], today)).toBe(false);
    expect(isTakenOn([log('2026-03-09')], '2026-03-09')).toBe(true);
  });
});

describe('lastNDays', () => {
  it('ends today, oldest first, and crosses months', () => {
    expect(lastNDays(3, '2026-03-01')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
    expect(lastNDays(0, today)).toEqual([]);
    expect(lastNDays(-4, today)).toEqual([]);
  });
});

describe('consistency', () => {
  const logs = [log('2026-03-10'), log('2026-03-09'), log('2026-03-07'), log('2026-03-01')];

  it('counts check-offs inside the window', () => {
    expect(consistency(logs, 7, today)).toEqual({ taken: 3, days: 7, ratio: 3 / 7 });
    expect(consistency(logs, 30, today).taken).toBe(4);
  });

  it('does not count days before creatine was switched on', () => {
    expect(consistency(logs, 7, today, '2026-03-09')).toEqual({ taken: 2, days: 2, ratio: 1 });
  });

  it('handles empty input without dividing by zero', () => {
    expect(consistency([], 7, today)).toEqual({ taken: 0, days: 7, ratio: 0 });
    expect(consistency(logs, 0, today)).toEqual({ taken: 0, days: 0, ratio: 0 });
  });

  it('counts a day once even with duplicate logs', () => {
    expect(consistency([log(today), log(today)], 7, today).taken).toBe(1);
  });
});

describe('creatineStreak', () => {
  it('keeps yesterday’s streak alive until today is over', () => {
    expect(creatineStreak([log('2026-03-08'), log('2026-03-09')], today)).toBe(2);
    expect(creatineStreak([log('2026-03-08'), log('2026-03-09'), log(today)], today)).toBe(3);
  });
  it('breaks on a gap', () => {
    expect(creatineStreak([log('2026-03-07'), log('2026-03-09')], today)).toBe(1);
    expect(creatineStreak([log('2026-03-07')], today)).toBe(0);
  });
});

describe('formatDose', () => {
  it('drops needless decimals', () => {
    expect(formatDose(5)).toBe('5 g');
    expect(formatDose(3.5)).toBe('3.5 g');
  });
});
