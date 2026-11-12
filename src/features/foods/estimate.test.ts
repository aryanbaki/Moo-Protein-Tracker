import type { CleanItem, PhotoHints } from '../scan/sanitize';
import { estimateItem, fromDensity, fromLabel, modelOnly, refineWithDatabases, type EstimateDeps } from './estimate';
import { matchReference, type ReferenceFood } from './reference';
import type { FoodItem } from './types';

const CHICKEN: ReferenceFood = {
  key: 'chicken-breast-roasted',
  name: 'Chicken breast, roasted',
  aliases: ['chicken breast', 'chicken breast fillet'],
  state: 'cooked',
  per100g: { proteinG: 31, calories: 165, carbsG: 0, fatG: 3.6 },
  fdcId: 171477,
  cookedYield: 0.75,
  typicalPortion: { label: '1 breast half', grams: 140 },
};
const TABLE = [CHICKEN];

function hints(over: Partial<PhotoHints> = {}): PhotoHints {
  return { kind: 'whole_food', grams: null, gramsLow: null, gramsHigh: null, cookState: 'unknown', brand: '', product: '', barcode: null, dbQuery: '', label: null, servings: null, ...over };
}
function item(over: Partial<CleanItem> = {}, h?: Partial<PhotoHints>): CleanItem {
  return { name: 'Grilled chicken breast', portion: '1 breast, about 150 g', proteinG: 45, calories: 250, carbsG: 0, fatG: 5, confidence: 0.8, ...(h ? { hints: hints(h) } : {}), ...over };
}
const WHEY: FoodItem = {
  id: 'usda:2101234',
  provider: 'usda',
  name: 'Gold Standard 100% Whey',
  brand: 'Optimum Nutrition',
  barcode: '748927028669',
  quality: 'label',
  per100g: { proteinG: 77.4, calories: 387, carbsG: 9.7, fatG: 4.8 },
  serving: { label: '1 scoop (31 g)', grams: 31, macros: { proteinG: 24, calories: 120, carbsG: 3, fatG: 1.5 } },
  reliability: { level: 'verified', sources: ['usda', 'openfoodfacts'], checks: ['sources_agree'] },
};

function deps(over: Partial<EstimateDeps> = {}): EstimateDeps {
  return {
    lookupBarcode: jest.fn(async () => ({ status: 'not_found' as const })),
    bestMatch: jest.fn(async () => null),
    reference: (q, c) => matchReference(q, c, TABLE),
    ...over,
  };
}

describe('matchReference', () => {
  it('needs every core word and converts raw/cooked with the yield', () => {
    expect(matchReference('chicken', 'unknown', TABLE)).toBeNull();
    expect(matchReference('chicken breast roasted', 'cooked', TABLE)!.per100g.proteinG).toBe(31);
    const raw = matchReference('raw chicken breasts', 'raw', TABLE)!;
    expect(raw.converted).toBe(true);
    expect(raw.per100g.proteinG).toBe(23.3); // 31 × 0.75
  });
});

describe('fromDensity', () => {
  it('computes protein from grams with a range, and agrees with the model', () => {
    const e = fromDensity(item({}, { grams: 150, gramsLow: 120, gramsHigh: 180 }), CHICKEN.per100g, 'reference_density', null)!;
    expect(e.proteinG).toBe(46.5);
    expect(e.proteinRange).toEqual({ lowG: 37.2, highG: 55.8 });
    expect(e.notes).toEqual(['model_agrees']);
    expect(e.reliability).toBe('estimate');
  });
  it('widens the range to the model guess when they disagree, and lowers confidence', () => {
    const agree = fromDensity(item({}, { grams: 150, gramsLow: 120, gramsHigh: 180 }), CHICKEN.per100g, 'reference_density', null)!;
    const e = fromDensity(item({ proteinG: 15 }, { grams: 150, gramsLow: 120, gramsHigh: 180 }), CHICKEN.per100g, 'reference_density', null)!;
    expect(e.notes).toEqual(['model_disagrees']);
    expect(e.proteinRange.lowG).toBe(15);
    expect(e.confidence).toBeLessThan(agree.confidence);
  });
  it('falls back to a typical portion and says so', () => {
    const e = fromDensity(item({}, {}), CHICKEN.per100g, 'reference_density', { food: CHICKEN, per100g: CHICKEN.per100g, converted: false })!;
    expect(e.proteinG).toBe(43.4);
    expect(e.notes).toContain('typical_portion');
    expect(fromDensity(item({}, {}), CHICKEN.per100g, 'database_density', null)).toBeNull();
  });
});

