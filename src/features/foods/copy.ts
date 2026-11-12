/** Words and small formatting for the food search screen. */
import { LEVEL_LABEL } from './levels';
import { round1 } from './nutrients';
import { displayName } from './toScan';
import type { FoodItem, FoodProvider } from './types';

export const PROVIDER_NAME: Record<FoodProvider, string> = {
  usda: 'USDA',
  openfoodfacts: 'Open Food Facts',
  fatsecret: 'FatSecret',
};

/** "Verified · USDA + Open Food Facts", "Brand data · USDA". */
export function sourceLine(food: FoodItem): string {
  const level = food.reliability?.level ?? (food.quality === 'label' ? 'label' : food.quality === 'reference' ? 'reference' : 'community');
  const sources = (food.reliability?.sources ?? [food.provider]).map((p) => PROVIDER_NAME[p]).join(' + ');
  return `${LEVEL_LABEL[level]} · ${sources}`;
}

export const SEARCH_ERRORS: Record<'offline' | 'server' | 'rate_limited', string> = {
  offline: 'No connection',
  server: 'Search failed',
  rate_limited: 'Too many searches. Try again in a minute.',
};

/** "24 g protein · 1 scoop (31 g)" or "31 g protein · per 100 g". */
export function proteinLine(food: FoodItem): string {
  if (food.serving) return `${round1(food.serving.macros.proteinG)} g protein · ${food.serving.label}`;
  if (food.per100g) return `${round1(food.per100g.proteinG)} g protein · per 100 g`;
  return 'No numbers';
}

export function resultA11yLabel(food: FoodItem): string {
  return `${displayName(food)}. ${proteinLine(food)}. ${sourceLine(food)}.`;
}
