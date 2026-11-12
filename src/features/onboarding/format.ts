import type { GoalField } from '../goals';

/** 1000 -> "1,000". Deterministic (no locale lookups), so it is safe in tests. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** "08:00" -> "8:00 AM". */
export function formatTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map((p) => Number.parseInt(p, 10));
  const hour = ((h % 24) + 24) % 24;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Every half hour of the day as "HH:mm". */
export const HALF_HOUR_TIMES: readonly string[] = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`);

/** Evenly stepped numbers without floating-point crumbs: range(0.1, 0.5, 0.1). */
export function range(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const n = Math.floor((max - min) / step + 1e-9);
  for (let i = 0; i <= n; i++) out.push(Math.round((min + i * step) * 1000) / 1000);
  return out;
}

/** Value in `values` nearest to `target`. */
export function nearest(values: readonly number[], target: number): number {
  let best = values[0] ?? target;
  for (const v of values) if (Math.abs(v - target) < Math.abs(best - target)) best = v;
  return best;
}

export const GOAL_META: Record<GoalField, { label: string; unit: string; short: string }> = {
  proteinG: { label: 'Protein', unit: 'g', short: 'protein' },
  calories: { label: 'Calories', unit: 'kcal', short: 'calories' },
  carbsG: { label: 'Carbs', unit: 'g', short: 'carbs' },
  fatG: { label: 'Fat', unit: 'g', short: 'fat' },
};
