import type { EntrySource, NewFoodEntry } from '../../types';

export const FALLBACK_NAMES: Record<EntrySource, string> = {
  quick: 'Quick add',
  manual: 'Food',
  photo: 'Scanned food',
  barcode: 'Scanned product',
};
export const MAX_NAME_LENGTH = 80;
const SOURCES: EntrySource[] = ['manual', 'quick', 'photo', 'barcode'];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Thrown when a mutation is given data that must not be stored. */
export class LogValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = 'LogValidationError';
  }
}

/** A stored amount: finite, not negative, kept to one decimal place. */
export function cleanAmount(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new LogValidationError(field, `${field} must be a number`);
  if (value < 0) throw new LogValidationError(field, `${field} cannot be negative`);
  return Math.round(value * 10) / 10;
}

export function cleanName(name: unknown, source: EntrySource): string {
  const trimmed = typeof name === 'string' ? name.replace(/\s+/g, ' ').trim() : '';
  return (trimmed || FALLBACK_NAMES[source]).slice(0, MAX_NAME_LENGTH);
}

export function isValidDay(day: unknown): day is string {
  if (typeof day !== 'string' || !DAY_RE.test(day)) return false;
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d, 12);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function cleanDay(day: unknown): string {
  if (!isValidDay(day)) throw new LogValidationError('day', 'day must be a real date in YYYY-MM-DD form');
  return day;
}

function cleanSource(source: unknown): EntrySource {
  if (!SOURCES.includes(source as EntrySource)) throw new LogValidationError('source', 'Unknown entry source');
  return source as EntrySource;
}

/** Validate and normalise a new entry. Throws LogValidationError on bad numbers, day or source. */
export function cleanNewEntry(e: NewFoodEntry): NewFoodEntry {
  const source = cleanSource(e.source);
  const out: NewFoodEntry = {
    name: cleanName(e.name, source),
    proteinG: cleanAmount(e.proteinG, 'proteinG'),
    calories: cleanAmount(e.calories, 'calories'),
    carbsG: cleanAmount(e.carbsG, 'carbsG'),
    fatG: cleanAmount(e.fatG, 'fatG'),
    source,
  };
  if (e.day !== undefined) out.day = cleanDay(e.day);
  return out;
}

/** Validate only the fields present in a patch. `fallbackSource` picks the name fallback. */
export function cleanPatch(patch: Partial<NewFoodEntry>, fallbackSource: EntrySource): Partial<NewFoodEntry> {
  const out: Partial<NewFoodEntry> = {};
  const source = patch.source !== undefined ? cleanSource(patch.source) : fallbackSource;
  if (patch.source !== undefined) out.source = source;
  if (patch.name !== undefined) out.name = cleanName(patch.name, source);
  if (patch.proteinG !== undefined) out.proteinG = cleanAmount(patch.proteinG, 'proteinG');
  if (patch.calories !== undefined) out.calories = cleanAmount(patch.calories, 'calories');
  if (patch.carbsG !== undefined) out.carbsG = cleanAmount(patch.carbsG, 'carbsG');
  if (patch.fatG !== undefined) out.fatG = cleanAmount(patch.fatG, 'fatG');
  if (patch.day !== undefined) out.day = cleanDay(patch.day);
  return out;
}
