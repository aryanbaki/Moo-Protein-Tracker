/** Deterministic demo analyser so the scan flow works with no keys or account. */
import type { ScannedItem } from '../../types';

const MEALS: ScannedItem[][] = [
  [
    { name: 'Grilled chicken breast', portion: '1 breast (about 150 g)', proteinG: 46, calories: 248, carbsG: 0, fatG: 5.4, confidence: 0.82 },
    { name: 'White rice', portion: '1 cup cooked', proteinG: 4.3, calories: 205, carbsG: 44.5, fatG: 0.4, confidence: 0.74 },
    { name: 'Steamed broccoli', portion: '1 cup', proteinG: 3.7, calories: 55, carbsG: 11.2, fatG: 0.6, confidence: 0.7 },
  ],
  [
    { name: 'Greek yogurt', portion: '1 bowl (about 200 g)', proteinG: 20, calories: 146, carbsG: 7.8, fatG: 3.8, confidence: 0.78 },
    { name: 'Granola', portion: '1/4 cup', proteinG: 3, calories: 120, carbsG: 18, fatG: 4.5, confidence: 0.55 },
    { name: 'Blueberries', portion: '1 handful', proteinG: 0.4, calories: 30, carbsG: 7.5, fatG: 0.2, confidence: 0.66 },
  ],
  [
    { name: 'Scrambled eggs', portion: '3 eggs', proteinG: 19, calories: 273, carbsG: 2, fatG: 20, confidence: 0.8 },
    { name: 'Buttered toast', portion: '2 slices', proteinG: 6, calories: 210, carbsG: 28, fatG: 8, confidence: 0.72 },
  ],
  [
    { name: 'Beef burrito', portion: '1 large burrito', proteinG: 32, calories: 690, carbsG: 78, fatG: 26, confidence: 0.42 },
  ],
  [
    { name: 'Salmon fillet', portion: '1 fillet (about 140 g)', proteinG: 31, calories: 290, carbsG: 0, fatG: 18, confidence: 0.77 },
    { name: 'Roast potatoes', portion: '1 cup', proteinG: 3, calories: 180, carbsG: 30, fatG: 6, confidence: 0.6 },
    { name: 'Green salad', portion: '1 side bowl', proteinG: 1.5, calories: 35, carbsG: 6, fatG: 0.5, confidence: 0.64 },
  ],
];

/** Small stable string hash (djb2). */
export function hashSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** Same seed, same meal. */
export function mockItems(seed: string): ScannedItem[] {
  const meal = MEALS[hashSeed(seed) % MEALS.length] ?? MEALS[0]!;
  return meal.map((i) => ({ ...i }));
}

export const MOCK_DELAY_MS = 1200;
