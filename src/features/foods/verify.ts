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
 * Pure and dependency-free; tolerances and their sources are in docs/food-data.md.
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
  /** Macros and calories don't quite add up (outside ±15%, inside ±30%): shown, not demoted. */
  | 'energy_warning'
  /** Macros and calories are far apart (outside ±30%): a data-entry error; demoted. */
  | 'energy_mismatch'
  /** A value is physically impossible (e.g. macros over 105 g per 100 g, over 935 kcal per 100 g). */
  | 'impossible_values'
  /** Per-100 g × serving weight does not reproduce the per-serving numbers. */
  | 'serving_mismatch'
  /** Only one source had this food. */
  | 'single_source'
  /** A source's numbers look like per-serving values stored as per-100 g (or the reverse). */
  | 'basis_mismatch'
  /** A source's calories look like kilojoules. */
  | 'kj_as_kcal'
  /** A source's numbers are off by a factor of ten. */
  | 'decimal_shift'
  /** The second source copied its numbers from the first, so agreement proves nothing. */
  | 'not_independent';

/** Checks that mean the record itself is wrong; it drops one reliability level. */
const ERRORS: CheckCode[] = ['energy_mismatch', 'impossible_values', 'serving_mismatch'];

export interface Reliability {
  level: ReliabilityLevel;
  /** Every provider that returned this food, primary first. */
  sources: FoodProvider[];
  checks: CheckCode[];
  /** Protein per 100 g from each agreeing/disagreeing source, for display ("31 g · 30 g"). */
  proteinBySource?: { provider: FoodProvider; proteinPer100g: number }[];
}

/** Providers whose records may confirm others but are never shown or logged themselves. */
export const VERIFY_ONLY: FoodProvider[] = ['fatsecret'];

/** Plain "a and b differ by at most max(abs, rel × the larger)". Used for simple comparisons. */
export function within(a: number, b: number, abs: number, rel: number): boolean {
  return Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
}

/**
 * How far two correct per-100 g protein values may differ (docs/food-data.md):
 * a band of 2 g below 10 g, 20% from 10–40 g (the FDA 80% floor for protein),
 * capped at 8 g above 40 g (EU guidance), plus label rounding: protein is
 * rounded to 1 g per serving, which is ±0.5 g × 100 / serving grams per 100 g.
 */
export function proteinTolerance(larger: number, servingG: number | null): number {
  const band = larger < 10 ? 2 : larger <= 40 ? 0.2 * larger : 8;
  const rounding = servingG && servingG > 0 ? Math.min((0.5 * 100) / servingG, 5) : 0.5;
  return band + rounding;
}

/**
 * Calories: max(20 kcal, 20%) (the FDA 120% ceiling), plus rounding to 5/10 kcal
 * per serving scaled to 100 g, plus 2 kcal per g of fibre (labels may count
 * fibre at 4, 2 or 0 kcal/g).
 */
export function calorieTolerance(larger: number, servingG: number | null, fiberG: number): number {
  const rounding = servingG && servingG > 0 ? Math.min((5 * 100) / servingG, 40) : 1;
  return Math.max(20, 0.2 * larger) + rounding + 2 * Math.max(0, fiberG);
}

export type EnergyVerdict = 'pass' | 'warn' | 'fail';

/**
 * Do the macros add up to the calories? Interval form, so fibre counted at 0–4
 * kcal/g and EU "available" vs US "total" carbohydrate both pass. Open Food
 * Facts' own thresholds: ±15% + 5 kcal passes, ±30% + 5 kcal warns, beyond fails.
 */
export function energyCheck(m: Macros, fiberG = 0, carbsMayExcludeFiber = false): EnergyVerdict {
  const fiber = Math.max(0, fiberG);
  const low = 4 * m.proteinG + 4 * Math.max(0, m.carbsG - fiber) + 9 * m.fatG;
  const high = 4 * m.proteinG + 4 * (m.carbsG + (carbsMayExcludeFiber ? fiber : 0)) + 9 * m.fatG;
  const e = m.calories;
  if (Math.max(e, high) <= 13) return 'pass';
  if (e >= 0.85 * low - 5 && e <= 1.15 * high + 5) return 'pass';
  if (e >= 0.7 * low - 5 && e <= 1.3 * high + 5) return 'warn';
  return 'fail';
}

/** True when the macros roughly add up to the calories (pass or warn). */
export function energyConsistent(m: Macros, fiberG = 0, carbsMayExcludeFiber = false): boolean {
  return energyCheck(m, fiberG, carbsMayExcludeFiber) !== 'fail';
}

/** Hard limits per 100 g: no macro over 105 g, their sum ≤ 105 g, ≤ 935 kcal, protein can't supply more energy than the total. */
export function massPossible(m: Macros): boolean {
  const each = m.proteinG <= 105 && m.carbsG <= 105 && m.fatG <= 105;
  const sum = m.proteinG + m.carbsG + m.fatG <= 105;
  const energy = m.calories <= 935;
  const proteinEnergy = m.calories <= 0 || 4 * m.proteinG <= 1.15 * m.calories + 5;
  return each && sum && energy && proteinEnergy;
}

