import type { FoodItem, Macros } from './types';
import { calorieTolerance, checkAll, compare, crossCheck, energyCheck, energyConsistent, internalChecks, massPossible, proteinTolerance, selfCheck, within } from './verify';

function food(over: Partial<FoodItem> & { per100g: Macros | null }): FoodItem {
  return { id: 'x', provider: 'usda', name: 'Bar', brand: null, barcode: null, quality: 'label', serving: null, ...over };
}
// 4·35 + 4·38 + 9·13 = 409 computed vs 317 declared: fibre and polyols carry fewer kcal than 4/g.
const bar: Macros = { proteinG: 35, calories: 317, carbsG: 38, fatG: 13 };

describe('within', () => {
  it('uses the larger of absolute and relative slack', () => {
    expect(within(31, 30, 2, 0.2)).toBe(true);
    expect(within(10, 12.5, 2, 0.2)).toBe(true); // 20% of 12.5 = 2.5
    expect(within(10, 13, 2, 0.2)).toBe(false); // 20% of 13 = 2.6 < 3
    expect(within(10, 14, 2, 0.2)).toBe(false);
    expect(within(0.5, 2, 2, 0.2)).toBe(true);
  });
});

describe('internal checks', () => {
  it('passes consistent records', () => {
    expect(energyConsistent({ proteinG: 31, calories: 165, carbsG: 0, fatG: 3.6 })).toBe(true); // 156 computed
    expect(massPossible({ proteinG: 31, calories: 165, carbsG: 0, fatG: 3.6 })).toBe(true);
  });
  it('flags kJ typed as kcal and impossible mass', () => {
    // 690 "kcal" for chicken is really kJ.
    expect(internalChecks(food({ per100g: { proteinG: 31, calories: 690, carbsG: 0, fatG: 3.6 } }))).toEqual(['energy_mismatch']);
    expect(internalChecks(food({ per100g: { proteinG: 80, calories: 400, carbsG: 30, fatG: 5 } }))).toContain('impossible_values');
    // Protein alone would supply more energy than declared.
    expect(massPossible({ proteinG: 30, calories: 60, carbsG: 0, fatG: 0 })).toBe(false);
    expect(massPossible({ proteinG: 10, calories: 950, carbsG: 0, fatG: 99 })).toBe(false);
  });
  it('lets fibre-heavy bars through (polyols and fibre count less than 4 kcal/g)', () => {
    expect(energyConsistent(bar)).toBe(true);
  });
});

describe('compare', () => {
  it('detects per-serving numbers stored as per-100 g', () => {
    const a = food({ provider: 'usda', per100g: { proteinG: 35, calories: 317, carbsG: 38, fatG: 13 }, serving: { label: '1 bar (60 g)', grams: 60, macros: { proteinG: 21, calories: 190, carbsG: 23, fatG: 8 } } });
    const b = food({ provider: 'openfoodfacts', quality: 'community', per100g: { proteinG: 21, calories: 190, carbsG: 23, fatG: 8 } });
    expect(compare(a, b)).toEqual({ protein: false, calories: false, reason: 'basis_mismatch', basisMismatch: true });
  });
  it('names kJ stored as kcal and decimal slips', () => {
    const a = food({ per100g: { proteinG: 31, calories: 165, carbsG: 0, fatG: 3.6 } });
    expect(compare(a, food({ provider: 'openfoodfacts', per100g: { proteinG: 31, calories: 690, carbsG: 0, fatG: 3.6 } }))!.reason).toBe('kj_as_kcal');
    expect(compare(a, food({ provider: 'openfoodfacts', per100g: { proteinG: 3.1, calories: 16.5, carbsG: 0, fatG: 0.36 } }))!.reason).toBe('decimal_shift');
  });
});

describe('researched tolerances', () => {
  it('protein: 2 g band below 10 g, 20% to 40 g, capped at 8 g, plus serving rounding', () => {
    expect(proteinTolerance(5, null)).toBe(2.5);
    expect(proteinTolerance(31, null)).toBeCloseTo(6.7);
    expect(proteinTolerance(80, null)).toBe(8.5); // not 16 g as a flat 20% would allow
    expect(proteinTolerance(80, 30)).toBeCloseTo(9.67); // ±0.5 g per 30 g serving = ±1.67 g per 100 g
    expect(proteinTolerance(80, 5)).toBe(13); // rounding allowance capped at 5 g
  });
  it('an 80 g/100 g powder 10 g apart disagrees', () => {
    const a = food({ per100g: { proteinG: 80, calories: 380, carbsG: 8, fatG: 5 } });
    const b = food({ provider: 'openfoodfacts', per100g: { proteinG: 70, calories: 380, carbsG: 8, fatG: 5 } });
    expect(compare(a, b)!.protein).toBe(false);
  });
  it('calories: 20 kcal / 20% plus rounding and fibre', () => {
    expect(calorieTolerance(100, null, 0)).toBe(21);
    expect(calorieTolerance(400, 40, 10)).toBeCloseTo(80 + 12.5 + 20);
  });
  it('energy check passes within 15%, warns to 30%, fails beyond (Open Food Facts thresholds)', () => {
    expect(energyCheck({ proteinG: 31, calories: 165, carbsG: 0, fatG: 3.6 })).toBe('pass');
    expect(energyCheck({ proteinG: 31, calories: 200, carbsG: 0, fatG: 3.6 })).toBe('warn');
    expect(energyCheck({ proteinG: 31, calories: 690, carbsG: 0, fatG: 3.6 })).toBe('fail');
    expect(energyCheck({ proteinG: 0.5, calories: 2, carbsG: 1, fatG: 0 })).toBe('pass'); // too small to judge
    // Fibre at 0–4 kcal/g: a high-fibre bar passes once fibre is known.
    expect(energyCheck(bar)).toBe('warn');
    expect(energyCheck(bar, 20)).toBe('pass');
  });
  it('flags per-serving numbers that contradict per-100 g ones', () => {
    const f = food({ per100g: { proteinG: 35, calories: 317, carbsG: 38, fatG: 13 }, serving: { label: '1 bar (60 g)', grams: 60, macros: { proteinG: 12, calories: 190, carbsG: 23, fatG: 8 } } });
    expect(internalChecks(f)).toContain('serving_mismatch');
  });
  it('warnings do not demote; errors do', () => {
    expect(selfCheck(food({ per100g: { proteinG: 31, calories: 200, carbsG: 0, fatG: 3.6 } })).reliability!.level).toBe('label');
    expect(selfCheck(food({ per100g: { proteinG: 31, calories: 690, carbsG: 0, fatG: 3.6 } })).reliability!.level).toBe('reference');
  });
});

