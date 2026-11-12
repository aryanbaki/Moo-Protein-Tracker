/** Words for the scan flow. One short line per state, nothing more. */
export type ProblemCode = 'no_food' | 'offline' | 'server' | 'unauthorized' | 'not_found' | 'no_nutrition' | 'invalid';

/** Shown under the chewing cow while a scan runs. */
export const WORKING = 'Chewing';

export const PROBLEMS: Record<ProblemCode, string> = {
  no_food: 'No food found',
  offline: 'No connection',
  server: 'Scan failed',
  unauthorized: 'Sign in to scan',
  not_found: 'Product not found',
  no_nutrition: 'No nutrition data',
  invalid: 'Not a barcode',
};

export const OUT_OF_SCANS = 'No scans left';

/** Free photo scans remaining: "3 left". */
export function scansLeftLabel(left: number): string {
  return `${Math.max(0, Math.floor(left))} left`;
}

/** The same, spelled out for screen readers. */
export function scansLeftSpoken(left: number): string {
  const n = Math.max(0, Math.floor(left));
  return n === 1 ? '1 free photo scan left' : `${n} free photo scans left`;
}
