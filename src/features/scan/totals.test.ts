import type { ScannedItem } from '../../types';
import { fitWithin, codeFromFailure } from './analyze';
import { hashSeed, mockItems } from './mock';
import { entryFromItems, formatServings, lowestConfidence, stepServings, toEditable, totalsOf } from './totals';

jest.mock('../../lib/supabase', () => ({ getSupabase: () => null }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }));

const items: ScannedItem[] = [
  { name: 'Chicken', portion: '150 g', proteinG: 46, calories: 248, carbsG: 0, fatG: 5.4, confidence: 0.8 },
  { name: 'Rice', portion: '1 cup', proteinG: 4.3, calories: 205, carbsG: 44.5, fatG: 0.4, confidence: 0.4 },
];

describe('servings', () => {
  it('steps in halves within 0.5–5', () => {
    expect(stepServings(1, 1)).toBe(1.5);
    expect(stepServings(1, -1)).toBe(0.5);
    expect(stepServings(0.5, -1)).toBe(0.5);
    expect(stepServings(5, 1)).toBe(5);
    expect(stepServings(4.5, 1)).toBe(5);
  });
  it('formats', () => {
    expect(formatServings(1)).toBe('1×');
    expect(formatServings(1.5)).toBe('1.5×');
  });
});

describe('totals', () => {
  it('scales by servings', () => {
    const e = toEditable(items);
    e[0]!.servings = 2;
    e[1]!.servings = 0.5;
    const t = totalsOf(e);
    expect(t.proteinG).toBeCloseTo(94.15);
    expect(t.calories).toBeCloseTo(598.5);
    expect(t.carbsG).toBeCloseTo(22.25);
    expect(t.fatG).toBeCloseTo(11);
  });
  it('builds one rounded entry with joined names', () => {
    const e = toEditable(items);
    e[0]!.servings = 2;
    expect(entryFromItems(e, 'photo')).toEqual({ name: 'Chicken, Rice', proteinG: 96, calories: 701, carbsG: 45, fatG: 11, source: 'photo' });
    expect(entryFromItems([], 'barcode')).toMatchObject({ name: 'Scanned food', proteinG: 0, source: 'barcode' });
  });
  it('finds the weakest confidence', () => {
    expect(lowestConfidence(items)).toBe(0.4);
    expect(lowestConfidence([])).toBe(1);
  });
});

describe('mock analyser', () => {
  it('is deterministic and plausible', () => {
    expect(mockItems('12345')).toEqual(mockItems('12345'));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      for (const i of mockItems(seed)) {
        expect(i.proteinG * 4 + i.carbsG * 4 + i.fatG * 9).toBeGreaterThan(i.calories * 0.75);
        expect(i.proteinG * 4 + i.carbsG * 4 + i.fatG * 9).toBeLessThan(i.calories * 1.25);
      }
    }
  });
});

describe('analyze helpers', () => {
  it('fits the longest edge to 1024', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1024, height: 768 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 768, height: 1024 });
    expect(fitWithin(800, 600)).toBeNull();
    expect(fitWithin(0, 0)).toBeNull();
  });
  it('maps failures to typed codes', () => {
    expect(codeFromFailure(402, { error: 'limit' })).toBe('limit');
    expect(codeFromFailure(402, null)).toBe('limit');
    expect(codeFromFailure(401, { error: 'unauthorized' })).toBe('unauthorized');
    expect(codeFromFailure(422, { error: 'no_food' })).toBe('no_food');
    expect(codeFromFailure(500, { error: 'server' })).toBe('server');
    expect(codeFromFailure(null, null)).toBe('offline');
  });
});
