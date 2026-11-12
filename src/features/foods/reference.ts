/**
 * A small, bundled table of common protein foods "as eaten", from USDA
 * FoodData Central (public domain). It works offline, gives the photo model a
 * vetted protein density without a network call, and is a second opinion for
 * live database matches. Every row was checked against USDA by two independent
 * reviewers (see docs/food-data.md); do not add rows without the same check.
 */
import type { CookState } from '../scan/sanitize';
import { REFERENCE_FOODS } from './reference-data';
import type { Macros } from './types';

export { REFERENCE_FOODS };

export interface ReferenceFood {
  /** Stable key, e.g. "chicken-breast-roasted". */
  key: string;
  name: string;
  /** Lower-case words a photo label might use for it. The first is the main one. */
  aliases: string[];
  /** The state the numbers describe. */
  state: 'cooked' | 'raw' | 'as_sold';
  per100g: Macros;
  /** USDA FoodData Central id of the source record. */
  fdcId: number;
  /**
   * Cooked weight ÷ raw weight (meat loses water, legumes and grains gain it).
   * Lets a raw-weight portion use cooked numbers, and the reverse.
   */
  cookedYield?: number;
  /** A typical portion, for when the photo gives no weight. */
  typicalPortion?: { label: string; grams: number };
  /** Words that mean the photo is something else ("almond milk" is not almonds or milk). */
  exclude?: string[];
}

/** Singular form: berries → berry, potatoes → potato, dishes → dish, whites → white, eggs → egg. */
function singular(w: string): string {
  if (w.length <= 3) return w;
  if (w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (/(ch|sh|x|ss|o)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map(singular);
}

/** Words that describe preparation, not the food; they never decide a match. */
const PREP = new Set(['grilled', 'roasted', 'baked', 'cooked', 'fried', 'pan', 'boiled', 'steamed', 'raw', 'fresh', 'plain', 'sliced', 'diced', 'skinless', 'boneless', 'meat', 'only', 'piece', 'fillet']);

export interface ReferenceMatch {
  food: ReferenceFood;
  /** Protein etc. per 100 g in the requested state (converted with the yield when needed). */
  per100g: Macros;
  /** True when a raw↔cooked conversion was applied. */
  converted: boolean;
}

function convert(m: Macros, factor: number): Macros {
  return {
    proteinG: Math.round(m.proteinG * factor * 10) / 10,
    calories: Math.round(m.calories * factor),
    carbsG: Math.round(m.carbsG * factor * 10) / 10,
    fatG: Math.round(m.fatG * factor * 10) / 10,
  };
}

/**
 * Finds the reference food a photo label refers to. Every alias word that is
 * not a preparation word must appear in the query, so "chicken" alone will not
 * match "chicken thigh", and "beef burrito" will not match "beef steak".
 * Returns numbers for the requested cook state when the table can convert.
 */
export function matchReference(query: string, cookState: CookState = 'unknown', table: ReferenceFood[] = REFERENCE_FOODS): ReferenceMatch | null {
  const q = new Set(words(query));
  if (q.size === 0) return null;
  let best: { food: ReferenceFood; score: number } | null = null;
  for (const food of table) {
    // Whole words only (plurals folded), so "peach" does not trip "pea".
    if (food.exclude?.some((w) => { const ws = words(w); return ws.length > 0 && ws.every((x) => q.has(x)); })) continue;
    for (const alias of food.aliases) {
      const core = words(alias).filter((w) => !PREP.has(w));
      if (core.length === 0 || !core.every((w) => q.has(w))) continue;
      // Prefer longer (more specific) aliases, then a matching cook state.
      const stateBonus = (cookState === 'raw' && food.state === 'raw') || (cookState === 'cooked' && food.state === 'cooked') ? 0.5 : 0;
      const score = core.length + stateBonus;
      if (!best || score > best.score) best = { food, score };
    }
  }
  if (!best) return null;
  const { food } = best;
  // Convert when the photo state differs from the table state and the yield is known.
  if (food.cookedYield && food.state === 'cooked' && cookState === 'raw') {
    return { food, per100g: convert(food.per100g, food.cookedYield), converted: true };
  }
  if (food.cookedYield && food.state === 'raw' && cookState === 'cooked') {
    return { food, per100g: convert(food.per100g, 1 / food.cookedYield), converted: true };
  }
  return { food, per100g: food.per100g, converted: false };
}
