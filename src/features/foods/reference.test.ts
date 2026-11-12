import { energyCheck } from './verify';
import { matchReference, REFERENCE_FOODS } from './reference';

const key = (q: string, c: Parameters<typeof matchReference>[1] = 'unknown') => matchReference(q, c)?.food.key ?? null;

describe('bundled USDA reference table', () => {
  it('has unique keys and FDC ids, sane numbers and self-consistent energy', () => {
    expect(new Set(REFERENCE_FOODS.map((f) => f.key)).size).toBe(REFERENCE_FOODS.length);
    expect(new Set(REFERENCE_FOODS.map((f) => f.fdcId)).size).toBe(REFERENCE_FOODS.length);
    for (const f of REFERENCE_FOODS) {
      const m = f.per100g;
      expect(m.proteinG + m.carbsG + m.fatG).toBeLessThanOrEqual(100);
      // USDA SR values use specific Atwater factors; they must still pass the generic check.
      expect([f.key, energyCheck(m, 0)]).not.toEqual([f.key, 'fail']);
      if (f.cookedYield) expect(f.cookedYield).toBeGreaterThan(0.5);
      expect(f.typicalPortion!.grams).toBeGreaterThan(0);
    }
  });

  it('matches what a photo analyser would call things', () => {
    expect(key('chicken breast grilled')).toBe('chicken-breast-roasted');
    expect(key('Grilled chicken breasts')).toBe('chicken-breast-roasted');
    expect(key('chicken thigh roasted')).toBe('chicken-thigh-roasted');
    expect(key('egg scrambled')).toBe('egg-scrambled');
    expect(key('eggs hard-boiled')).toBe('egg-hard-boiled');
    expect(key('fried egg')).toBe('egg-hard-boiled');
    expect(key('egg whites')).toBe('egg-white-raw');
    expect(key('salmon atlantic cooked')).toBe('salmon-atlantic-farmed-cooked');
    expect(key('wild sockeye salmon baked')).toBe('salmon-sockeye-cooked');
    expect(key('greek yogurt plain nonfat')).toBe('greek-yogurt-nonfat');
    expect(key('low fat greek yogurt')).toBe('greek-yogurt-lowfat');
    expect(key('rice white cooked')).toBe('rice-white-cooked');
    expect(key('lean ground beef')).toBe('ground-beef-90-browned');
    expect(key('ground beef')).toBe('ground-beef-85-browned');
    expect(key('whole wheat bread')).toBe('bread-whole-wheat');
    expect(key('skim milk')).toBe('milk-skim');
    expect(key('black beans')).toBe('black-beans-boiled');
    expect(key('canned tuna in water')).toBe('tuna-light-canned-water');
  });

  it('refuses look-alikes', () => {
    expect(key('almond milk')).toBeNull();
    expect(key('oat milk')).toBeNull();
    expect(key('chicken nuggets')).toBeNull();
    expect(key('breaded chicken breast')).toBeNull();
    expect(key('egg noodles')).toBeNull();
    expect(key('fried rice')).toBeNull();
    expect(key('french fries potato')).toBeNull();
    expect(key('tuna steak seared')).toBeNull();
    expect(key('steak')).toBeNull();
    expect(key('chicken')).toBeNull();
    expect(key('greek yogurt peach')).toBe('greek-yogurt-nonfat');
  });

  it('converts raw weights with the derived yield', () => {
    const raw = matchReference('raw chicken breast', 'raw')!;
    expect(raw.converted).toBe(true);
    expect(raw.per100g.proteinG).toBe(22.5); // 31.02 × 0.725: USDA lists raw breast at 22.5 g
    const dryLentils = matchReference('lentils', 'raw')!;
    expect(dryLentils.per100g.proteinG).toBe(24.6); // 9.02 × 2.731 ≈ USDA raw lentils 24.63 g
  });
});
