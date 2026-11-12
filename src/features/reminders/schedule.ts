/** Pure reminder helpers: no expo imports here so Jest can test them cheaply. */
import type { CreatineSettings } from '../../types';

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export interface ReminderSpec {
  /** Stable identifier; always starts with REMINDER_PREFIX so we only ever cancel our own. */
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
}

export const REMINDER_PREFIX = 'moo.reminder.';

export const MEAL_REMINDER_TIMES: readonly TimeOfDay[] = [
  { hour: 13, minute: 0 },
  { hour: 19, minute: 30 },
];

/** Parse strict 24h "HH:mm" (also accepts "H:mm"). Returns null for anything else. */
export function parseTime(value: string | null | undefined): TimeOfDay | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/** Format back to zero-padded "HH:mm". */
export function formatTime({ hour, minute }: TimeOfDay): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Human 12-hour label, e.g. "9:00 AM". */
export function formatTime12(value: string | null | undefined): string {
  const t = parseTime(value);
  if (!t) return 'No reminder';
  const h = t.hour % 12 === 0 ? 12 : t.hour % 12;
  return `${h}:${String(t.minute).padStart(2, '0')} ${t.hour < 12 ? 'AM' : 'PM'}`;
}

/** Move a time by `deltaMinutes`, wrapping around midnight. */
export function shiftTime(value: string, deltaMinutes: number): string {
  const t = parseTime(value) ?? { hour: 9, minute: 0 };
  const total = (((t.hour * 60 + t.minute + deltaMinutes) % 1440) + 1440) % 1440;
  return formatTime({ hour: Math.floor(total / 60), minute: total % 60 });
}

function trimDose(doseG: number): string {
  return String(Math.round(doseG * 10) / 10);
}

export interface ReminderInput {
  creatine: CreatineSettings;
  mealReminders: boolean;
}

/** The full list of daily local notifications Moo should have scheduled for this profile. */
export function buildSchedule({ creatine, mealReminders }: ReminderInput): ReminderSpec[] {
  const out: ReminderSpec[] = [];
  const creatineTime = creatine.enabled ? parseTime(creatine.reminderTime) : null;
  if (creatineTime) {
    out.push({
      id: `${REMINDER_PREFIX}creatine`,
      title: 'Creatine time',
      body: `${trimDose(creatine.doseG)} g`,
      ...creatineTime,
    });
  }
  if (mealReminders) {
    MEAL_REMINDER_TIMES.forEach((t, i) => {
      out.push({
        id: `${REMINDER_PREFIX}meal.${i}`,
        title: 'Protein check',
        body: i === 0 ? 'Lunch' : 'Dinner',
        ...t,
      });
    });
  }
  return out;
}
