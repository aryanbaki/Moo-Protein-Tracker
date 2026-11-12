import { dayLetter, dayName, dotState, emptyLine, formatNumber, formatTime, goalReachedLine, ratio, remainingLine } from './copy';

describe('home copy', () => {
  it('names days from the stored local day', () => {
    expect(dayName('2026-03-10')).toBe('Tuesday');
    expect(dayLetter('2026-03-15')).toBe('S');
  });

  it('goal line mentions the day and is stable', () => {
    expect(goalReachedLine('2026-03-10')).toBe('Fully loaded Tuesday!');
    for (let i = 9; i < 16; i += 1) {
      const day = `2026-03-${String(i).padStart(2, '0')}`;
      expect(goalReachedLine(day)).toContain(dayName(day));
    }
  });

  it('always has an empty-state line', () => {
    for (let i = 1; i <= 31; i += 1) expect(emptyLine(`2026-01-${String(i).padStart(2, '0')}`).length).toBeGreaterThan(5);
  });

  it('formats numbers', () => {
    expect(formatNumber(86.4)).toBe('86');
    expect(formatNumber(1050)).toBe('1,050');
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(Number.NaN)).toBe('0');
  });

  it('ratio never divides by zero and clamps', () => {
    expect(ratio(50, 0)).toBe(0);
    expect(ratio(50, null)).toBe(0);
    expect(ratio(50, 100)).toBe(0.5);
    expect(ratio(500, 100)).toBe(1);
    expect(ratio(-5, 100)).toBe(0);
  });

  it('remainingLine covers under, exact and over', () => {
    expect(remainingLine(86, 150)).toBe('64 g to go');
    expect(remainingLine(150, 150)).toMatch(/Goal met/);
    expect(remainingLine(162, 150)).toBe('Goal met, 12 g extra');
  });

  it('formats local time', () => {
    expect(formatTime(new Date(2026, 2, 10, 8, 5).toISOString())).toBe('8:05 AM');
    expect(formatTime(new Date(2026, 2, 10, 0, 30).toISOString())).toBe('12:30 AM');
    expect(formatTime(new Date(2026, 2, 10, 13, 0).toISOString())).toBe('1:00 PM');
    expect(formatTime('nope')).toBe('');
  });

  it('classifies week dots', () => {
    expect(dotState('2026-03-11', '2026-03-10', 0, 150)).toBe('future');
    expect(dotState('2026-03-10', '2026-03-10', 150, 150)).toBe('met');
    expect(dotState('2026-03-09', '2026-03-10', 40, 150)).toBe('partial');
    expect(dotState('2026-03-09', '2026-03-10', 0, 150)).toBe('empty');
    expect(dotState('2026-03-09', '2026-03-10', 40, null)).toBe('partial');
  });
});
