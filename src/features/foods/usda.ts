/**
 * USDA FoodData Central: free, public domain (CC0 1.0), US data.
 * - Branded: manufacturer label data with UPC/GTIN (protein bars, whey, yogurt…).
 * - Foundation / SR Legacy: lab-analysed generic foods (chicken breast, eggs, lentils…).
 * - Survey (FNDDS): foods "as eaten" with household portions.
 * Needs a free api.data.gov key (1,000 requests/hour/IP). In production the key
 * lives in Supabase and the app goes through the `food-search` Edge Function;
 * without Supabase, the public DEMO_KEY is used (very low limits, dev only).
 * Search results report nutrients per 100 g (or 100 ml for drinks).
 */
import { gramsFromServingText, isRecord, KJ_PER_KCAL, makeMacros, normalizeCode, num, round1, sameBarcode, str } from './nutrients';
import { panelFromUsda } from './panel';
import type { DataQuality, FoodItem, Macros } from './types';

export const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
export type UsdaDataType = 'Branded' | 'Foundation' | 'SR Legacy' | 'Survey (FNDDS)';
export const GENERIC_TYPES: UsdaDataType[] = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];
export const ALL_TYPES: UsdaDataType[] = ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'];

/** FDC nutrient ids (and legacy nutrient numbers as a fallback). */
const PROTEIN = { id: 1003, number: '203' };
const FAT = { id: 1004, number: '204' };
const CARBS = { id: 1005, number: '205' };
const KCAL = { id: 1008, number: '208' };
const KCAL_ATWATER_GENERAL = { id: 2047, number: '957' };
const KCAL_ATWATER_SPECIFIC = { id: 2048, number: '958' };
const KJ = { id: 1062, number: '268' };

type NutrientKey = { id: number; number: string };

function nutrientValue(list: unknown[], key: NutrientKey): number | null {
  for (const n of list) {
    if (!isRecord(n)) continue;
    // Search results are flat; the details endpoint nests `{ nutrient: {id, number}, amount }`.
    const nested = isRecord(n.nutrient) ? n.nutrient : null;
    const id = num(n.nutrientId) ?? num(nested?.id);
    const number = str(n.nutrientNumber) || str(nested?.number);
    if (id === key.id || number === key.number) {
      const v = num(n.value) ?? num(n.amount);
      if (v !== null) return v;
    }
  }
  return null;
}

function per100FromNutrients(list: unknown[]): Macros | null {
  const kcal = nutrientValue(list, KCAL) ?? nutrientValue(list, KCAL_ATWATER_SPECIFIC) ?? nutrientValue(list, KCAL_ATWATER_GENERAL);
  const kj = nutrientValue(list, KJ);
  return makeMacros({
    protein: nutrientValue(list, PROTEIN),
    calories: kcal ?? (kj !== null ? kj / KJ_PER_KCAL : null),
    carbs: nutrientValue(list, CARBS),
    fat: nutrientValue(list, FAT),
  });
}

function qualityOf(dataType: string): DataQuality {
  return dataType === 'Branded' ? 'label' : 'reference';
}

/** Title-cases USDA's SHOUTING branded descriptions; leaves mixed case alone. */
export function tidyName(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

/** Maps one search hit (or a details record) to a FoodItem; null when it has no protein or energy. */
export function mapUsdaFood(f: unknown): FoodItem | null {
  if (!isRecord(f)) return null;
  const fdcId = num(f.fdcId);
  const description = str(f.description, 120);
  if (fdcId === null || !description) return null;
  const dataType = str(f.dataType);
  const nutrients = Array.isArray(f.foodNutrients) ? f.foodNutrients : [];
  const per100g = per100FromNutrients(nutrients);
  if (!per100g) return null;

  // Branded foods: servingSize + servingSizeUnit ("g", "ml", "GRM", "MLT").
  let serving: FoodItem['serving'] = null;
  const size = num(f.servingSize);
  const unit = str(f.servingSizeUnit).toLowerCase();
  const household = str(f.householdServingFullText, 50);
  const metricUnit = unit === 'g' || unit === 'grm' || unit === 'ml' || unit === 'mlt';
  const grams = size !== null && size > 0 && metricUnit ? size : household ? gramsFromServingText(household) : null;
  if (grams) {
    const unitLabel = unit === 'ml' || unit === 'mlt' ? 'ml' : 'g';
    const label = household && !/\d\s*(g|ml)\b/i.test(household) ? `${household} (${round1(grams)} ${unitLabel})` : household || `${round1(grams)} ${unitLabel}`;
    serving = { label, grams, macros: { proteinG: round1((per100g.proteinG * grams) / 100), calories: Math.round((per100g.calories * grams) / 100), carbsG: round1((per100g.carbsG * grams) / 100), fatG: round1((per100g.fatG * grams) / 100) } };
  }

  const brand = str(f.brandName, 60) || str(f.brandOwner, 60) || null;
  return {
    id: `usda:${fdcId}`,
    provider: 'usda',
    name: tidyName(description),
    brand: brand ? tidyName(brand) : null,
    barcode: normalizeCode(str(f.gtinUpc)),
    quality: qualityOf(dataType),
    per100g,
    serving,
    panel: panelFromUsda(nutrients),
  };
}

export function mapUsdaSearch(json: unknown): FoodItem[] {
  if (!isRecord(json) || !Array.isArray(json.foods)) return [];
  const out: FoodItem[] = [];
  for (const f of json.foods) {
    const m = mapUsdaFood(f);
    if (m) out.push(m);
  }
  return out;
}

/** The branded record whose GTIN matches `code` (ignoring leading zeros), if any. */
export function pickBarcodeMatch(foods: FoodItem[], code: string): FoodItem | null {
  return foods.find((f) => sameBarcode(f.barcode, code)) ?? null;
}

export interface UsdaSearchParams {
  query: string;
  dataTypes?: UsdaDataType[];
  pageSize?: number;
}

/** Request body for POST /foods/search (also what the Edge Function forwards). */
export function usdaSearchBody({ query, dataTypes = ALL_TYPES, pageSize = 25 }: UsdaSearchParams) {
  return { query: query.trim().slice(0, 100), dataType: dataTypes, pageSize: Math.min(50, Math.max(1, pageSize)) };
}
