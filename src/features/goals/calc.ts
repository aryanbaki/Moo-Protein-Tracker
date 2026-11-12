/**
 * Goal math. Pure functions only: no React, no storage, no dates from "now"
 * unless passed in. Everything here is unit-tested in calc.test.ts.
 *
 * These are general estimates for healthy adults, not medical advice.
 */
import type { Goals, GymDays, MainGoal, OnboardingAnswers, Sex } from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const KCAL_PER_KG = 7700;
export const MAX_SURPLUS_KCAL = 500;
export const MAX_CALORIES = 6000;
export const MIN_CALORIES_FEMALE = 1200;
export const MIN_CALORIES_MALE = 1500;

export const PROTEIN_LOW_G_PER_KG = 0.8;
export const PROTEIN_HIGH_G_PER_KG = 2.5;
export const PROTEIN_BLOCK_G_PER_KG = 3;
export const PROTEIN_BLOCK_G = 350;
/** Per-kg targets overshoot at high body weights, so the suggested goal tops out here. */
export const PROTEIN_SUGGEST_MAX_G = 250;

export const CARBS_BLOCK_G = 1000;
export const FAT_BLOCK_G = 400;

export const ACTIVITY_FACTOR: Record<GymDays, number> = { '0-1': 1.3, '2-3': 1.45, '4-5': 1.6, '6+': 1.75 };
export const PROTEIN_G_PER_KG: Record<MainGoal, number> = { maintain: 1.4, eat_better: 1.4, build_muscle: 1.8, lose_fat: 2.0 };

/** Used when an answer is missing, so the app always has a workable plan. */
export const FALLBACKS = { weightKg: 70, heightCm: 170, age: 30, gymDays: '2-3' as GymDays, mainGoal: 'eat_better' as MainGoal } as const;

const DEFAULT_PACE: Record<MainGoal, number> = { lose_fat: 0.5, build_muscle: 0.25, maintain: 0, eat_better: 0 };

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

const LB_PER_KG = 2.2046226218;
const CM_PER_IN = 2.54;

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

/** Whole feet and whole inches (inches never reads 12). */
export function cmToFtIn(cm: number): { ft: number; in: number } {
  const total = Math.round(cmToIn(cm));
  return { ft: Math.floor(total / 12), in: total % 12 };
}

export function ftInToCm(ft: number, inches: number): number {
  return inToCm(ft * 12 + inches);
}

/** "5'9\"" or "175 cm". */
export function formatHeight(cm: number, units: 'metric' | 'imperial'): string {
  if (units === 'metric') return `${Math.round(cm)} cm`;
  const { ft, in: inches } = cmToFtIn(cm);
  return `${ft}'${inches}"`;
}

