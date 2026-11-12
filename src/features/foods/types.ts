import type { NutrientPanel } from './panel';
import type { Reliability } from './verify';

/**
 * Food database records shared by every provider (Open Food Facts, USDA
 * FoodData Central). Dependency-free so pure mapping code and tests can use it.
 */

/** `fatsecret` is verification-only: never shown or logged (its terms forbid storing values). */
export type FoodProvider = 'openfoodfacts' | 'usda' | 'fatsecret';

/**
 * How much to trust the numbers:
 * - `label`: copied from a printed nutrition label by the manufacturer (USDA Branded).
 * - `community`: label data typed in by volunteers (Open Food Facts).
 * - `reference`: lab-analysed generic food (USDA Foundation / SR Legacy / Survey).
 */
export type DataQuality = 'label' | 'community' | 'reference';

export interface Macros {
  proteinG: number;
  calories: number;
  carbsG: number;
  fatG: number;
}

export interface Serving {
  /** What the label calls one serving, e.g. "1 scoop (31 g)" or "1 bar". */
  label: string;
  /** Weight (or volume in ml, treated 1:1) of one serving when known. */
  grams: number | null;
}

export interface FoodItem {
  /** Stable across lookups: `${provider}:${providerId}`. */
  id: string;
  provider: FoodProvider;
  name: string;
  brand: string | null;
  /** Digits only, as printed (UPC/EAN/GTIN), when the record has one. */
  barcode: string | null;
  quality: DataQuality;
  /** Per 100 g (or 100 ml). Null when the source only gives per-serving numbers. */
  per100g: Macros | null;
  /** One label serving. Null when the source has no serving information. */
  serving: (Serving & { macros: Macros }) | null;
  /**
   * Full nutrition-facts panel per 100 g (fiber, sugars, sodium, vitamins…),
   * when the source has it. Macros above stay the source of truth for logging.
   */
  panel?: NutrientPanel | null;
  /**
   * Providers this record's numbers were copied from (e.g. an Open Food Facts
   * product imported from USDA). Agreement with those is not independent.
   */
  derivedFrom?: FoodProvider[];
  /** Set by the cross-check: how far these numbers can be trusted, and why. */
  reliability?: Reliability;
}

export type FoodErrorCode = 'invalid' | 'offline' | 'server' | 'rate_limited';

export class FoodLookupError extends Error {
  constructor(public readonly code: FoodErrorCode) {
    super(code);
    this.name = 'FoodLookupError';
  }
}
