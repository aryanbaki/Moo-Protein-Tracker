/** Pure helpers for parsing and scaling nutrition numbers. */
import type { FoodItem, Macros } from './types';

export const KJ_PER_KCAL = 4.184;
const MAX_G = 500;
const MAX_KCAL = 5000;

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Finite number from a number or numeric string, else null. */
export function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Collapses whitespace and trims; non-strings become "". */
export function str(v: unknown, max = 120): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number | null, max: number): number {
  if (n === null || !Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, n));
}

/**
 * Builds clean macros, or null when nothing useful is present. Missing values
 * become 0 only when at least protein or energy is known, so a record with no
 * numbers is never shown as "0 g protein".
 */
export function makeMacros(raw: { protein: number | null; calories: number | null; carbs: number | null; fat: number | null }): Macros | null {
  if (raw.protein === null && raw.calories === null) return null;
  return {
    proteinG: round1(clamp(raw.protein, MAX_G)),
    calories: Math.round(clamp(raw.calories, MAX_KCAL)),
    carbsG: round1(clamp(raw.carbs, MAX_G)),
    fatG: round1(clamp(raw.fat, MAX_G)),
  };
}

export function scaleMacros(m: Macros, factor: number): Macros {
  const k = Number.isFinite(factor) && factor > 0 ? factor : 0;
  return {
    proteinG: round1(m.proteinG * k),
    calories: Math.round(m.calories * k),
    carbsG: round1(m.carbsG * k),
    fatG: round1(m.fatG * k),
  };
}

/** Macros for an amount in grams; null when the food has no per-100 g data and no weighed serving. */
export function macrosForGrams(food: FoodItem, grams: number): Macros | null {
  if (!(grams > 0)) return null;
  if (food.per100g) return scaleMacros(food.per100g, grams / 100);
  if (food.serving?.grams) return scaleMacros(food.serving.macros, grams / food.serving.grams);
  return null;
}

/** Macros for a number of label servings (e.g. 1.5 scoops), falling back to 100 g portions. */
export function macrosForServings(food: FoodItem, servings: number): Macros | null {
  if (food.serving) return scaleMacros(food.serving.macros, servings);
  if (food.per100g) return scaleMacros(food.per100g, servings);
  return null;
}

/** Grams of protein per 100 kcal: a quick "how protein-dense is this" score. */
export function proteinDensity(food: FoodItem): number | null {
  const m = food.per100g ?? food.serving?.macros ?? null;
  if (!m || m.calories <= 0) return null;
  return round1((m.proteinG * 100) / m.calories);
}

/**
 * Parses a weight out of free-text serving labels: "1 scoop (31 g)", "30g",
 * "2 bars 120 g", "250 ml". Ounces are converted. Returns grams or null.
 */
export function gramsFromServingText(text: string): number | null {
  const t = text.toLowerCase().replace(',', '.');
  const metric = t.match(/(\d+(?:\.\d+)?)\s*(g|gr|grams?|ml|millilit(?:er|re)s?)\b/);
  if (metric) {
    const n = Number(metric[1]);
    return n > 0 && n <= 5000 ? n : null;
  }
  const oz = t.match(/(\d+(?:\.\d+)?)\s*(?:oz|ounces?)\b/);
  if (oz && !/fl\.?\s*oz/.test(t)) {
    const n = Number(oz[1]) * 28.3495;
    return n > 0 && n <= 5000 ? round1(n) : null;
  }
  return null;
}

/** Digits-only barcode; accepts EAN-8, UPC-A (12), EAN-13, GTIN-14. */
export function normalizeCode(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '');
  return /^\d{8}$|^\d{12,14}$/.test(digits) ? digits : null;
}

/** Barcodes are equal when they match ignoring leading zeros (UPC-A 12 vs EAN-13 0-prefixed vs GTIN-14). */
export function sameBarcode(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.replace(/^0+/, '') === b.replace(/^0+/, '');
}
