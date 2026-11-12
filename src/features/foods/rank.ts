/** Pure merging and ranking of search results from several providers. */
import { sameBarcode } from './nutrients';
import type { FoodItem } from './types';

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9%]+/)
    .filter((t) => t.length > 1);
}

const QUALITY_BONUS: Record<FoodItem['quality'], number> = { label: 2, reference: 2, community: 1 };
/** When a cross-check ran, its level replaces the raw quality bonus. */
const LEVEL_BONUS: Record<string, number> = { verified: 3, label: 2, reference: 2, community: 1, label_photo: 0.5, estimate: 0 };

/** Higher is better. Exported for tests. */
export function scoreFood(food: FoodItem, query: string): number {
  const q = tokens(query);
  if (q.length === 0) return 0;
  const hay = new Set(tokens(`${food.brand ?? ''} ${food.name}`));
  const nameTokens = tokens(food.name);
  const hits = q.filter((t) => hay.has(t) || [...hay].some((h) => h.startsWith(t))).length;
  let score = (hits / q.length) * 10;
  if (hits === q.length) score += 3;
  // Short names that are mostly the query ("Chicken breast") beat long ones.
  score -= Math.max(0, nameTokens.length - q.length) * 0.15;
  score += food.reliability ? (LEVEL_BONUS[food.reliability.level] ?? 0) : QUALITY_BONUS[food.quality];
  if (food.serving) score += 0.5;
  return score;
}

function nameKey(f: FoodItem): string {
  return tokens(`${f.brand ?? ''} ${f.name}`).sort().join(' ');
}

/**
 * Removes duplicates across providers. Same barcode or same brand+name counts
 * as a duplicate; the earlier (higher-priority) record wins, so pass
 * manufacturer label data before community data.
 */
export function dedupeFoods(foods: FoodItem[]): FoodItem[] {
  const out: FoodItem[] = [];
  const names = new Set<string>();
  for (const f of foods) {
    const key = nameKey(f);
    if (names.has(key)) continue;
    if (f.barcode && out.some((o) => sameBarcode(o.barcode, f.barcode))) continue;
    names.add(key);
    out.push(f);
  }
  return out;
}

export function rankFoods(foods: FoodItem[], query: string, limit = 30): FoodItem[] {
  const priority = (f: FoodItem) => (f.provider === 'usda' ? 0 : 1);
  const ordered = [...foods].sort((a, b) => priority(a) - priority(b));
  return dedupeFoods(ordered)
    .map((f, i) => ({ f, s: scoreFood(f, query), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.f);
}