describe('crossCheck', () => {
  const usda = food({ id: 'usda:1', provider: 'usda', quality: 'label', per100g: { proteinG: 77.4, calories: 387, carbsG: 9.7, fatG: 4.8 } });
  const off = food({ id: 'off:1', provider: 'openfoodfacts', quality: 'community', per100g: { proteinG: 79, calories: 395, carbsG: 7, fatG: 5 } });

  it('marks agreeing independent sources verified and keeps the label record', () => {
    const r = crossCheck([off, usda])!;
    expect(r.id).toBe('usda:1');
    expect(r.reliability).toMatchObject({ level: 'verified', sources: ['usda', 'openfoodfacts'], checks: ['sources_agree'] });
    expect(r.reliability!.proteinBySource).toEqual([
      { provider: 'usda', proteinPer100g: 77.4 },
      { provider: 'openfoodfacts', proteinPer100g: 79 },
    ]);
  });

  it('does not count a copy of USDA as confirmation', () => {
    const r = crossCheck([usda, { ...off, derivedFrom: ['usda'] }])!;
    expect(r.reliability!.level).toBe('label');
    expect(r.reliability!.checks).toContain('not_independent');
  });

  it('flags disagreement and keeps the more trustworthy record', () => {
    const r = crossCheck([{ ...off, per100g: { proteinG: 50, calories: 390, carbsG: 30, fatG: 5 } }, usda])!;
    expect(r.id).toBe('usda:1');
    expect(r.reliability).toMatchObject({ level: 'label', checks: ['sources_disagree'] });
  });

  it('prefers a self-consistent community record over a broken label record, demoted', () => {
    const broken = { ...usda, per100g: { proteinG: 77.4, calories: 1620, carbsG: 9.7, fatG: 4.8 } };
    const r = crossCheck([broken, off])!;
    expect(r.id).toBe('off:1');
    expect(r.reliability!.level).toBe('community');
    expect(r.reliability!.checks).toContain('sources_disagree');
  });

  it('handles one source and nothing', () => {
    expect(crossCheck([usda])!.reliability).toMatchObject({ level: 'label', checks: ['single_source'] });
    expect(crossCheck([])).toBeNull();
    expect(crossCheck([food({ per100g: null })])).toBeNull();
  });

  it('demotes a lone inconsistent record', () => {
    expect(selfCheck({ ...usda, per100g: { proteinG: 31, calories: 690, carbsG: 0, fatG: 3.6 } }).reliability).toMatchObject({ level: 'reference', checks: ['energy_mismatch', 'single_source'] });
  });
});

describe('checkAll', () => {
  it('merges records that share a barcode (leading zeros ignored) and self-checks the rest', () => {
    const a = food({ id: 'usda:1', barcode: '748927028669', per100g: { proteinG: 77.4, calories: 387, carbsG: 9.7, fatG: 4.8 } });
    const b = food({ id: 'off:1', provider: 'openfoodfacts', quality: 'community', barcode: '0748927028669', per100g: { proteinG: 79, calories: 395, carbsG: 7, fatG: 5 } });
    const c = food({ id: 'usda:2', quality: 'reference', per100g: { proteinG: 31, calories: 165, carbsG: 0, fatG: 3.6 } });
    const out = checkAll([a, c, b]);
    expect(out.map((f) => [f.id, f.reliability!.level])).toEqual([
      ['usda:1', 'verified'],
      ['usda:2', 'reference'],
    ]);
  });
});

describe('verification-only sources (FatSecret)', () => {
  const fs = food({ id: 'fatsecret:1', provider: 'fatsecret', quality: 'label', per100g: { proteinG: 78, calories: 390, carbsG: 9, fatG: 5 } });
  const off = food({ id: 'off:1', provider: 'openfoodfacts', quality: 'community', per100g: { proteinG: 79, calories: 395, carbsG: 7, fatG: 5 } });
  it('confirms but never becomes the shown record', () => {
    const r = crossCheck([fs, off])!;
    expect(r.id).toBe('off:1');
    expect(r.reliability).toMatchObject({ level: 'verified', sources: ['openfoodfacts', 'fatsecret'] });
  });
  it('cannot answer alone', () => {
    expect(crossCheck([fs])).toBeNull();
  });
});