/** Problems with one record on its own. */
export function internalChecks(food: FoodItem): CheckCode[] {
  const m = food.per100g;
  if (!m) return [];
  const out: CheckCode[] = [];
  const panel = food.panel ?? {};
  const fiber = panel.fiber ?? 0;
  // Open Food Facts mixes EU "available" carbohydrate (fibre excluded) with US totals.
  const verdict = energyCheck(m, fiber, food.provider === 'openfoodfacts');
  if (verdict === 'fail') out.push('energy_mismatch');
  else if (verdict === 'warn') out.push('energy_warning');
  const subOk = (panel.saturatedFat === undefined || panel.saturatedFat <= m.fatG + 0.5) && (panel.sugars === undefined || panel.sugars <= m.carbsG + 0.5);
  if (!massPossible(m) || !subOk) out.push('impossible_values');
  // Both a serving and per-100 g numbers: they must describe the same food.
  const s = food.serving;
  if (s?.grams && s.grams > 0) {
    const expected = (m.proteinG * s.grams) / 100;
    if (Math.abs(expected - s.macros.proteinG) > Math.max(1, 0.15 * Math.max(expected, s.macros.proteinG))) out.push('serving_mismatch');
  }
  return out;
}

export interface Agreement {
  protein: boolean;
  calories: boolean;
  /** Why they disagree, when a simple unit/basis slip explains it. */
  reason: 'basis_mismatch' | 'kj_as_kcal' | 'decimal_shift' | null;
  /** Kept for callers that only care about the per-serving case. */
  basisMismatch: boolean;
}

function smallestServing(a: FoodItem, b: FoodItem): number | null {
  const g = [a.serving?.grams, b.serving?.grams].filter((x): x is number => typeof x === 'number' && x > 0);
  return g.length ? Math.min(...g) : null;
}

function ratioNear(a: number, b: number, target: number): boolean {
  if (!(a > 0) || !(b > 0)) return false;
  const r = a / b;
  return Math.abs(r - target) <= 0.1 * target || Math.abs(1 / r - target) <= 0.1 * target;
}

/** Compares two records' per-100 g numbers. Null when either lacks per-100 g data. */
export function compare(a: FoodItem, b: FoodItem): Agreement | null {
  const x = a.per100g;
  const y = b.per100g;
  if (!x || !y) return null;
  const servingG = smallestServing(a, b);
  const fiber = Math.max(a.panel?.fiber ?? 0, b.panel?.fiber ?? 0);
  const protein = Math.abs(x.proteinG - y.proteinG) <= proteinTolerance(Math.max(x.proteinG, y.proteinG), servingG);
  const calories = Math.abs(x.calories - y.calories) <= calorieTolerance(Math.max(x.calories, y.calories), servingG, fiber);
  let reason: Agreement['reason'] = null;
  if (!protein || !calories) {
    const g = a.serving?.grams ?? b.serving?.grams ?? null;
    if (g && g > 0 && g !== 100 && (ratioNear(x.proteinG, y.proteinG, 100 / g) || ratioNear(x.calories, y.calories, 100 / g))) reason = 'basis_mismatch';
    else if (protein && ratioNear(x.calories, y.calories, 4.184)) reason = 'kj_as_kcal';
    else if (ratioNear(x.proteinG, y.proteinG, 10) || ratioNear(x.calories, y.calories, 10)) reason = 'decimal_shift';
  }
  return { protein, calories, reason, basisMismatch: reason === 'basis_mismatch' };
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
  // A verify-only source can confirm, never answer on its own.
  if (!foods.some((f) => !VERIFY_ONLY.includes(f.provider))) return null;

  const scored = foods
    .map((f, i) => {
      const found = internalChecks(f);
      const issues = found.filter((c) => ERRORS.includes(c));
      const level = issues.length ? demote(baseLevel(f)) : baseLevel(f);
      return { f, i, issues, warnings: found.filter((c) => !ERRORS.includes(c)), level };
    })
    .sort((a, b) => Number(VERIFY_ONLY.includes(a.f.provider)) - Number(VERIFY_ONLY.includes(b.f.provider)) || a.issues.length - b.issues.length || rank(a.level) - rank(b.level) || a.i - b.i);

  const primary = scored[0]!;
  const others = scored.slice(1).filter((o) => o.f.provider !== primary.f.provider);
  const checks: CheckCode[] = [...primary.issues, ...primary.warnings];
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
      if (cmp.reason) checks.push(cmp.reason);
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
  const found = internalChecks(food);
  const level = found.some((c) => ERRORS.includes(c)) ? demote(baseLevel(food)) : baseLevel(food);
  return { ...food, reliability: { level, sources: [food.provider], checks: [...found, 'single_source'] } };
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
