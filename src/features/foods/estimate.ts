/**
 * Camera → protein. The photo analyser names each food and estimates how much
 * of it there is; this module turns that into protein grams using the most
 * reliable route available, best first:
 *
 *   1. barcode     digits readable in the photo → database label data (cross-checked)
 *   2. label_photo a visible nutrition label → its per-serving numbers × servings
 *                  (confirmed when a database record for the product agrees)
 *   3. package     brand + product recognised → database label data × servings
 *   4. density     whole food → protein per 100 g (bundled USDA table, else a
 *                  live USDA match) × estimated grams, with a low–high range
 *   5. model       the analyser's own guess, widened, as a last resort
 *
 * The analyser's own protein number is never thrown away: on routes 3–4 it is
 * a sanity check, and when it disagrees badly the range is widened to cover it
 * and confidence drops. Pure apart from the injected lookups; never throws.
 */
import type { ReliabilityLevel, ScannedItem } from '../../types';
import type { CleanItem, PhotoHints } from '../scan/sanitize';
import { displayName } from './toScan';
import { macrosForServings, round1, scaleMacros } from './nutrients';
import { matchReference, type ReferenceMatch } from './reference';
import { foods, type BarcodeResult } from './service';
import type { FoodItem, Macros } from './types';
import { within } from './verify';

export type EstimateBasis = 'barcode' | 'label_photo' | 'package' | 'reference_density' | 'database_density' | 'model';

export type EstimateNote =
  /** The analyser's own protein guess agrees with the computed value. */
  | 'model_agrees'
  /** …or disagrees by more than MODEL_AGREEMENT; the range was widened to include it. */
  | 'model_disagrees'
  /** A raw↔cooked conversion was applied. */
  | 'cook_converted'
  /** Meat/fish without a stated cook state was assumed cooked. */
  | 'assumed_cooked'
  /** The label photo and the database record for the product agree. */
  | 'label_matches_database'
  /** …or disagree; the label in the photo was kept. */
  | 'label_differs_from_database'
  /** No portion weight: a typical portion was used. */
  | 'typical_portion';

export interface ProteinEstimate extends ScannedItem {
  proteinRange: { lowG: number; highG: number };
  reliability: ReliabilityLevel;
  basis: EstimateBasis;
  notes: EstimateNote[];
  /** The database record used, when one was. */
  food?: FoodItem;
}

export interface EstimateDeps {
  lookupBarcode: (code: string) => Promise<BarcodeResult>;
  bestMatch: (name: string, opts?: { packaged?: boolean }) => Promise<FoodItem | null>;
  reference: (query: string, cookState: PhotoHints['cookState']) => ReferenceMatch | null;
}

/**
 * Tuning. Model agreement: a computed value within ±35% of the analyser's own
 * guess counts as agreement. Model-only results get a ±40% range. Label rounding
 * allows ±1 g plus 20% (see verify.ts TOLERANCE).
 */
export const MODEL_AGREEMENT = 0.35;
export const MODEL_ONLY_SPREAD = 0.4;
/** Range used when the analyser gave a weight but no low/high: ±25%. */
export const DEFAULT_GRAMS_SPREAD = 0.25;

/** Confidence shown on the result sheet for each route (before adjustments). */
const BASE_CONFIDENCE: Record<EstimateBasis, number> = {
  barcode: 0.95,
  label_photo: 0.9,
  package: 0.85,
  reference_density: 0.7,
  database_density: 0.62,
  model: 0.45,
};

const MEATY = /\b(chicken|beef|steak|pork|turkey|lamb|salmon|tuna|cod|fish|shrimp|prawn|tilapia|ham|bacon|sausage|mince|burger|patty|meatball|duck|venison|tofu|tempeh|seitan)\b/;

function clamp01(n: number): number {
  return Math.max(0.05, Math.min(0.99, Math.round(n * 100) / 100));
}

