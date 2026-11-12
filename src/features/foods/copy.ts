/** Words and small formatting for the food search screen. */
import { round1 } from './nutrients';
import { displayName } from './toScan';
import type { FoodItem } from './types';

export const SOURCE_LABEL: Record<FoodItem['quality'], string> = {
  label: 'USDA · brand label',
  reference: 'USDA · lab data',
  community: 'Open Food Facts',
};

export const SEARCH_ERRORS: Record<'offline' | 'server' | 'rate_limited', string> = {
  offline: "Can't reach the food databases. Check your connection.",
  server: "The food databases didn't answer. Try again in a moment.",
  rate_limited: 'Lots of searching! Give it a minute and try again.',
};

/** "24 g protein · 1 scoop (31 g)" or "31 g protein · per 100 g". */
export function proteinLine(food: FoodItem): string {
  if (food.serving) return `${round1(food.serving.macros.proteinG)} g protein · ${food.serving.label}`;
  if (food.per100g) return `${round1(food.per100g.proteinG)} g protein · per 100 g`;
  return 'No numbers';
}

export function resultA11yLabel(food: FoodItem): string {
  return `${displayName(food)}. ${proteinLine(food)}. Source: ${SOURCE_LABEL[food.quality]}.`;
}
