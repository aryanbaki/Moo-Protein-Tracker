/** Local calendar day as "YYYY-MM-DD". */
export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" as a local-time Date at noon (DST-safe). */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function addDays(day: string, n: number): string {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return localDay(d);
}

/** The 7 days (Mon..Sun or Sun..Sat) of the week containing `day`. */
export function weekDays(day: string, weekStartsOn: 0 | 1 = 1): string[] {
  const d = parseDay(day);
  const offset = (d.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(day, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
