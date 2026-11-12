/**
 * Open Food Facts: free, no key, ODbL-licensed, worldwide packaged foods.
 * Rules (openfoodfacts.github.io): a custom User-Agent on every call,
 * at most 100 product reads and 10 searches per minute per IP.
 */
import { gramsFromServingText, isRecord, KJ_PER_KCAL, makeMacros, normalizeCode, num, str } from './nutrients';
import { panelFromOff, scalePanel } from './panel';
import type { FoodItem, Macros } from './types';

export const OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
export const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
export const OFF_FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity,data_sources_tags';
/** Generic client name; deliberately carries no user or device details. */
export const OFF_USER_AGENT = 'ProteinTrackerApp/1.0 (Expo)';

function readBasis(n: Record<string, unknown>, suffix: '_serving' | '_100g'): Macros | null {
  const kcal = num(n[`energy-kcal${suffix}`]);
  const kj = num(n[`energy-kj${suffix}`]) ?? num(n[`energy${suffix}`]);
  return makeMacros({
    protein: num(n[`proteins${suffix}`]),
    calories: kcal ?? (kj !== null ? kj / KJ_PER_KCAL : null),
    carbs: num(n[`carbohydrates${suffix}`]),
    fat: num(n[`fat${suffix}`]),
  });
}

/** OFF tags products bulk-imported from USDA's database (e.g. "database-usda-ndb-import"); those copy USDA's numbers. */
export function importedFromUsda(p: Record<string, unknown>): boolean {
  const tags = Array.isArray(p.data_sources_tags) ? p.data_sources_tags : [];
  return tags.some((t) => typeof t === 'string' && /usda/i.test(t));
}

/** Maps one OFF product object (not the envelope) to a FoodItem, or null when it has no usable numbers. */
export function mapOffProduct(p: unknown, fallbackCode?: string): FoodItem | null {
  if (!isRecord(p)) return null;
  const nutriments = isRecord(p.nutriments) ? p.nutriments : {};
  const per100g = readBasis(nutriments, '_100g');
  const servingMacros = readBasis(nutriments, '_serving');
  const servingLabel = str(p.serving_size, 60);
  const servingGrams = num(p.serving_quantity) ?? (servingLabel ? gramsFromServingText(servingLabel) : null);

  let serving: FoodItem['serving'] = null;
  if (servingLabel || servingGrams) {
    const macros = servingMacros ?? (per100g && servingGrams ? scale(per100g, servingGrams / 100) : null);
    if (macros) serving = { label: servingLabel || `${servingGrams} g`, grams: servingGrams && servingGrams > 0 ? servingGrams : null, macros };
  }
  if (!per100g && !serving) return null;

  const code = normalizeCode(str(p.code) || fallbackCode || '');
  // Per-100 g panel; when OFF only has per-serving numbers, derive it from the serving weight.
  let panel = panelFromOff(nutriments, '_100g');
  if (Object.keys(panel).length === 0 && servingGrams) panel = scalePanel(panelFromOff(nutriments, '_serving'), 100 / servingGrams);
  const productName = str(p.product_name, 80);
  const brand = str(p.brands).split(',')[0]?.trim() || null;
  return {
    id: `openfoodfacts:${code ?? (productName || 'unknown')}`,
    provider: 'openfoodfacts',
    name: productName || brand || 'Packaged food',
    brand,
    barcode: code,
    quality: 'community',
    per100g,
    serving,
    panel: Object.keys(panel).length ? panel : null,
    ...(importedFromUsda(p) ? { derivedFrom: ['usda' as const] } : {}),
  };
}

function scale(m: Macros, k: number): Macros {
  return { proteinG: Math.round(m.proteinG * k * 10) / 10, calories: Math.round(m.calories * k), carbsG: Math.round(m.carbsG * k * 10) / 10, fatG: Math.round(m.fatG * k * 10) / 10 };
}

/** Product envelope → FoodItem; `not_found` and `no_nutrition` are distinguished for the UI. */
export function mapOffProductResponse(json: unknown, code: string): { status: 'found'; food: FoodItem } | { status: 'not_found' } | { status: 'no_nutrition'; name: string } {
  if (!isRecord(json) || !isRecord(json.product) || json.status === 0) return { status: 'not_found' };
  const food = mapOffProduct(json.product, code);
  if (!food) return { status: 'no_nutrition', name: str(json.product.product_name, 80) || str(json.product.brands).split(',')[0]?.trim() || 'Scanned product' };
  return { status: 'found', food };
}

/** Search envelope (`{ products: [...] }`) → FoodItems with numbers. */
export function mapOffSearch(json: unknown): FoodItem[] {
  if (!isRecord(json) || !Array.isArray(json.products)) return [];
  const out: FoodItem[] = [];
  for (const p of json.products) {
    const f = mapOffProduct(p);
    if (f && f.barcode) out.push(f);
  }
  return out;
}

export function offProductUrl(code: string): string {
  return `${OFF_PRODUCT_URL}/${code}.json?fields=${OFF_FIELDS}`;
}

export function offSearchUrl(query: string, pageSize = 20): string {
  const q = encodeURIComponent(query.trim());
  return `${OFF_SEARCH_URL}?search_terms=${q}&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=${OFF_FIELDS}`;
}
