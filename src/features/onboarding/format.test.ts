import { HALF_HOUR_TIMES, formatNumber, formatTime, nearest, range } from './format';

describe('onboarding format helpers', () => {
  it('formats numbers with thousands separators', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(950)).toBe('950');
    expect(formatNumber(1234567.4)).toBe('1,234,567');
    expect(formatNumber(Number.NaN)).toBe('0');
  });

  it('formats 24h times as 12h', () => {
    expect(formatTime('08:00')).toBe('8:00 AM');
    expect(formatTime('00:30')).toBe('12:30 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('19:30')).toBe('7:30 PM');
  });

  it('lists every half hour', () => {
    expect(HALF_HOUR_TIMES).toHaveLength(48);
    expect(HALF_HOUR_TIMES[0]).toBe('00:00');
    expect(HALF_HOUR_TIMES[17]).toBe('08:30');
    expect(HALF_HOUR_TIMES[47]).toBe('23:30');
  });

  it('builds clean ranges', () => {
    expect(range(0.1, 0.5, 0.1)).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(range(0.25, 1, 0.25)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(range(1, 3, 1)).toEqual([1, 2, 3]);
    expect(range(5, 4, 1)).toEqual([]);
  });

  it('finds the nearest value', () => {
    expect(nearest([0.1, 0.2, 0.3], 0.26)).toBe(0.3);
    expect(nearest([], 4)).toBe(4);
  });
});
