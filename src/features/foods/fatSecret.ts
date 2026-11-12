/**
 * FatSecret Platform as an independent second opinion for barcodes. Its terms
 * forbid storing nutrient values beyond 24 hours, so its records only take part
 * in cross-checks (verify.ts VERIFY_ONLY) and are never shown or logged.
 * Calls go through the `food-verify` Edge Function, which holds the keys.
 */
import { isRecord, makeMacros, num, round1, str } from './nutrients';
import type { FoodItem } from './types';

/** Maps the trimmed `food.get` record from `food-verify` to a FoodItem (per 100 g from a metric serving). */
export function mapFatSecretFood(json: unknown, barcode: string): FoodItem | null {
  const food = isRecord(json) && isRecord(json.food) ? json.food : null;
  if (!food) return null;
  const servings = Array.isArray(food.servings) ? food.servings.filter(isRecord) : [];
  for (const s of servings) {
    const amount = num(s.metric_serving_amount);
    const unit = str(s.metric_serving_unit).toLowerCase();
    if (!amount || amount <= 0 || (unit !== 'g' && unit !== 'ml')) continue;
    const perServing = makeMacros({ protein: num(s.protein), calories: num(s.calories), carbs: num(s.carbohydrate), fat: num(s.fat) });
    if (!perServing) continue;
    const k = 100 / amount;
    return {
      id: `fatsecret:${str(food.food_id) || barcode}`,
      provider: 'fatsecret',
      name: str(food.food_name, 80) || 'Product',
      brand: str(food.brand_name, 60) || null,
      barcode,
      quality: 'label',
      per100g: { proteinG: round1(perServing.proteinG * k), calories: Math.round(perServing.calories * k), carbsG: round1(perServing.carbsG * k), fatG: round1(perServing.fatG * k) },
      serving: { label: str(s.serving_description, 60) || `${amount} ${unit}`, grams: amount, macros: perServing },
    };
  }
  return null;
}