function toItem(name: string, portion: string, m: Macros, confidence: number): ScannedItem {
  return { name: name.slice(0, 80), portion: portion.slice(0, 60), proteinG: round1(m.proteinG), calories: Math.round(m.calories), carbsG: round1(m.carbsG), fatG: round1(m.fatG), confidence: clamp01(confidence) };
}

/** Widens [low, high] to include the analyser's guess when they disagree; returns the note. */
function checkAgainstModel(computedG: number, modelG: number, range: { lowG: number; highG: number }): { range: { lowG: number; highG: number }; note: EstimateNote | null } {
  if (!(modelG > 0) || !(computedG > 0)) return { range, note: null };
  if (within(computedG, modelG, 2, MODEL_AGREEMENT)) return { range, note: 'model_agrees' };
  return { range: { lowG: Math.min(range.lowG, modelG), highG: Math.max(range.highG, modelG) }, note: 'model_disagrees' };
}

function servingsOf(h: PhotoHints | undefined): number {
  return h?.servings && h.servings > 0 ? h.servings : 1;
}

function servingPortion(food: FoodItem, servings: number): string {
  const label = food.serving?.label ?? '100 g';
  return servings === 1 ? label : `${servings} × ${label}`;
}

/** Route 1/3: a database record × servings. */
export function fromFood(item: CleanItem, food: FoodItem, basis: 'barcode' | 'package'): ProteinEstimate | null {
  const servings = servingsOf(item.hints);
  const m = macrosForServings(food, servings);
  if (!m) return null;
  const notes: EstimateNote[] = [];
  let range = { lowG: m.proteinG, highG: m.proteinG };
  let confidence = BASE_CONFIDENCE[basis];
  if (basis === 'package') {
    const check = checkAgainstModel(m.proteinG, item.proteinG, range);
    range = check.range;
    if (check.note) notes.push(check.note);
    if (check.note === 'model_disagrees') confidence -= 0.15;
  }
  const level: ReliabilityLevel = food.reliability?.level ?? (food.quality === 'label' ? 'label' : food.quality === 'reference' ? 'reference' : 'community');
  if (level === 'verified') confidence += 0.02;
  return { ...toItem(displayName(food), servingPortion(food, servings), m, confidence), proteinRange: range, reliability: level, basis, notes, food };
}

/** Route 2: numbers read off a label in the photo, optionally confirmed by a database record. */
export function fromLabel(item: CleanItem, dbFood: FoodItem | null): ProteinEstimate | null {
  const h = item.hints;
  const label = h?.label;
  if (!h || !label || label.proteinG === null) return null;
  const servings = servingsOf(h);
  const perServing: Macros = { proteinG: label.proteinG, calories: label.calories ?? 0, carbsG: label.carbsG ?? 0, fatG: label.fatG ?? 0 };
  const m = scaleMacros(perServing, servings);
  const notes: EstimateNote[] = [];
  let level: ReliabilityLevel = 'label_photo';
  let confidence = BASE_CONFIDENCE.label_photo;
  // Cross-check the label reading against the product's database record (per serving, so serving sizes must match).
  const dbServing = dbFood?.serving;
  if (dbServing && (label.servingSizeG === null || dbServing.grams === null || within(label.servingSizeG, dbServing.grams, 2, 0.1))) {
    if (within(label.proteinG, dbServing.macros.proteinG, 1, 0.2)) {
      notes.push('label_matches_database');
      level = 'verified';
      confidence = 0.97;
    } else {
      notes.push('label_differs_from_database');
      confidence -= 0.1;
    }
  }
  const name = [h.brand, h.product].filter(Boolean).join(' ') || item.name;
  const serving = label.servingText || (label.servingSizeG ? `${label.servingSizeG} g` : '1 serving');
  const portion = servings === 1 ? serving : `${servings} × ${serving}`;
  // Label protein is rounded to the nearest gram per serving: ±0.5 g per serving.
  const range = { lowG: round1(Math.max(0, (label.proteinG - 0.5) * servings)), highG: round1((label.proteinG + 0.5) * servings) };
  return { ...toItem(name, portion, m, confidence), proteinRange: range, reliability: level, basis: 'label_photo', notes, ...(dbFood ? { food: dbFood } : {}) };
}

