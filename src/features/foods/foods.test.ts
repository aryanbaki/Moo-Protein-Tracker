import offPerServing from '../scan/__fixtures__/off-serving.json';
import offNoNutriments from '../scan/__fixtures__/off-no-nutriments.json';
import offBar from './__fixtures__/off-search-bar.json';
import usdaChicken from './__fixtures__/usda-search-chicken.json';
import usdaWhey from './__fixtures__/usda-search-whey.json';
import { gramsFromServingText, macrosForGrams, macrosForServings, proteinDensity, sameBarcode } from './nutrients';
import { mapOffProductResponse, mapOffSearch, offSearchUrl } from './openFoodFacts';
import { dedupeFoods, rankFoods } from './rank';
import { createFoodService, OFF_SEARCHES_PER_MINUTE } from './service';
import { foodToScannedItem } from './toScan';
import { FoodLookupError } from './types';
import { mapUsdaSearch, pickBarcodeMatch, tidyName, usdaSearchBody } from './usda';

const respond = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

describe('nutrients', () => {
  it('reads grams from serving labels', () => {
    expect(gramsFromServingText('1 scoop (31 g)')).toBe(31);
    expect(gramsFromServingText('30g')).toBe(30);
    expect(gramsFromServingText('250 ml')).toBe(250);
    expect(gramsFromServingText('2 oz')).toBe(56.7);
    expect(gramsFromServingText('8 fl oz')).toBeNull();
    expect(gramsFromServingText('1 bar')).toBeNull();
  });
  it('matches barcodes ignoring leading zeros', () => {
    expect(sameBarcode('0748927028669', '748927028669')).toBe(true);
    expect(sameBarcode('00748927028669', '748927028669')).toBe(true);
    expect(sameBarcode('748927028668', '748927028669')).toBe(false);
    expect(sameBarcode(null, '1')).toBe(false);
  });
});

