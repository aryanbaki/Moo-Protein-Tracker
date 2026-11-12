import { convertUnit, formatNutrient, NUTRIENTS, panelFromOff, panelFromUsda, scalePanel } from './panel';

describe('panelFromUsda', () => {
  it('reads search (flat) and details (nested) shapes with unit conversion', () => {
    const flat = [
      { nutrientId: 1003, nutrientNumber: '203', unitName: 'G', value: 31.02 },
      { nutrientId: 1093, nutrientNumber: '307', unitName: 'MG', value: 74 },
      { nutrientId: 1114, nutrientNumber: '328', unitName: 'UG', value: 0.1 },
      { nutrientId: 1110, nutrientNumber: '324', unitName: 'IU', value: 5 },
      { nutrientId: 2000, nutrientNumber: '269', unitName: 'G', value: 0 },
      { nutrientId: 2047, nutrientNumber: '957', unitName: 'KCAL', value: 170 },
      { nutrientId: 1008, nutrientNumber: '208', unitName: 'KCAL', value: 165 },
    ];
    expect(panelFromUsda(flat)).toEqual({ calories: 165, protein: 31, sodium: 74, vitaminD: 0.1, sugars: 0 });
    const nested = [{ nutrient: { id: 1253, number: '601', unitName: 'mg' }, amount: 85 }, { nutrient: { id: 1062, number: '268', unitName: 'kJ' }, amount: 690 }];
    expect(panelFromUsda(nested)).toEqual({ cholesterol: 85 });
  });
  it('uses Atwater energy when 1008 is missing, and survives junk', () => {
    expect(panelFromUsda([{ nutrientId: 2048, unitName: 'KCAL', value: 104 }])).toEqual({ calories: 104 });
    expect(panelFromUsda(null)).toEqual({});
    expect(panelFromUsda([null, 3, { nutrientId: 1003 }])).toEqual({});
  });
});

describe('panelFromOff', () => {
  it('converts grams to mg/µg and derives sodium from salt', () => {
    expect(panelFromOff({ proteins_100g: 35, sodium_100g: 0.4, 'vitamin-d_100g': 0.0000025, 'saturated-fat_100g': 4, 'energy-kj_100g': 1326 })).toEqual({
      protein: 35,
      sodium: 400,
      vitaminD: 2.5,
      saturatedFat: 4,
      calories: 316.9,
    });
    expect(panelFromOff({ salt_100g: 1 })).toEqual({ sodium: 400 });
    expect(panelFromOff({ proteins_serving: 21 }, '_serving')).toEqual({ protein: 21 });
  });
});

describe('helpers', () => {
  it('converts units', () => {
    expect(convertUnit(1, 'g', 'mg')).toBe(1000);
    expect(convertUnit(500, 'MG', 'g')).toBe(0.5);
    expect(convertUnit(418.4, 'kJ', 'kcal')).toBeCloseTo(100);
    expect(convertUnit(5, 'IU', 'µg')).toBeNull();
    expect(convertUnit(5, 'g', 'kcal')).toBeNull();
  });
  it('scales and formats', () => {
    expect(scalePanel({ protein: 31, sodium: 74 }, 1.5)).toEqual({ protein: 46.5, sodium: 111 });
    expect(formatNutrient('sodium', 111)).toBe('111 mg');
    expect(formatNutrient('protein', 4.25)).toBe('4.3 g');
    expect(formatNutrient('calories', 164.6)).toBe('165');
  });
});

it('the food-search Edge Function keeps every nutrient the panel reads', () => {
  const { readFileSync } = jest.requireActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('fs');
  const src = readFileSync('supabase/functions/food-search/index.ts', 'utf8');
  const kept = new Set((src.match(/KEEP_NUTRIENTS = new Set\(\[([^\]]+)\]/)?.[1] ?? '').split(',').map((x) => Number(x.trim())));
  for (const n of NUTRIENTS) for (const id of n.usdaIds) expect(kept.has(id)).toBe(true);
});
