/** Pure maths for the result sheet: servings scaling, totals and the saved entry. */
import type { EntrySource, NewFoodEntry, ScannedItem } from '../../types';

export const MIN_SERVINGS = 0.5;
export const MAX_SERVINGS = 5;
export const SERVINGS_STEP = 0.5;

export interface EditableItem extends ScannedItem {
  key: string;
  /** Multiplier applied to the per-portion numbers. */
  servings: number;
}

export interface MacroTotals {
  proteinG: number;
  calories: number;
  carbsG: number;
  fatG: number;
}

export function toEditable(items: ScannedItem[]): EditableItem[] {
  return items.map((it, i) => ({ ...it, key: `${i}-${it.name}`, servings: 1 }));
}

/** Step servings up or down, snapped to 0.5 and kept within 0.5–5. */
export function stepServings(current: number, direction: 1 | -1): number {
  const next = Math.round((current + direction * SERVINGS_STEP) / SERVINGS_STEP) * SERVINGS_STEP;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, next));
}

export function scaled(item: EditableItem): MacroTotals {
  return {
    proteinG: item.proteinG * item.servings,
    calories: item.calories * item.servings,
    carbsG: item.carbsG * item.servings,
    fatG: item.fatG * item.servings,
  };
}

export function totalsOf(items: EditableItem[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (t, it) => {
      const s = scaled(it);
      return { proteinG: t.proteinG + s.proteinG, calories: t.calories + s.calories, carbsG: t.carbsG + s.carbsG, fatG: t.fatG + s.fatG };
    },
    { proteinG: 0, calories: 0, carbsG: 0, fatG: 0 },
  );
}

/** Lowest confidence across items (the weakest guess drives the hint). */
export function lowestConfidence(items: ScannedItem[]): number {
  return items.length ? Math.min(...items.map((i) => i.confidence)) : 1;
}

export function formatServings(n: number): string {
  return Number.isInteger(n) ? `${n}×` : `${n.toFixed(1)}×`;
}

/** The single log entry saved for a scan: joined names, rounded totals. */
export function entryFromItems(items: EditableItem[], source: Extract<EntrySource, 'photo' | 'barcode'>): NewFoodEntry {
  const t = totalsOf(items);
  const name = items.map((i) => i.name.trim()).filter(Boolean).join(', ') || 'Scanned food';
  return {
    name: name.length > 120 ? `${name.slice(0, 117)}…` : name,
    proteinG: Math.round(t.proteinG),
    calories: Math.round(t.calories),
    carbsG: Math.round(t.carbsG),
    fatG: Math.round(t.fatG),
    source,
  };
}