/** Grams for the portion: the analyser's estimate, else a typical portion from the reference table. */
function portionGrams(item: CleanItem, ref: ReferenceMatch | null): { grams: number; low: number; high: number; typical: boolean } | null {
  const h = item.hints;
  if (h?.grams) {
    const low = h.gramsLow ?? h.grams * (1 - DEFAULT_GRAMS_SPREAD);
    const high = h.gramsHigh ?? h.grams * (1 + DEFAULT_GRAMS_SPREAD);
    return { grams: h.grams, low, high, typical: false };
  }
  const t = ref?.food.typicalPortion;
  if (t) return { grams: t.grams, low: t.grams * 0.6, high: t.grams * 1.5, typical: true };
  return null;
}

/** Route 4: protein density × grams. */
export function fromDensity(item: CleanItem, per100g: Macros, basis: 'reference_density' | 'database_density', ref: ReferenceMatch | null, extraNotes: EstimateNote[] = []): ProteinEstimate | null {
  const g = portionGrams(item, ref);
  if (!g) return null;
  const k = g.grams / 100;
  const m = scaleMacros(per100g, k);
  const notes: EstimateNote[] = [...extraNotes];
  if (g.typical) notes.push('typical_portion');
  // Weight uncertainty × density uncertainty (only when USDA's own records for the food disagree).
  const dLow = Math.min(per100g.proteinG, ref?.proteinRange100g?.lowG ?? per100g.proteinG);
  const dHigh = Math.max(per100g.proteinG, ref?.proteinRange100g?.highG ?? per100g.proteinG);
  let range = { lowG: round1((dLow * g.low) / 100), highG: round1((dHigh * g.high) / 100) };
  let confidence = BASE_CONFIDENCE[basis];
  if (dHigh > dLow * 1.1) confidence -= 0.08;
  // Narrow portion ranges earn confidence; wide ones lose it.
  const spread = (g.high - g.low) / Math.max(g.grams, 1);
  confidence += spread < 0.3 ? 0.08 : spread > 0.8 ? -0.12 : 0;
  if (g.typical) confidence -= 0.15;
  const check = checkAgainstModel(m.proteinG, item.proteinG, range);
  range = check.range;
  if (check.note) notes.push(check.note);
  confidence += check.note === 'model_agrees' ? 0.07 : check.note === 'model_disagrees' ? -0.15 : 0;
  const portion = item.portion && /\d/.test(item.portion) ? item.portion : `about ${Math.round(g.grams)} g`;
  return { ...toItem(item.name, portion, m, Math.min(confidence, 0.85)), proteinRange: range, reliability: 'estimate', basis, notes };
}

/** Route 5: the analyser's own numbers with a wide range. */
export function modelOnly(item: CleanItem): ProteinEstimate {
  const spread = MODEL_ONLY_SPREAD + (1 - item.confidence) * 0.2;
  return {
    ...toItem(item.name, item.portion, item, Math.min(item.confidence, 0.6)),
    proteinRange: { lowG: round1(item.proteinG * (1 - spread)), highG: round1(item.proteinG * (1 + spread)) },
    reliability: 'estimate',
    basis: 'model',
    notes: [],
  };
}

async function safe<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}

