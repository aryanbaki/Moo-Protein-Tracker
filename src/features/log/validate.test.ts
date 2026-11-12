import { cleanAmount, cleanName, cleanNewEntry, cleanPatch, isValidDay, LogValidationError, MAX_NAME_LENGTH } from './validate';

const base = { name: 'Eggs', proteinG: 18, calories: 210, carbsG: 1, fatG: 15, source: 'manual' as const };

describe('cleanAmount', () => {
  it('rounds to one decimal', () => {
    expect(cleanAmount(12.34, 'x')).toBe(12.3);
    expect(cleanAmount(0, 'x')).toBe(0);
  });
  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, '5', null, undefined])('rejects %p', (v) => {
    expect(() => cleanAmount(v, 'proteinG')).toThrow(LogValidationError);
  });
});

describe('cleanName', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanName('  Greek   yogurt \n', 'manual')).toBe('Greek yogurt');
  });
  it('falls back by source when empty', () => {
    expect(cleanName('   ', 'quick')).toBe('Quick add');
    expect(cleanName(undefined, 'manual')).toBe('Food');
    expect(cleanName('', 'photo')).toBe('Scanned food');
  });
  it('caps the length', () => {
    expect(cleanName('a'.repeat(500), 'manual')).toHaveLength(MAX_NAME_LENGTH);
  });
});

describe('isValidDay', () => {
  it('accepts real days only', () => {
    expect(isValidDay('2026-02-28')).toBe(true);
    expect(isValidDay('2028-02-29')).toBe(true);
    expect(isValidDay('2026-02-30')).toBe(false);
    expect(isValidDay('2026-13-01')).toBe(false);
    expect(isValidDay('2026-3-1')).toBe(false);
    expect(isValidDay(20260301)).toBe(false);
  });
});

describe('cleanNewEntry', () => {
  it('normalises a good entry and leaves day unset when not given', () => {
    expect(cleanNewEntry({ ...base, name: ' Eggs ', proteinG: 18.04 })).toEqual({ ...base, proteinG: 18 });
  });
  it('keeps an explicit day', () => {
    expect(cleanNewEntry({ ...base, day: '2026-03-10' }).day).toBe('2026-03-10');
  });
  it('rejects bad numbers, days and sources', () => {
    expect(() => cleanNewEntry({ ...base, proteinG: -5 })).toThrow(/negative/);
    expect(() => cleanNewEntry({ ...base, calories: Number.NaN })).toThrow(LogValidationError);
    expect(() => cleanNewEntry({ ...base, day: 'yesterday' })).toThrow(LogValidationError);
    expect(() => cleanNewEntry({ ...base, source: 'magic' as never })).toThrow(LogValidationError);
  });
  it('reports which field failed', () => {
    try {
      cleanNewEntry({ ...base, fatG: -1 });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as LogValidationError).field).toBe('fatG');
    }
  });
});

describe('cleanPatch', () => {
  it('only touches fields that are present', () => {
    expect(cleanPatch({ proteinG: 20.26 }, 'manual')).toEqual({ proteinG: 20.3 });
  });
  it('uses the existing source for the name fallback', () => {
    expect(cleanPatch({ name: ' ' }, 'quick')).toEqual({ name: 'Quick add' });
  });
  it('rejects bad values', () => {
    expect(() => cleanPatch({ carbsG: -1 }, 'manual')).toThrow(LogValidationError);
  });
});
