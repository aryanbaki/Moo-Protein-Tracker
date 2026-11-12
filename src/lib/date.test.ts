import { addDays, localDay, weekDays } from './date';

test('localDay formats local date', () => {
  expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
});
test('addDays crosses months', () => {
  expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
});
test('weekDays starts on Monday by default', () => {
  expect(weekDays('2026-11-12')).toEqual(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15']);
});