describe('fromLabel', () => {
  const label = { servingText: '1 scoop (31 g)', servingSizeG: 31, proteinG: 24, calories: 120, carbsG: 3, fatG: 1.5 };
  it('uses the label × servings with a rounding range', () => {
    const e = fromLabel(item({ name: 'Protein shake' }, { kind: 'packaged', label, servings: 2, brand: 'Optimum Nutrition', product: 'Gold Standard Whey' }), null)!;
    expect(e).toMatchObject({ name: 'Optimum Nutrition Gold Standard Whey', portion: '2 × 1 scoop (31 g)', proteinG: 48, calories: 240, reliability: 'label_photo', basis: 'label_photo' });
    expect(e.proteinRange).toEqual({ lowG: 47, highG: 49 });
  });
  it('is verified when the database agrees, flagged when it does not', () => {
    expect(fromLabel(item({}, { kind: 'packaged', label }), WHEY)).toMatchObject({ reliability: 'verified', notes: ['label_matches_database'] });
    const off = fromLabel(item({}, { kind: 'packaged', label: { ...label, proteinG: 12 } }), WHEY)!;
    expect(off).toMatchObject({ reliability: 'label_photo', notes: ['label_differs_from_database'], proteinG: 12 });
  });
  it('ignores a label without protein', () => {
    expect(fromLabel(item({}, { kind: 'packaged', label: { ...label, proteinG: null } }), null)).toBeNull();
  });
});

describe('estimateItem routes', () => {
  it('1. barcode digits → database record × servings', async () => {
    const d = deps({ lookupBarcode: jest.fn(async () => ({ status: 'found' as const, food: WHEY })) });
    const e = await estimateItem(item({ name: 'Whey tub', proteinG: 20 }, { kind: 'packaged', barcode: '748927028669', servings: 1.5 }), d);
    expect(e).toMatchObject({ basis: 'barcode', reliability: 'verified', proteinG: 36, portion: '1.5 × 1 scoop (31 g)' });
  });

  it('2. a readable label, confirmed by the product record', async () => {
    const bestMatch = jest.fn(async () => WHEY);
    const label = { servingText: '1 scoop', servingSizeG: 31, proteinG: 24, calories: 120, carbsG: 3, fatG: 1.5 };
    const e = await estimateItem(item({}, { kind: 'packaged', brand: 'Optimum Nutrition', product: 'Gold Standard Whey', label }), deps({ bestMatch }));
    expect(e).toMatchObject({ basis: 'label_photo', reliability: 'verified' });
    expect(bestMatch).toHaveBeenCalledWith('Optimum Nutrition Gold Standard Whey', { packaged: true });
  });

  it('3. a recognised package', async () => {
    const e = await estimateItem(item({ proteinG: 25 }, { kind: 'packaged', brand: 'Optimum Nutrition', product: 'Gold Standard Whey' }), deps({ bestMatch: jest.fn(async () => WHEY) }));
    expect(e).toMatchObject({ basis: 'package', proteinG: 24, notes: ['model_agrees'] });
  });

  it('4. whole food → bundled density, assuming cooked meat', async () => {
    const e = await estimateItem(item({}, { grams: 150, dbQuery: 'chicken breast' }), deps());
    expect(e).toMatchObject({ basis: 'reference_density', proteinG: 46.5, notes: ['assumed_cooked', 'model_agrees'] });
  });

  it('4b. whole food not in the table → live database density', async () => {
    const lentils: FoodItem = { id: 'usda:172421', provider: 'usda', name: 'Lentils, boiled', brand: null, barcode: null, quality: 'reference', per100g: { proteinG: 9, calories: 116, carbsG: 20.1, fatG: 0.4 }, serving: null };
    const e = await estimateItem(item({ name: 'Lentils', proteinG: 17 }, { grams: 200, dbQuery: 'lentils boiled', cookState: 'cooked' }), deps({ bestMatch: jest.fn(async () => lentils) }));
    expect(e).toMatchObject({ basis: 'database_density', proteinG: 18 });
  });

  it('mixed dishes keep the analyser estimate; failures never throw', async () => {
    const bestMatch = jest.fn(async () => {
      throw new Error('offline');
    });
    const e = await estimateItem(item({ name: 'Beef burrito', proteinG: 32 }, { kind: 'mixed_dish', grams: 350, dbQuery: 'burrito beef' }), deps({ bestMatch }));
    expect(e).toMatchObject({ basis: 'model', proteinG: 32, reliability: 'estimate' });
    expect(bestMatch).not.toHaveBeenCalled();
    const e2 = await estimateItem(item({ name: 'Mystery stew' }, { grams: 300 }), deps({ bestMatch, lookupBarcode: bestMatch as unknown as EstimateDeps['lookupBarcode'] }));
    expect(e2.basis).toBe('model');
  });

  it('items without hints (older analyser) use the model with a wide range', async () => {
    const e = await estimateItem(item({ proteinG: 40, confidence: 0.5 }), deps());
    expect(e).toEqual(modelOnly(item({ proteinG: 40, confidence: 0.5 })));
    expect(e.proteinRange).toEqual({ lowG: 20, highG: 60 });
  });
});

describe('refineWithDatabases', () => {
  it('returns plain scan items with range and reliability only', async () => {
    const [r] = await refineWithDatabases([item({}, { grams: 150, dbQuery: 'chicken breast' })], deps());
    expect(Object.keys(r!).sort()).toEqual(['calories', 'carbsG', 'confidence', 'fatG', 'name', 'portion', 'proteinG', 'proteinRange', 'reliability']);
  });
});
