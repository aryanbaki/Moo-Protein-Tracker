import { buildExport, exportFileName, parseNumber } from './export';

const entry = (id: string, day: string, createdAt: string) => ({
  id, day, name: 'hay', proteinG: 10, calories: 50, carbsG: 1, fatG: 1, source: 'manual' as const, createdAt, updatedAt: createdAt, deletedAt: null,
});

describe('buildExport', () => {
  const input = {
    profile: { answers: { weightKg: 80 }, goals: { proteinG: 150, calories: 2400, carbsG: 280, fatG: 70 }, units: 'imperial' as const, creatine: { enabled: true, doseG: 5, reminderTime: '09:00' }, mealReminders: false },
    entries: [entry('b', '2026-01-02', '2026-01-02T09:00:00Z'), entry('c', '2026-01-01', '2026-01-01T12:00:00Z'), entry('a', '2026-01-01', '2026-01-01T08:00:00Z')],
    creatineLogs: [{ day: '2026-01-02', doseG: 5, takenAt: 'x' }, { day: '2026-01-01', doseG: 5, takenAt: 'y' }],
    weightLogs: [{ day: '2026-01-03', weightKg: 80 }, { day: '2026-01-01', weightKg: 81 }],
  };
  it('stamps and sorts oldest first without mutating the input', () => {
    const out = buildExport(input, new Date('2026-02-03T04:05:06Z'));
    expect(out.app).toBe('Moo');
    expect(out.exportedAt).toBe('2026-02-03T04:05:06.000Z');
    expect(out.entries.map((e) => e.id)).toEqual(['a', 'c', 'b']);
    expect(out.creatineLogs.map((l) => l.day)).toEqual(['2026-01-01', '2026-01-02']);
    expect(out.weightLogs.map((l) => l.day)).toEqual(['2026-01-01', '2026-01-03']);
    expect(input.entries.map((e) => e.id)).toEqual(['b', 'c', 'a']);
    expect(JSON.parse(JSON.stringify(out)).profile.goals.proteinG).toBe(150);
  });
  it('names the file by date', () => {
    expect(exportFileName(new Date('2026-02-03T04:05:06Z'))).toBe('moo-export-2026-02-03.json');
  });
});

describe('parseNumber', () => {
  it('accepts dot and comma decimals', () => {
    expect(parseNumber(' 82.5 ')).toBe(82.5);
    expect(parseNumber('82,5')).toBe(82.5);
    expect(parseNumber('150')).toBe(150);
  });
  it('rejects junk', () => {
    for (const t of ['', 'abc', '-5', '1e3', '1.2.3', '.5']) expect(parseNumber(t)).toBeNull();
  });
});
