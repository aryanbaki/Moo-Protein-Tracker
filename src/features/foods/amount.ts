/** Grams ↔ servings for the amount field. Pure. */

/** Largest amount accepted in one entry. */
export const MAX_GRAMS = 3000;

/** Parses typed grams ("150", "62,5") into servings of `servingGrams`; null while the text is not a usable amount. */
export function gramsToServings(text: string, servingGrams: number): number | null {
  const g = Number(text.replace(',', '.').trim());
  if (!Number.isFinite(g) || g <= 0 || g > MAX_GRAMS || !(servingGrams > 0)) return null;
  return Math.round((g / servingGrams) * 1000) / 1000;
}

/** Servings back to whole grams for display. */
export function servingsToGrams(servings: number, servingGrams: number): number {
  return Math.round(servings * servingGrams);
}

/** Grams in one "serving" of a database food: its label serving, 100 g when it has none, null for a serving with no weight ("1 bar"). */
export function unitGramsOf(food: { serving: { grams: number | null } | null }): number | null {
  return food.serving ? food.serving.grams : 100;
}
