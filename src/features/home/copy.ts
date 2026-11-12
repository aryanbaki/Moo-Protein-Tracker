/** Home screen number formatting and the few words it needs. Pure, so it is easy to test. */
import { parseDay } from '../../lib/date';
import type { EntrySource } from '../../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function dayName(day: string): string {
  return DAY_NAMES[parseDay(day).getDay()]!;
}

export function dayLetter(day: string): string {
  return DAY_LETTERS[parseDay(day).getDay()]!;
}

/** Whole grams/calories with thousands separators: 1050 → "1,050". */
export function formatNumber(n: number): string {
  const rounded = Math.round(Number.isFinite(n) ? n : 0);
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Progress as 0..1 for bars; 0 when there is no goal. */
export function ratio(value: number, goal: number | null | undefined): number {
  if (!goal || !(goal > 0) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value / goal));
}

/** For screen readers only: "64 g to go", "Goal met", "Goal met, 12 g extra". */
export function remainingLine(value: number, goal: number): string {
  const left = Math.round(goal) - Math.round(value);
  if (left > 0) return `${formatNumber(left)} g to go`;
  if (left === 0) return 'Goal met';
  return `Goal met, ${formatNumber(-left)} g extra`;
}

/** Local clock time for an ISO timestamp: "8:05 AM". */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

/** For screen readers only. */
export const SOURCE_LABEL: Record<EntrySource, string> = { manual: 'typed in', quick: 'quick add', photo: 'photo scan', barcode: 'barcode scan' };

export type DotState = 'met' | 'partial' | 'empty' | 'future';

export function dotState(day: string, today: string, proteinG: number, goalG: number | null | undefined): DotState {
  if (day > today) return 'future';
  if (goalG && goalG > 0 && proteinG >= goalG) return 'met';
  return proteinG > 0 ? 'partial' : 'empty';
}