describe('USDA mapping', () => {
  const [whey, isolate] = mapUsdaSearch(usdaWhey);
  it('maps branded label data with a household serving', () => {
    expect(whey).toMatchObject({
      id: 'usda:2101234',
      provider: 'usda',
      quality: 'label',
      barcode: '748927028669',
      brand: 'Optimum Nutrition',
      name: 'Gold Standard 100% Whey Protein Powder, Double Rich Chocolate',
      per100g: { proteinG: 77.4, calories: 387, carbsG: 9.7, fatG: 4.8 },
    });
    expect(whey!.serving).toEqual({ label: '1 scoop (31 g)', grams: 31, macros: { proteinG: 24, calories: 120, carbsG: 3, fatG: 1.5 } });
  });
  it('maps generic reference foods and Atwater energy', () => {
    expect(isolate).toMatchObject({ quality: 'reference', brand: null, serving: null, per100g: { proteinG: 78.1, calories: 359 } });
    const chicken = mapUsdaSearch(usdaChicken);
    expect(chicken).toHaveLength(2); // the record with no nutrients is dropped
    expect(chicken[0]!.per100g).toEqual({ proteinG: 22.5, calories: 104, carbsG: 0, fatG: 1.9 });
  });
  it('builds bounded search bodies and tidies names', () => {
    expect(usdaSearchBody({ query: '  whey ', pageSize: 999 })).toEqual({ query: 'whey', dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'], pageSize: 50 });
    expect(tidyName('GREEK YOGURT')).toBe('Greek Yogurt');
    expect(tidyName('Greek yogurt')).toBe('Greek yogurt');
  });
  it('picks the GTIN match', () => {
    expect(pickBarcodeMatch(mapUsdaSearch(usdaWhey), '0748927028669')?.id).toBe('usda:2101234');
    expect(pickBarcodeMatch(mapUsdaSearch(usdaWhey), '111111111111')).toBeNull();
  });
  it('survives junk', () => {
    expect(mapUsdaSearch(null)).toEqual([]);
    expect(mapUsdaSearch({ foods: [null, { fdcId: 'x' }, { fdcId: 1, description: 'x', foodNutrients: 'nope' }] })).toEqual([]);
  });
});

describe('Open Food Facts mapping', () => {
  it('keeps both per-serving and per-100 g numbers', () => {
    const r = mapOffProductResponse(offPerServing, '3017620422003');
    if (r.status !== 'found') throw new Error('expected found');
    expect(r.food).toMatchObject({ id: 'openfoodfacts:3017620422003', brand: 'Nutella', quality: 'community', per100g: { proteinG: 6.3, calories: 539 } });
    expect(r.food.serving).toEqual({ label: '15 g', grams: 15, macros: { proteinG: 0.9, calories: 81, carbsG: 8.6, fatG: 4.6 } });
  });
  it('derives a serving from per-100 g when only the size is given', () => {
    const foods = mapOffSearch(offBar);
    expect(foods).toHaveLength(2); // the entry without a barcode is skipped
    expect(foods[1]!.serving).toEqual({ label: '30.4 g', grams: 30.4, macros: { proteinG: 24, calories: 120, carbsG: 0, fatG: 0 } });
  });
  it('flags products with no numbers', () => {
    expect(mapOffProductResponse(offNoNutriments, '1')).toEqual({ status: 'no_nutrition', name: 'Mystery Bar' });
    expect(mapOffProductResponse({ status: 0 }, '1')).toEqual({ status: 'not_found' });
  });
  it('encodes the search url', () => {
    expect(offSearchUrl('cookies & cream')).toContain('search_terms=cookies%20%26%20cream');
  });
});

describe('portion maths', () => {
  const [whey] = mapUsdaSearch(usdaWhey);
  it('scales by grams and servings', () => {
    expect(macrosForGrams(whey!, 62)).toEqual({ proteinG: 48, calories: 240, carbsG: 6, fatG: 3 });
    expect(macrosForServings(whey!, 1.5)).toEqual({ proteinG: 36, calories: 180, carbsG: 4.5, fatG: 2.3 });
    expect(macrosForGrams(whey!, 0)).toBeNull();
  });
  it('scores protein density (g per 100 kcal)', () => {
    expect(proteinDensity(whey!)).toBe(20);
  });
  it('adapts to the scan result sheet', () => {
    expect(foodToScannedItem(whey!)).toEqual({
      name: 'Optimum Nutrition Gold Standard 100% Whey Protein Powder, Double Rich Chocolate'.slice(0, 80),
      portion: '1 scoop (31 g)',
      proteinG: 24,
      calories: 120,
      carbsG: 3,
      fatG: 1.5,
      confidence: 0.95,
    });
  });
});

describe('ranking', () => {
  it('prefers label data over the same product from the community and ranks matches first', () => {
    const all = [...mapOffSearch(offBar), ...mapUsdaSearch(usdaWhey)];
    const ranked = rankFoods(all, 'gold standard whey');
    expect(ranked[0]!.provider).toBe('usda');
    expect(ranked.filter((f) => f.barcode && sameBarcode(f.barcode, '748927028669'))).toHaveLength(1);
    expect(rankFoods(all, 'quest cookies cream')[0]!.name).toBe('Protein Bar Cookies & Cream');
  });
  it('dedupes by brand + name', () => {
    const [a] = mapUsdaSearch(usdaChicken);
    expect(dedupeFoods([a!, { ...a!, id: 'other' }])).toHaveLength(1);
  });
});

describe('food service', () => {
  it('uses Open Food Facts first for barcodes and caches', async () => {
    const fetch = jest.fn(async () => respond(200, offPerServing));
    const usdaSearch = jest.fn(async () => usdaWhey);
    const svc = createFoodService({ fetch: fetch as unknown as typeof globalThis.fetch, usdaSearch });
    const r = await svc.lookupBarcode('3017620422003');
    expect(r.status).toBe('found');
    await svc.lookupBarcode('3017620422003');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(usdaSearch).not.toHaveBeenCalled();
  });

  it('falls back to USDA Branded by GTIN when Open Food Facts has nothing', async () => {
    const fetch = jest.fn(async () => respond(404, null));
    const usdaSearch = jest.fn(async () => usdaWhey);
    const svc = createFoodService({ fetch: fetch as unknown as typeof globalThis.fetch, usdaSearch });
    const r = await svc.lookupBarcode('748927028669');
    expect(r.status === 'found' && r.food.id).toBe('usda:2101234');
    expect(usdaSearch).toHaveBeenCalledWith({ query: '748927028669', dataType: ['Branded'], pageSize: 5 });
  });

  it('keeps "no nutrition" when USDA has no match, and reports offline when both fail', async () => {
    const svc = createFoodService({ fetch: (async () => respond(200, offNoNutriments)) as unknown as typeof fetch, usdaSearch: async () => ({ foods: [] }) });
    await expect(svc.lookupBarcode('12345678')).resolves.toEqual({ status: 'no_nutrition', name: 'Mystery Bar' });
    const down = createFoodService({
      fetch: (async () => {
        throw new TypeError('Network request failed');
      }) as unknown as typeof fetch,
      usdaSearch: async () => {
        throw new FoodLookupError('offline');
      },
    });
    await expect(down.lookupBarcode('12345678')).rejects.toMatchObject({ code: 'offline' });
    await expect(down.lookupBarcode('abc')).rejects.toMatchObject({ code: 'invalid' });
  });

  it('searches both sources, tolerating one failing', async () => {
    const svc = createFoodService({ fetch: (async () => respond(503, {})) as unknown as typeof fetch, usdaSearch: async () => usdaChicken });
    const r = await svc.search('chicken breast');
    expect(r.map((f) => f.id)).toEqual(['usda:2646170', 'usda:171477']);
    await expect(svc.search('x')).resolves.toEqual([]);
  });

  it('throws when every source fails', async () => {
    const svc = createFoodService({
      fetch: (async () => respond(503, {})) as unknown as typeof fetch,
      usdaSearch: async () => {
        throw new FoodLookupError('rate_limited');
      },
    });
    await expect(svc.search('eggs')).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('stays under the Open Food Facts search limit', async () => {
    const fetch = jest.fn(async () => respond(200, offBar));
    const svc = createFoodService({ fetch: fetch as unknown as typeof globalThis.fetch, usdaSearch: async () => ({ foods: [] }), now: () => 1000 });
    for (let i = 0; i < OFF_SEARCHES_PER_MINUTE + 3; i++) await svc.search(`bar ${i}`);
    expect(fetch).toHaveBeenCalledTimes(OFF_SEARCHES_PER_MINUTE);
  });

  it('only returns a best match when every word matches', async () => {
    const svc = createFoodService({ fetch: jest.fn() as unknown as typeof fetch, usdaSearch: async () => usdaWhey });
    await expect(svc.bestMatch('gold standard whey', { packaged: true })).resolves.toMatchObject({ id: 'usda:2101234' });
    await expect(svc.bestMatch('vanilla casein shake', { packaged: true })).resolves.toBeNull();
  });
});
