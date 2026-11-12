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
}

export const MAX_ITEMS = 12;
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