/** "154 lb" or "70 kg". */
export function formatWeight(kg: number, units: 'metric' | 'imperial'): string {
  return units === 'metric' ? `${Math.round(kg)} kg` : `${Math.round(kgToLb(kg))} lb`;
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const positive = (n: unknown, fallback: number): number => (finite(n) && n > 0 ? n : fallback);
const roundTo = (n: number, step: number): number => Math.round(n / step) * step;

/**
 * Mifflin-St Jeor resting energy, kcal/day. With no sex given, uses the
 * midpoint of the two constants.
 */
export function bmrMifflinStJeor(weightKg: number, heightCm: number, age: number, sex?: Sex): number {
  const offset = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + offset;
}

export function activityFactor(gymDays?: GymDays): number {
  return ACTIVITY_FACTOR[gymDays ?? FALLBACKS.gymDays] ?? ACTIVITY_FACTOR[FALLBACKS.gymDays];
}

/** Absolute minimum daily calories the app will accept as a goal. */
export function minCalories(sex?: Sex): number {
  return sex === 'male' ? MIN_CALORIES_MALE : MIN_CALORIES_FEMALE;
}

/** Fastest weekly weight change the app offers: 1% of body weight. */
export function safePaceMaxKgPerWeek(weightKg: number): number {
  return positive(weightKg, FALLBACKS.weightKg) * 0.01;
}

export function ageFromBirthYear(birthYear: number | undefined, currentYear: number = new Date().getFullYear()): number {
  if (!finite(birthYear)) return FALLBACKS.age;
  const age = currentYear - birthYear;
  return age >= 13 && age <= 110 ? age : FALLBACKS.age;
}

export type PaceDirection = 'lose' | 'gain' | 'none';

/** Which way the scale should move, from the main goal and (if set) the target weight. */
export function paceDirection(answers: Pick<OnboardingAnswers, 'mainGoal' | 'weightKg' | 'targetWeightKg'>): PaceDirection {
  const goal = answers.mainGoal ?? FALLBACKS.mainGoal;
  if (goal !== 'lose_fat' && goal !== 'build_muscle') return 'none';
  const weight = positive(answers.weightKg, FALLBACKS.weightKg);
  if (finite(answers.targetWeightKg) && answers.targetWeightKg > 0) {
    if (answers.targetWeightKg < weight) return 'lose';
    if (answers.targetWeightKg > weight) return 'gain';
    return 'none';
  }
  return goal === 'lose_fat' ? 'lose' : 'gain';
}

// ---------------------------------------------------------------------------
// computeGoals
// ---------------------------------------------------------------------------

export interface GoalBreakdown {
  goals: Goals;
  bmr: number;
  tdee: number;
  /** Signed kcal/day applied to maintenance (negative = deficit). */
  dailyDelta: number;
  /** Lowest calorie goal allowed for this person. */
  calorieFloor: number;
  /** True when the requested pace was reduced by a guard rail. */
  paceCapped: boolean;
}

/** Same as computeGoals, with the working shown (used by tests and the plan screen). */
export function computeGoalBreakdown(answers: OnboardingAnswers = {}, currentYear?: number): GoalBreakdown {
  const weightKg = positive(answers.weightKg, FALLBACKS.weightKg);
  const heightCm = positive(answers.heightCm, FALLBACKS.heightCm);
  const age = ageFromBirthYear(answers.birthYear, currentYear);
  const mainGoal = answers.mainGoal ?? FALLBACKS.mainGoal;

  const bmr = bmrMifflinStJeor(weightKg, heightCm, age, answers.sex);
  const tdee = bmr * activityFactor(answers.gymDays);
  const calorieFloor = Math.max(bmr * 1.05, minCalories(answers.sex));

  const direction = paceDirection({ ...answers, weightKg });
  const safeMax = safePaceMaxKgPerWeek(weightKg);
  const requestedPace = positive(answers.paceKgPerWeek, DEFAULT_PACE[mainGoal]);
  const pace = Math.min(requestedPace, safeMax);
  let paceCapped = requestedPace > safeMax;
  const rawDelta = (pace * KCAL_PER_KG) / 7;

  let target = tdee;
  if (direction === 'lose') {
    // Never below the floor, and the floor never pushes someone above maintenance.
    const floor = Math.min(calorieFloor, tdee);
    target = Math.max(tdee - rawDelta, floor);
    if (tdee - rawDelta < floor) paceCapped = true;
  } else if (direction === 'gain') {
    target = tdee + Math.min(rawDelta, MAX_SURPLUS_KCAL);
    if (rawDelta > MAX_SURPLUS_KCAL) paceCapped = true;
  }

  // Round up when cutting so rounding can never dip under the floor.
  const calories = direction === 'lose' ? Math.ceil(target / 10) * 10 : roundTo(target, 10);

  const fatG = Math.round((calories * 0.25) / 9);
  const maxProteinG = Math.max(0, Math.floor((calories - fatG * 9) / 4 / 5) * 5);
  const proteinG = Math.min(roundTo(weightKg * PROTEIN_G_PER_KG[mainGoal], 5), PROTEIN_SUGGEST_MAX_G, maxProteinG);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return {
    goals: { proteinG, calories, carbsG, fatG },
    bmr,
    tdee,
    dailyDelta: calories - tdee,
    calorieFloor,
    paceCapped,
  };
}

/** Daily goals from onboarding answers. Missing answers fall back to sensible defaults. */
export function computeGoals(answers: OnboardingAnswers = {}, currentYear?: number): Goals {
  return computeGoalBreakdown(answers, currentYear).goals;
}

/**
 * Apply a manual edit to one goal and keep the rest coherent:
 * - calories changed: fat goes back to 25% and carbs take what is left
 * - protein changed: carbs take what is left
 * - carbs or fat changed: only that field changes
 */
export function applyGoalEdit(goals: Goals, field: keyof Goals, value: number): Goals {
  const v = Math.max(0, Math.round(finite(value) ? value : 0));
  const next: Goals = { ...goals, [field]: v };
  if (field === 'calories') next.fatG = Math.round((v * 0.25) / 9);
  if (field === 'calories' || field === 'proteinG') {
    next.carbsG = Math.max(0, Math.round((next.calories - next.proteinG * 4 - next.fatG * 9) / 4));
  }
  return next;
}

// ---------------------------------------------------------------------------
// checkGoals (guard rails)
// ---------------------------------------------------------------------------

export type GoalVerdict = 'ok' | 'high' | 'low' | 'blocked';
export type GoalField = keyof Goals;

export interface GoalRange {
  min: number;
  max: number;
}

export interface GoalFieldCheck {
  verdict: GoalVerdict;
  /** Which side of the range the value fell on, when it is not 'ok'. */
  side: 'low' | 'high' | null;
  /** A sensible everyday range to show the user. */
  recommended: GoalRange;
  /** Hard limits: values outside these are 'blocked'. */
  allowed: GoalRange;
}

export type GoalsCheck = Record<GoalField, GoalFieldCheck> & {
  /** True when any field is 'blocked'. */
  blocked: boolean;
  /** First blocked field, in display order, or null. */
  firstBlocked: GoalField | null;
};

const FIELD_ORDER: GoalField[] = ['proteinG', 'calories', 'carbsG', 'fatG'];

/**
 * Sanity-check a set of goals for one person.
 * - protein: above 3 g/kg or 350 g is blocked, above 2.5 g/kg is 'high' (allowed
 *   with a warning), under 0.8 g/kg is 'low'
 * - calories: under the floor (1200 female / 1500 male) or over 6000 is blocked
 * - carbs and fat: only absurd values are blocked; very low fat is 'low'
 */
export function checkGoals(goals: Goals, weightKg: number, sex?: Sex): GoalsCheck {
  const kg = positive(weightKg, FALLBACKS.weightKg);

  // Protein
  const proteinMax = Math.min(Math.floor(kg * PROTEIN_BLOCK_G_PER_KG), PROTEIN_BLOCK_G);
  const proteinRecommended: GoalRange = {
    min: roundTo(kg * 1.2, 5),
    max: Math.min(roundTo(kg * 2.2, 5), proteinMax),
  };
  const p = goals.proteinG;
  let protein: Pick<GoalFieldCheck, 'verdict' | 'side'> = { verdict: 'ok', side: null };
  if (!finite(p) || p <= 0) protein = { verdict: 'blocked', side: 'low' };
  else if (p > proteinMax) protein = { verdict: 'blocked', side: 'high' };
  else if (p > kg * PROTEIN_HIGH_G_PER_KG) protein = { verdict: 'high', side: 'high' };
  else if (p < kg * PROTEIN_LOW_G_PER_KG) protein = { verdict: 'low', side: 'low' };

  // Calories
  const floor = minCalories(sex);
  const caloriesRecommended: GoalRange = {
    min: Math.max(floor, roundTo(kg * 22, 50)),
    max: Math.min(MAX_CALORIES, Math.max(floor + 300, roundTo(kg * 44, 50))),
  };
  const c = goals.calories;
  let calories: Pick<GoalFieldCheck, 'verdict' | 'side'> = { verdict: 'ok', side: null };
  if (!finite(c) || c < floor) calories = { verdict: 'blocked', side: 'low' };
  else if (c > MAX_CALORIES) calories = { verdict: 'blocked', side: 'high' };

  // Carbs: no lower limit; only block the absurd.
  const kcal = finite(c) && c > 0 ? Math.min(c, MAX_CALORIES) : floor;
  const carbsRecommended: GoalRange = { min: Math.round((kcal * 0.3) / 4), max: Math.round((kcal * 0.6) / 4) };
  const cb = goals.carbsG;
  let carbs: Pick<GoalFieldCheck, 'verdict' | 'side'> = { verdict: 'ok', side: null };
  if (!finite(cb) || cb < 0) carbs = { verdict: 'blocked', side: 'low' };
  else if (cb > CARBS_BLOCK_G) carbs = { verdict: 'blocked', side: 'high' };

  // Fat
  const fatRecommended: GoalRange = { min: Math.round((kcal * 0.2) / 9), max: Math.round((kcal * 0.35) / 9) };
  const f = goals.fatG;
  let fat: Pick<GoalFieldCheck, 'verdict' | 'side'> = { verdict: 'ok', side: null };
  if (!finite(f) || f < 0) fat = { verdict: 'blocked', side: 'low' };
  else if (f > FAT_BLOCK_G) fat = { verdict: 'blocked', side: 'high' };
  else if (f < kg * 0.5) fat = { verdict: 'low', side: 'low' };

  const result: Record<GoalField, GoalFieldCheck> = {
    proteinG: { ...protein, recommended: proteinRecommended, allowed: { min: 1, max: proteinMax } },
    calories: { ...calories, recommended: caloriesRecommended, allowed: { min: floor, max: MAX_CALORIES } },
    carbsG: { ...carbs, recommended: carbsRecommended, allowed: { min: 0, max: CARBS_BLOCK_G } },
    fatG: { ...fat, recommended: fatRecommended, allowed: { min: 0, max: FAT_BLOCK_G } },
  };
  const firstBlocked = FIELD_ORDER.find((k) => result[k].verdict === 'blocked') ?? null;
  return { ...result, blocked: firstBlocked !== null, firstBlocked };
}
