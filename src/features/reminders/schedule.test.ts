import { buildSchedule, formatTime12, parseTime, REMINDER_PREFIX, shiftTime } from './schedule';

describe('parseTime', () => {
  it('parses HH:mm', () => {
    expect(parseTime('09:00')).toEqual({ hour: 9, minute: 0 });
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseTime('7:05')).toEqual({ hour: 7, minute: 5 });
  });
  it('rejects junk', () => {
    for (const v of [null, undefined, '', '24:00', '12:60', '9', 'ab:cd', '09:0', '-1:00']) expect(parseTime(v)).toBeNull();
  });
});

describe('formatTime12 / shiftTime', () => {
  it('formats', () => {
    expect(formatTime12('00:05')).toBe('12:05 AM');
    expect(formatTime12('12:00')).toBe('12:00 PM');
    expect(formatTime12('19:30')).toBe('7:30 PM');
    expect(formatTime12(null)).toBe('No reminder');
  });
  it('shifts with wrap', () => {
    expect(shiftTime('23:45', 30)).toBe('00:15');
    expect(shiftTime('00:00', -60)).toBe('23:00');
    expect(shiftTime('09:00', 5)).toBe('09:05');
  });
});

describe('buildSchedule', () => {
  const on = { enabled: true, doseG: 5, reminderTime: '09:00' };
  it('is empty when everything is off', () => {
    expect(buildSchedule({ creatine: { ...on, enabled: false }, mealReminders: false })).toEqual([]);
    expect(buildSchedule({ creatine: { ...on, reminderTime: null }, mealReminders: false })).toEqual([]);
    expect(buildSchedule({ creatine: { ...on, reminderTime: 'nope' }, mealReminders: false })).toEqual([]);
  });
  it('schedules creatine at its time with the dose', () => {
    const [r, ...rest] = buildSchedule({ creatine: { ...on, doseG: 3.5, reminderTime: '21:15' }, mealReminders: false });
    expect(rest).toHaveLength(0);
    expect(r).toMatchObject({ hour: 21, minute: 15 });
    expect(r.body).toContain('3.5 g');
    expect(r.title).toMatch(/creatine/i);
  });
  it('adds two meal nudges at 13:00 and 19:30', () => {
    const list = buildSchedule({ creatine: { ...on, enabled: false }, mealReminders: true });
    expect(list.map((r) => [r.hour, r.minute])).toEqual([[13, 0], [19, 30]]);
    expect(list.map((r) => r.title)).toEqual(['Protein check', 'Protein check']);
  });
  it('keeps every notification to four words or fewer, with no exclamation marks', () => {
    for (const r of buildSchedule({ creatine: on, mealReminders: true })) {
      for (const text of [r.title, r.body]) {
        expect(text.trim().split(/\s+/).length).toBeLessThanOrEqual(4);
        expect(text).not.toMatch(/!/);
      }
    }
    expect(buildSchedule({ creatine: on, mealReminders: false })[0]).toMatchObject({ title: 'Creatine time', body: '5 g' });
  });
  it('uses unique prefixed ids', () => {
    const list = buildSchedule({ creatine: on, mealReminders: true });
    expect(list).toHaveLength(3);
    expect(new Set(list.map((r) => r.id)).size).toBe(3);
    expect(list.every((r) => r.id.startsWith(REMINDER_PREFIX))).toBe(true);
  });
});
