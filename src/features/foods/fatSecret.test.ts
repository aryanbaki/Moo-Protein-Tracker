import { mapFatSecretFood } from './fatSecret';
import { createFoodService } from './service';

const FS = {
  food: {
    food_id: '33691',
    food_name: 'Gold Standard 100% Whey',
    brand_name: 'Optimum Nutrition',
    servings: [
      { serving_description: '1 scoop', metric_serving_amount: '', metric_serving_unit: '', calories: '120', protein: '24' },
      { serving_description: '1 scoop (30.4 g)', metric_serving_amount: '30.400', metric_serving_unit: 'g', calories: '120', protein: '24.00', carbohydrate: '3.00', fat: '1.50' },
    ],
  },
};

describe('mapFatSecretFood', () => {
  it('uses the first metric serving for per-100 g numbers', () => {
    expect(mapFatSecretFood(FS, '748927028669')).toEqual({
      id: 'fatsecret:33691',
      provider: 'fatsecret',
      name: 'Gold Standard 100% Whey',
      brand: 'Optimum Nutrition',
      barcode: '748927028669',
      quality: 'label',
      per100g: { proteinG: 78.9, calories: 395, carbsG: 9.9, fatG: 4.9 },
      serving: { label: '1 scoop (30.4 g)', grams: 30.4, macros: { proteinG: 24, calories: 120, carbsG: 3, fatG: 1.5 } },
    });
  });
  it('returns null without a usable serving', () => {
    expect(mapFatSecretFood({ food: null }, '1')).toBeNull();
    expect(mapFatSecretFood(null, '1')).toBeNull();
    expect(mapFatSecretFood({ food: { food_id: '1', servings: [{ metric_serving_amount: '0', metric_serving_unit: 'g', protein: '3' }] } }, '1')).toBeNull();
  });
});

describe('barcode lookup with FatSecret as a third opinion', () => {
  const respond = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;
  it('upgrades a single-source answer to verified, and FatSecret alone is not an answer', async () => {
    const off = { status: 1, product: { code: '748927028669', product_name: 'Gold Standard Whey', brands: 'Optimum Nutrition', serving_size: '30.4 g', nutriments: { proteins_100g: 79, 'energy-kcal_100g': 395, carbohydrates_100g: 7, fat_100g: 5 } } };
    const svc = createFoodService({ fetch: (async () => respond(200, off)) as unknown as typeof fetch, usdaSearch: async () => ({ foods: [] }), fatSecretBarcode: async () => FS });
    const r = await svc.lookupBarcode('748927028669');
    expect(r.status === 'found' && r.food.reliability).toMatchObject({ level: 'verified', sources: ['openfoodfacts', 'fatsecret'] });
    expect(r.status === 'found' && r.food.provider).toBe('openfoodfacts');

    const alone = createFoodService({ fetch: (async () => respond(404, null)) as unknown as typeof fetch, usdaSearch: async () => ({ foods: [] }), fatSecretBarcode: async () => FS });
    await expect(alone.lookupBarcode('748927028669')).resolves.toEqual({ status: 'not_found' });
  });
  it('ignores FatSecret failures', async () => {
    const svc = createFoodService({
      fetch: (async () => respond(404, null)) as unknown as typeof fetch,
      usdaSearch: async () => ({ foods: [] }),
      fatSecretBarcode: async () => {
        throw new Error('down');
      },
    });
    await expect(svc.lookupBarcode('748927028669')).resolves.toEqual({ status: 'not_found' });
  });
});
