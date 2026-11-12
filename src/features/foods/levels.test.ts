import { formatRange, needsCheck, overallLevel, totalProteinRange } from './levels';

describe('levels', () => {
  it('takes the weakest level', () => {
    expect(overallLevel([{ reliability: 'verified' }, { reliability: 'estimate' }, {}])).toBe('estimate');
    expect(overallLevel([{ reliability: 'verified' }, { reliability: 'label' }])).toBe('label');
    expect(overallLevel([{}])).toBeNull();
    expect(needsCheck('estimate')).toBe(true);
    expect(needsCheck('verified')).toBe(false);
  });
  it('adds ranges scaled by servings, only when something is uncertain', () => {
    expect(totalProteinRange([{ proteinG: 46, proteinRange: { lowG: 37, highG: 56 }, servings: 1 }, { proteinG: 24, servings: 2 }])).toEqual({ lowG: 85, highG: 104 });
    expect(totalProteinRange([{ proteinG: 24, proteinRange: { lowG: 24, highG: 24 }, servings: 1 }])).toBeNull();
    expect(formatRange({ lowG: 37.2, highG: 55.8 })).toBe('37–56 g');
  });
});
