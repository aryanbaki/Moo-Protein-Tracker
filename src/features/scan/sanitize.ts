/**
 * Pure clean-up of analyser output. Dependency-free on purpose: an identical
 * copy lives in supabase/functions/_shared/sanitize.ts for the Edge Function
 * (Deno cannot import from src/). A Jest test asserts the two stay in sync.
 */
export interface CleanItem {
  name: string;
  portion: string;
  proteinG: number;
  calories: number;
  carbsG: number;
  fatG: number;
  /** 0..1 */
  confidence: number;
  /** Extra clues for the protein model (src/features/foods/estimate.ts). Absent from older analysers. */
  hints?: PhotoHints;
}

/** What kind of thing the photo shows; decides how protein is worked out. */
export type FoodKind = 'packaged' | 'whole_food' | 'mixed_dish' | 'drink';
/** Raw or cooked weight matters: cooked meat has about a third more protein per gram than raw. */
export type CookState = 'raw' | 'cooked' | 'not_applicable' | 'unknown';

/** Numbers read off a visible nutrition-facts label, per one label serving. */
export interface LabelReading {
  servingText: string;
  servingSizeG: number | null;
  proteinG: number | null;
  calories: number | null;
  carbsG: number | null;
  fatG: number | null;
}

export interface PhotoHints {
  kind: FoodKind;
  /** Best guess, and a plausible low/high, of the edible weight in the photo, in grams (ml for drinks). */
  grams: number | null;
  gramsLow: number | null;
  gramsHigh: number | null;
  cookState: CookState;
  /** Printed on the package, if visible; '' otherwise. */
  brand: string;
  product: string;
  /** Barcode digits readable in the photo. */
  barcode: string | null;
  /** Short generic name for a food-composition lookup, e.g. "chicken breast roasted". */
  dbQuery: string;
  label: LabelReading | null;
  /** Label servings shown or eaten (e.g. 2 bars, 1.5 scoops). */
  servings: number | null;
}

export const MAX_ITEMS = 12;
const MAX_PORTION_GRAMS = 3000;
const KINDS: FoodKind[] = ['packaged', 'whole_food', 'mixed_dish', 'drink'];
const COOK_STATES: CookState[] = ['raw', 'cooked', 'not_applicable', 'unknown'];
const MAX_GRAMS = 500;
const MAX_CALORIES = 5000;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Finite number clamped to [min, max]; anything unusable becomes `fallback`. */
export function clampNumber(v: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim().slice(0, max);
}

function pick(o: Record<string, unknown>, snake: string, camel: string): unknown {
  return o[snake] !== undefined ? o[snake] : o[camel];
}

/** Positive finite number within [min, max], else null (null and absent stay null). */
function optNumber(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return round1(n);
}

function sanitizeLabel(raw: unknown): LabelReading | null {
  if (!isRecord(raw)) return null;
  const label: LabelReading = {
    servingText: cleanText(pick(raw, 'serving_text', 'servingText'), 60),
    servingSizeG: optNumber(pick(raw, 'serving_size_g', 'servingSizeG'), 0.1, MAX_PORTION_GRAMS),
    proteinG: optNumber(pick(raw, 'protein_g', 'proteinG'), 0, MAX_GRAMS),
    calories: optNumber(raw.calories, 0, MAX_CALORIES),
    carbsG: optNumber(pick(raw, 'carbs_g', 'carbsG'), 0, MAX_GRAMS),
    fatG: optNumber(pick(raw, 'fat_g', 'fatG'), 0, MAX_GRAMS),
  };
  // A label reading is only useful if it has protein or energy.
  return label.proteinG === null && label.calories === null ? null : label;
}

/** Hints are optional: returns undefined unless the item carries a `kind`. */
export function sanitizeHints(r: Record<string, unknown>): PhotoHints | undefined {
  const src = isRecord(r.hints) ? r.hints : r;
  const kind = src.kind;
  if (typeof kind !== 'string' || !KINDS.includes(kind as FoodKind)) return undefined;
  const cook = pick(src, 'cook_state', 'cookState');
  let grams = optNumber(src.grams, 0.5, MAX_PORTION_GRAMS);
  let low = optNumber(pick(src, 'grams_low', 'gramsLow'), 0.5, MAX_PORTION_GRAMS);
  let high = optNumber(pick(src, 'grams_high', 'gramsHigh'), 0.5, MAX_PORTION_GRAMS);
  if (low !== null && high !== null && low > high) [low, high] = [high, low];
  if (grams === null && low !== null && high !== null) grams = round1((low + high) / 2);
  if (grams !== null) {
    if (low !== null && low > grams) low = grams;
    if (high !== null && high < grams) high = grams;
  }
  const digits = cleanText(src.barcode, 20).replace(/[\s-]/g, '');
  return {
    kind: kind as FoodKind,
    grams,
    gramsLow: low,
    gramsHigh: high,
    cookState: typeof cook === 'string' && COOK_STATES.includes(cook as CookState) ? (cook as CookState) : 'unknown',
    brand: cleanText(src.brand, 60),
    product: cleanText(src.product, 80),
    barcode: /^\d{8}$|^\d{12,14}$/.test(digits) ? digits : null,
    dbQuery: cleanText(pick(src, 'db_query', 'dbQuery'), 80),
    label: sanitizeLabel(src.label),
    servings: optNumber(src.servings, 0.1, 20),
  };
}

/** Accepts snake_case (model output) or camelCase (function response) items. */
export function sanitizeItems(raw: unknown): CleanItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CleanItem[] = [];
  for (const r of raw) {
    if (!isRecord(r)) continue;
    const name = cleanText(r.name, 80);
    if (!name) continue;
    out.push({
      name,
      portion: cleanText(r.portion, 60) || '1 serving',
      proteinG: round1(clampNumber(pick(r, 'protein_g', 'proteinG'), 0, MAX_GRAMS)),
      calories: Math.round(clampNumber(r.calories, 0, MAX_CALORIES)),
      carbsG: round1(clampNumber(pick(r, 'carbs_g', 'carbsG'), 0, MAX_GRAMS)),
      fatG: round1(clampNumber(pick(r, 'fat_g', 'fatG'), 0, MAX_GRAMS)),
      confidence: Math.round(clampNumber(r.confidence, 0, 1, 0.5) * 100) / 100,
      ...((h) => (h ? { hints: h } : {}))(sanitizeHints(r)),
    });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

export type ParsedAnalysis = { ok: true; items: CleanItem[] } | { ok: false; error: 'no_food' | 'server' };

/**
 * Reads the `report_food` tool call out of an Anthropic Messages response.
 * No tool call (or a refusal) is a server-side failure; a tool call that says
 * "not food" or lists nothing usable is `no_food`.
 */
export function parseAnalysis(message: unknown, toolName: string): ParsedAnalysis {
  if (!isRecord(message) || message.stop_reason === 'refusal' || !Array.isArray(message.content)) {
    return { ok: false, error: 'server' };
  }
  const block = message.content.find((b) => isRecord(b) && b.type === 'tool_use' && b.name === toolName);
  if (!isRecord(block) || !isRecord(block.input)) return { ok: false, error: 'server' };
  const input = block.input;
  if (input.is_food === false) return { ok: false, error: 'no_food' };
  const items = sanitizeItems(input.items);
  if (items.length === 0) return { ok: false, error: 'no_food' };
  return { ok: true, items };
}
