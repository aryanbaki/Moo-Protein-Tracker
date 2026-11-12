/**
 * Cross-checking: never trust one source alone.
 *
 * 1. Internal consistency: do protein, carbs and fat add up to the calories
 *    (Atwater 4/4/9)? A record that doesn't is usually a typing or unit error.
 * 2. Agreement: when two independent sources describe the same product (same
 *    barcode) or the same generic food, do their numbers agree within what
 *    label rounding and legal tolerances allow?
 * 3. A named reliability level, from best to worst, that the UI shows and the
 *    photo model uses to decide whether to replace its own estimate.
 *
 * Pure and dependency-free; tolerances are documented in docs/food-data.md.
 */
import type { ReliabilityLevel } from '../../types';
import type { FoodItem, FoodProvider, Macros } from './types';

export type { ReliabilityLevel };

export const LEVEL_ORDER: ReliabilityLevel[] = ['verified', 'label', 'reference', 'community', 'label_photo', 'estimate'];

export type CheckCode =
  /** Second source confirms protein and calories. */
  | 'sources_agree'
  /** Second source disagrees on protein or calories beyond tolerance. */
  | 'sources_disagree'
  /** 4p + 4c + 9f is far from the declared calories. */
  | 'energy_mismatch'
  /** Protein + carbs + fat exceed the weight of the food. */
  | 'impossible_mass'
  /** Only one source had this food. */
  | 'single_source'
  /** Second source's numbers look like per-serving values stored as per-100 g (or the reverse). */
  | 'basis_mismatch'
  /** The second source copied its numbers from the first, so agreement proves nothing. */
  | 'not_independent';

export interface Reliability {
  level: ReliabilityLevel;
  /** Every provider that returned this food, primary first. */
  sources: FoodProvider[];
  checks: CheckCode[];
  /** Protein per 100 g from each agreeing/disagreeing source, for display ("31 g · 30 g"). */
  proteinBySource?: { provider: FoodProvider; proteinPer100g: number }[];
}

/**
 * Tolerances. Protein on US labels is rounded to the nearest gram and may
 * legally read up to 20% above the true amount (FDA Class II nutrient: the
 * product must contain ≥ 80% of the declared value). Calories round to 5/10 kcal
 * and may be ≤ 120% of declared. Values are compared per 100 g.
 */
export const TOLERANCE = {
  /** Absolute slack for protein, g per 100 g (rounding of a small serving scales up per 100 g). */
  proteinAbsG: 2,
  /** Relative slack for protein. */
  proteinRel: 0.2,
  /** Absolute slack for calories per 100 g. */
  caloriesAbs: 20,
  /** Relative slack for calories. */
  caloriesRel: 0.2,
  /** Atwater check: declared vs computed kcal may differ by this fraction… */
  atwaterRel: 0.25,
  /** …or this many kcal per 100 g, whichever is larger (fiber, polyols, alcohol and rounding). */
  atwaterAbs: 30,
};

export function within(a: number, b: number, abs: number, rel: number): boolean {
  return Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
}

/** True when the macros roughly add up to the calories. Unknown (zero-calorie or no-macro) records pass. */
export function energyConsistent(m: Macros): boolean {
  const computed = 4 * m.proteinG + 4 * m.carbsG + 9 * m.fatG;
  if (m.calories <= 0 || computed <= 0) return true;
  return within(m.calories, computed, TOLERANCE.atwaterAbs, TOLERANCE.atwaterRel);
}

/** Protein + carbs + fat cannot exceed 100 g per 100 g (with 5 g rounding slack). */
export function massPossible(m: Macros): boolean {
  return m.proteinG + m.carbsG + m.fatG <= 105;
}

/** Problems with one record on its own. */
export function internalChecks(food: FoodItem): CheckCode[] {
  const m = food.per100g;
  if (!m) return [];
  const out: CheckCode[] = [];
  if (!energyConsistent(m)) out.push('energy_mismatch');
  if (!massPossible(m)) out.push('impossible_mass');
  return out;
}

export interface Agreement {
  protein: boolean;
  calories: boolean;
  /** b looks like a per-serving value stored as per-100 g (or the reverse). */
  basisMismatch: boolean;
}

/** Compares two records' per-100 g numbers. Null when either lacks per-100 g data. */
export function compare(a: FoodItem, b: FoodItem): Agreement | null {
  const x = a.per100g;
  const y = b.per100g;
  if (!x || !y) return null;
  const protein = within(x.proteinG, y.proteinG, TOLERANCE.proteinAbsG, TOLERANCE.proteinRel);
  const calories = within(x.calories, y.calories, TOLERANCE.caloriesAbs, TOLERANCE.caloriesRel);
  let basisMismatch = false;
  const g = a.serving?.grams ?? b.serving?.grams ?? null;
  if (!protein && g && g > 0 && g !== 100) {
    // Would scaling one side by serving/100 make them agree? Then one was stored on the wrong basis.
    const k = g / 100;
    basisMismatch =
      within(x.proteinG * k, y.proteinG, TOLERANCE.proteinAbsG, TOLERANCE.proteinRel) ||
      within(x.proteinG, y.proteinG * k, TOLERANCE.proteinAbsG, TOLERANCE.proteinRel);
  }
  return { protein, calories, basisMismatch };
}