/** Runs the routes in order for one item; never throws. */
export async function estimateItem(item: CleanItem, deps: EstimateDeps): Promise<ProteinEstimate> {
  const h = item.hints;
  if (!h) return modelOnly(item);

  // 1. Barcode digits in the photo.
  if (h.barcode) {
    const r = await safe(deps.lookupBarcode(h.barcode));
    if (r?.status === 'found') {
      const viaLabel = h.label ? fromLabel(item, r.food) : null;
      // A label in the photo that the database confirms is the best answer; otherwise the database record.
      if (viaLabel && viaLabel.reliability === 'verified') return viaLabel;
      const viaFood = fromFood(item, r.food, 'barcode');
      if (viaFood) return viaFood;
    }
  }

  const packagedName = [h.brand, h.product].filter(Boolean).join(' ');

  // 2. A readable nutrition label.
  if (h.label && h.label.proteinG !== null) {
    const db = packagedName.length >= 3 ? await safe(deps.bestMatch(packagedName, { packaged: true })) : null;
    const viaLabel = fromLabel(item, db);
    if (viaLabel) return viaLabel;
  }

  // 3. A recognised package.
  if ((h.kind === 'packaged' || h.kind === 'drink') && h.brand && packagedName.length >= 3) {
    const db = await safe(deps.bestMatch(packagedName, { packaged: true }));
    const viaFood = db ? fromFood(item, db, 'package') : null;
    if (viaFood) return viaFood;
  }

  // 4. Whole foods (and drinks/dishes the tables know): density × grams.
  if (h.kind !== 'packaged') {
    const query = h.dbQuery || item.name;
    let cook = h.cookState;
    const notes: EstimateNote[] = [];
    if (cook === 'unknown' && MEATY.test(query.toLowerCase())) {
      cook = 'cooked';
      notes.push('assumed_cooked');
    }
    // The table describes single foods; a dish that merely contains one (a chicken salad) must not borrow its density.
    const ref = h.kind === 'mixed_dish' ? null : deps.reference(query, cook);
    if (ref) {
      const est = fromDensity(item, ref.per100g, 'reference_density', ref, ref.converted ? [...notes, 'cook_converted'] : notes);
      if (est) return est;
    }
    // Mixed dishes vary too much for one database row; they keep the analyser's estimate.
    if (h.kind !== 'mixed_dish') {
      const db = await safe(deps.bestMatch(query, { packaged: false }));
      if (db?.per100g) {
        const est = fromDensity(item, db.per100g, 'database_density', null, notes);
        if (est) return { ...est, food: db };
      }
    }
  }

  // 5. Nothing better: the analyser's own guess.
  return modelOnly(item);
}

/** All items in parallel. */
export function estimateAll(items: CleanItem[], deps: EstimateDeps): Promise<ProteinEstimate[]> {
  return Promise.all(items.map((i) => estimateItem(i, deps)));
}

/** Database lookups during a photo scan give up after this long and fall back to the next route. */
export const LOOKUP_TIMEOUT_MS = 4000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error('lookup failed'));
      },
    );
  });
}

/** Default lookups: the shared food service (time-limited) and the bundled table. */
export function defaultEstimateDeps(svc: { lookupBarcode: EstimateDeps['lookupBarcode']; bestMatch: EstimateDeps['bestMatch'] } = foods()): EstimateDeps {
  return {
    lookupBarcode: (code) => withTimeout(svc.lookupBarcode(code), LOOKUP_TIMEOUT_MS),
    bestMatch: (name, opts) => withTimeout(svc.bestMatch(name, opts), LOOKUP_TIMEOUT_MS),
    reference: (q, c) => matchReference(q, c),
  };
}

/**
 * The photo flow's entry point: refines analyser items into result-sheet items
 * carrying a protein range and a reliability level. Never throws.
 */
export async function refineWithDatabases(items: CleanItem[], deps: EstimateDeps = defaultEstimateDeps()): Promise<ScannedItem[]> {
  const out = await estimateAll(items, deps);
  return out.map(({ name, portion, proteinG, calories, carbsG, fatG, confidence, proteinRange, reliability }) => ({ name, portion, proteinG, calories, carbsG, fatG, confidence, proteinRange, reliability }));
}
