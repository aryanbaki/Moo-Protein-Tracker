/** Adapters from database foods to the scan result shape the existing UI edits and saves. */
import type { ScannedItem } from '../../types';
import { macrosForServings, round1 } from './nutrients';
import type { FoodItem } from './types';

/** Confidence shown on the result sheet: label data is near-certain, community data a touch less. */
export const CONFIDENCE: Record<FoodItem['quality'], number> = { label: 0.95, reference: 0.9, community: 0.9 };

export function displayName(food: FoodItem): string {
  const { brand, name } = food;
  const full = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name;
  return full.slice(0, 80);
}

/** One label serving when known, else 100 g. The result sheet's servings stepper scales it. */
export function foodToScannedItem(food: FoodItem): ScannedItem {
  const useServing = !!food.serving;
  const macros = macrosForServings(food, 1) ?? { proteinG: 0, calories: 0, carbsG: 0, fatG: 0 };
  return {
    name: displayName(food),
    portion: useServing ? food.serving!.label.slice(0, 60) : '100 g',
    proteinG: round1(macros.proteinG),
    calories: Math.round(macros.calories),
    carbsG: round1(macros.carbsG),
    fatG: round1(macros.fatG),
    confidence: CONFIDENCE[food.quality],
    reliability: food.reliability?.level ?? (food.quality === 'label' ? 'label' : food.quality === 'reference' ? 'reference' : 'community'),
  };
}