function baseLevel(food: FoodItem): ReliabilityLevel {
  return food.quality === 'label' ? 'label' : food.quality === 'reference' ? 'reference' : 'community';
}

/** Lower is better. */
function rank(level: ReliabilityLevel): number {
  return LEVEL_ORDER.indexOf(level);
}

/** One level worse (used when a record fails its own consistency checks). */
function demote(level: ReliabilityLevel): ReliabilityLevel {
  return LEVEL_ORDER[Math.min(LEVEL_ORDER.length - 1, rank(level) + 1)]!;
}

/**
 * Cross-checks candidate records for the SAME food (e.g. one barcode from
 * several providers). Picks the record to show and attaches its reliability:
 *
 * - Prefer a record that passes its own checks; among those, manufacturer
 *   label data over lab reference over community data.
 * - If another provider agrees on protein and calories → `verified`.
 * - If they disagree → keep the preferred record's level, flag the conflict.
 * - A record failing its own checks drops one level.
 */
export function crossCheck(candidates: FoodItem[]): FoodItem | null {
  const foods = candidates.filter((f) => f.per100g || f.serving);
  if (foods.length === 0) return null;

  const scored = foods
    .map((f, i) => {
      const issues = internalChecks(f);
      const level = issues.length ? demote(baseLevel(f)) : baseLevel(f);
      return { f, i, issues, level };
    })
    .sort((a, b) => a.issues.length - b.issues.length || rank(a.level) - rank(b.level) || a.i - b.i);

  const primary = scored[0]!;
  const others = scored.slice(1).filter((o) => o.f.provider !== primary.f.provider);
  const checks: CheckCode[] = [...primary.issues];
  let level = primary.level;
  const proteinBySource: Reliability['proteinBySource'] = [];
  if (primary.f.per100g) proteinBySource.push({ provider: primary.f.provider, proteinPer100g: primary.f.per100g.proteinG });

  if (others.length === 0) {
    checks.push('single_source');
  } else {
    let agreed = false;
    let disagreed = false;
    for (const o of others) {
      const cmp = compare(primary.f, o.f);
      const independent = !(o.f.derivedFrom ?? []).includes(primary.f.provider) && !(primary.f.derivedFrom ?? []).includes(o.f.provider);
      if (o.f.per100g) proteinBySource.push({ provider: o.f.provider, proteinPer100g: o.f.per100g.proteinG });
      if (!cmp) continue;
      if (cmp.protein && cmp.calories && o.issues.length === 0) {
        if (independent) agreed = true;
        else checks.push('not_independent');
      } else disagreed = true;
      if (cmp.basisMismatch) checks.push('basis_mismatch');
    }
    if (agreed && primary.issues.length === 0) {
      level = 'verified';
      checks.push('sources_agree');
    } else if (disagreed) {
      checks.push('sources_disagree');
    } else {
      checks.push('single_source');
    }
  }

  const sources = [primary.f.provider, ...others.map((o) => o.f.provider)].filter((p, i, a) => a.indexOf(p) === i);
  return { ...primary.f, reliability: { level, sources, checks: [...new Set(checks)], proteinBySource } };
}

/** Reliability for a lone record (search results): its own checks only. */
export function selfCheck(food: FoodItem): FoodItem {
  const issues = internalChecks(food);
  const level = issues.length ? demote(baseLevel(food)) : baseLevel(food);
  return { ...food, reliability: { level, sources: [food.provider], checks: [...issues, 'single_source'] } };
}

/**
 * Cross-checks a mixed list from several providers: records sharing a barcode
 * are merged into one cross-checked record; the rest are self-checked.
 * Order follows the first appearance of each food.
 */
export function checkAll(foods: FoodItem[]): FoodItem[] {
  const groups = new Map<string, FoodItem[]>();
  const order: (string | FoodItem)[] = [];
  for (const f of foods) {
    const key = f.barcode ? f.barcode.replace(/^0+/, '') : null;
    if (!key) {
      order.push(f);
      continue;
    }
    const g = groups.get(key);
    if (g) g.push(f);
    else {
      groups.set(key, [f]);
      order.push(key);
    }
  }
  const out: FoodItem[] = [];
  for (const o of order) {
    if (typeof o !== 'string') out.push(selfCheck(o));
    else {
      const g = groups.get(o)!;
      const merged = g.length > 1 ? crossCheck(g) : selfCheck(g[0]!);
      if (merged) out.push(merged);
    }
  }
  return out;
}
