/** Build the "Export my data" payload. Pure, so it can be tested. */
import type { CreatineLog, CreatineSettings, FoodEntry, Goals, OnboardingAnswers, Units, WeightLog } from '../../types';

export interface ExportInput {
  profile: { answers: OnboardingAnswers; goals: Goals | null; units: Units; creatine: CreatineSettings; mealReminders: boolean };
  entries: FoodEntry[];
  creatineLogs: CreatineLog[];
  weightLogs: WeightLog[];
}

export interface MooExport extends ExportInput {
  app: 'Moo';
  formatVersion: 1;
  exportedAt: string;
}

const byDay = <T extends { day: string }>(a: T, b: T) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0);

export function buildExport(input: ExportInput, now: Date = new Date()): MooExport {
  return {
    app: 'Moo',
    formatVersion: 1,
    exportedAt: now.toISOString(),
    profile: {
      answers: { ...input.profile.answers },
      goals: input.profile.goals ? { ...input.profile.goals } : null,
      units: input.profile.units,
      creatine: { ...input.profile.creatine },
      mealReminders: input.profile.mealReminders,
    },
    entries: [...input.entries].sort((a, b) => byDay(a, b) || (a.createdAt < b.createdAt ? -1 : 1)),
    creatineLogs: [...input.creatineLogs].sort(byDay),
    weightLogs: [...input.weightLogs].sort(byDay),
  };
}

export function exportFileName(now: Date = new Date()): string {
  return `moo-export-${now.toISOString().slice(0, 10)}.json`;
}

/** Parse a user-typed number ("82,5" and "82.5" both work). Returns null when it is not a number. */
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
