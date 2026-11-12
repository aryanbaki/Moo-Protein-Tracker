/** Creatine helpers. Pure: derived from the check-off log, never stored. */
import { addDays, localDay } from '../../lib/date';
import type { CreatineLog } from '../../types';

export function isTakenOn(logs: CreatineLog[], day: string): boolean {
  return logs.some((l) => l.day === day);
}

export function isTakenToday(logs: CreatineLog[], today: string = localDay()): boolean {
  return isTakenOn(logs, today);
}

/** The last `n` days ending at `today`, oldest first. */
export function lastNDays(n: number, today: string = localDay()): string[] {
  const count = Math.max(0, Math.floor(n));
  return Array.from({ length: count }, (_, i) => addDays(today, i - (count - 1)));
}

export interface CreatineConsistency {
  taken: number;
  days: number;
  /** 0..1; 0 when `days` is 0. */
  ratio: number;
}

/**
 * How many of the last `n` days (ending today, inclusive) were checked off.
 * If `since` is given (e.g. the day creatine was switched on), earlier days
 * are not counted against the user.
 */
export function consistency(logs: CreatineLog[], n: number, today: string = localDay(), since?: string): CreatineConsistency {
  const window = lastNDays(n, today).filter((d) => !since || d >= since);
  const takenDays = new Set(logs.map((l) => l.day));
  const taken = window.filter((d) => takenDays.has(d)).length;
  return { taken, days: window.length, ratio: window.length ? taken / window.length : 0 };
}

/** Consecutive checked-off days up to today. Today counts only once it is checked off. */
export function creatineStreak(logs: CreatineLog[], today: string = localDay()): number {
  const takenDays = new Set(logs.map((l) => l.day));
  let day = takenDays.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (takenDays.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

/** "5 g", "3.5 g". */
export function formatDose(doseG: number): string {
  return `${Math.round(doseG * 10) / 10} g`;
}
