/** Entry form parsing and validation. Pure; the entry screen renders the messages inline. */
import type { NewFoodEntry } from '../../types';

export interface EntryFormValues {
  name: string;
  protein: string;
  calories: string;
  carbs: string;
  fat: string;
}

export type EntryFormErrors = Partial<Record<keyof EntryFormValues, string>>;
export type EntryFormMode = 'quick' | 'manual';

export const LIMITS = { protein: 500, calories: 10000, carbs: 1000, fat: 1000 } as const;
export const emptyForm = (): EntryFormValues => ({ name: '', protein: '', calories: '', carbs: '', fat: '' });

/**
 * "" → null (left blank); "12,5" or "12.5" → 12.5; anything that is not a
 * plain non-negative decimal → NaN.
 */
export function parseAmount(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return Number.NaN;
  return Number(t);
}

/** Keep only what a decimal field may contain, as the user types. */
export function sanitizeAmountInput(text: string, maxLength = 6): string {
  let seenDot = false;
  let out = '';
  for (const ch of text.replace(/,/g, '.')) {
    if (ch >= '0' && ch <= '9') out += ch;
    else if (ch === '.' && !seenDot) {
      seenDot = true;
      out += ch;
    }
  }
  return out.slice(0, maxLength);
}

function check(text: string, label: string, max: number, unit: string, required: boolean): { value: number; error?: string } {
  const n = parseAmount(text);
  if (n === null) return required ? { value: 0, error: `Add the ${label}.` } : { value: 0 };
  if (Number.isNaN(n)) return { value: 0, error: `${label[0]!.toUpperCase()}${label.slice(1)} needs to be a number.` };
  if (n > max) return { value: 0, error: `Over ${max.toLocaleString('en-US')}${unit} in one go? Check that number.` };
  return { value: n };
}

export type EntryFormResult =
  | { ok: true; entry: Pick<NewFoodEntry, 'name' | 'proteinG' | 'calories' | 'carbsG' | 'fatG'> }
  | { ok: false; errors: EntryFormErrors };

export function validateEntryForm(v: EntryFormValues, mode: EntryFormMode): EntryFormResult {
  const errors: EntryFormErrors = {};
  const protein = check(v.protein, 'protein grams', LIMITS.protein, ' g', true);
  const calories = check(v.calories, 'calories', LIMITS.calories, '', false);
  const carbs = check(v.carbs, 'carbs', LIMITS.carbs, ' g', false);
  const fat = check(v.fat, 'fat', LIMITS.fat, ' g', false);
  if (protein.error) errors.protein = protein.error;
  else if (mode === 'quick' && protein.value <= 0) errors.protein = 'Tap in some grams first.';
  if (calories.error) errors.calories = calories.error;
  if (carbs.error) errors.carbs = carbs.error;
  if (fat.error) errors.fat = fat.error;
  const name = v.name.replace(/\s+/g, ' ').trim();
  if (mode === 'manual' && !name) errors.name = 'Give it a name. "Mystery meat" works.';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, entry: { name, proteinG: protein.value, calories: calories.value, carbsG: carbs.value, fatG: fat.value } };
}

/** Number → field text, without a trailing ".0". Zero becomes blank for optional fields. */
export function amountToText(n: number, blankZero = false): string {
  if (!Number.isFinite(n) || (blankZero && n === 0)) return '';
  return String(Math.round(n * 10) / 10);
}

/* ---- Quick-add keypad ---- */

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'back';

/** Apply one keypad press to the gram text. Max 3 whole digits and 1 decimal. */
export function pressKey(text: string, key: KeypadKey): string {
  if (key === 'back') return text.slice(0, -1);
  if (key === '.') return text.includes('.') ? text : `${text || '0'}.`;
  const [whole = '', frac] = text.split('.');
  if (frac !== undefined) return frac.length >= 1 ? text : text + key;
  if (whole === '0') return key;
  return whole.length >= 3 ? text : text + key;
}

/** Add a chip amount (+10/+20/+30) to the gram text, capped at the protein limit. */
export function addGrams(text: string, grams: number): string {
  const current = parseAmount(text);
  const base = current === null || Number.isNaN(current) ? 0 : current;
  return amountToText(Math.min(LIMITS.protein, base + grams));
}
