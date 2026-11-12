import { BarcodeError, lookupBarcode, mapOpenFoodFactsProduct, normalizeBarcode } from './barcode';
import per100 from './__fixtures__/off-100g.json';
import noNutriments from './__fixtures__/off-no-nutriments.json';
import notFound from './__fixtures__/off-not-found.json';
import perServing from './__fixtures__/off-serving.json';

describe('normalizeBarcode', () => {
  it('accepts EAN/UPC lengths and strips spaces and dashes', () => {
    expect(normalizeBarcode('3017620422003')).toBe('3017620422003');
    expect(normalizeBarcode(' 0 12345-67890 5 ')).toBe('012345678905');
    expect(normalizeBarcode('12345678')).toBe('12345678');
  });
  it('rejects junk', () => {
    expect(normalizeBarcode('')).toBeNull();
    expect(normalizeBarcode('12345')).toBeNull();
    expect(normalizeBarcode('30176204220o3')).toBeNull();
    expect(normalizeBarcode('123456789')).toBeNull();
  });
});

describe('mapOpenFoodFactsProduct', () => {
  it('uses per-serving values when the label has them', () => {
    const r = mapOpenFoodFactsProduct(perServing);
    expect(r).toEqual({
      status: 'found',
      result: {
        source: 'barcode',
        items: [{ name: 'Nutella', portion: '15 g', proteinG: 0.9, calories: 81, carbsG: 8.6, fatG: 4.6, confidence: 0.9 }],
      },
    });
  });

  it('falls back to per 100 g, converts kJ and parses numeric strings', () => {
    const r = mapOpenFoodFactsProduct(per100);
    if (r.status !== 'found') throw new Error('expected found');
    const item = r.result.items[0]!;
    expect(item.portion).toBe('100 g');
    expect(item.name).toBe('Farm Co Skyr Natural');
    expect(item.proteinG).toBe(11);
    expect(item.calories).toBe(63); // 264 kJ
    expect(item.fatG).toBe(0.2);
  });

  it('prefixes the brand when the product name lacks it', () => {
    const r = mapOpenFoodFactsProduct({ status: 1, product: { brands: 'Oatly, Other', product_name: 'Barista', nutriments: { proteins_100g: 1 } } });
    expect(r.status === 'found' && r.result.items[0]!.name).toBe('Oatly Barista');
  });

  it('reports not found', () => {
    expect(mapOpenFoodFactsProduct(notFound)).toEqual({ status: 'not_found' });
    expect(mapOpenFoodFactsProduct(null)).toEqual({ status: 'not_found' });
  });

  it('reports missing nutrition with the product name', () => {
    expect(mapOpenFoodFactsProduct(noNutriments)).toEqual({ status: 'no_nutrition', name: 'Mystery Bar' });
  });

  it('clamps absurd values', () => {
    const r = mapOpenFoodFactsProduct({ status: 1, product: { product_name: 'X', nutriments: { proteins_100g: -4, fat_100g: 99999 } } });
    expect(r.status === 'found' && r.result.items[0]).toMatchObject({ proteinG: 0, fatG: 500, calories: 0 });
  });
});

describe('lookupBarcode', () => {
  const respond = (status: number, body: unknown) => jest.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response);

  it('requests only the needed fields and maps the product', async () => {
    const f = respond(200, perServing);
    const r = await lookupBarcode('3017620422003', f as unknown as typeof fetch);
    expect(r.status).toBe('found');
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit | undefined];
    expect(url).toBe('https://world.openfoodfacts.org/api/v2/product/3017620422003.json?fields=product_name,brands,nutriments,serving_size,serving_quantity');
    const ua = (init?.headers as Record<string, string> | undefined)?.['User-Agent'];
    expect(ua).toBeDefined();
    expect(ua).not.toMatch(/@/);
  });

  it('treats 404 as not found', async () => {
    await expect(lookupBarcode('12345678', respond(404, notFound) as unknown as typeof fetch)).resolves.toEqual({ status: 'not_found' });
  });

  it('throws typed errors', async () => {
    await expect(lookupBarcode('abc')).rejects.toMatchObject({ code: 'invalid' });
    await expect(lookupBarcode('12345678', respond(503, {}) as unknown as typeof fetch)).rejects.toBeInstanceOf(BarcodeError);
    const offline = jest.fn(async () => {
      throw new TypeError('Network request failed');
    });
    await expect(lookupBarcode('12345678', offline as unknown as typeof fetch)).rejects.toMatchObject({ code: 'offline' });
  });
});
