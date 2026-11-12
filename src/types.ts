/** Shared domain types. Keep this file dependency-free. */

export type MainGoal = 'build_muscle' | 'lose_fat' | 'maintain' | 'eat_better';
export type GymDays = '0-1' | '2-3' | '4-5' | '6+';
export type HardestPart = 'eating_enough' | 'knowing_food' | 'remembering' | 'consistency';
export type EnoughProtein = 'yes' | 'no' | 'no_idea';
export type Sex = 'male' | 'female';
export type Units = 'metric' | 'imperial';
export type CreatineChoice = 'yes' | 'no' | 'thinking';

/** Everything onboarding collects. All optional until answered. */
export interface OnboardingAnswers {
  mainGoal?: MainGoal;
  gymDays?: GymDays;
  hardestPart?: HardestPart;
  enoughProtein?: EnoughProtein;
  sex?: Sex;
  birthYear?: number;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  /** kg per week, always positive; direction comes from mainGoal/target. */
  paceKgPerWeek?: number;
  creatineChoice?: CreatineChoice;
}

export interface Goals {
  proteinG: number;
  calories: number;
  carbsG: number;
  fatG: number;
}

export interface CreatineSettings {
  enabled: boolean;
  doseG: number;
  /** "HH:mm" 24h local time, or null for no reminder. */
  reminderTime: string | null;
}

export type EntrySource = 'manual' | 'quick' | 'photo' | 'barcode';

export interface FoodEntry {
  id: string;
  /** Local calendar day the entry belongs to, "YYYY-MM-DD". Never recomputed. */
  day: string;
  name: string;
  proteinG: number;
  calories: number;
  carbsG: number;
  fatG: number;
  source: EntrySource;
  /** ISO timestamps */
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type NewFoodEntry = Pick<FoodEntry, 'name' | 'proteinG' | 'calories' | 'carbsG' | 'fatG' | 'source'> & {
  day?: string;
};

export interface DayTotals {
  day: string;
  proteinG: number;
  calories: number;
  carbsG: number;
  fatG: number;
  entryCount: number;
}

export interface CreatineLog {
  day: string;
  doseG: number;
  takenAt: string;
}

export interface WeightLog {
  day: string;
  weightKg: number;
}

/**
 * How far a food's numbers can be trusted, best first:
 * verified (two sources agree) → label (manufacturer data) → reference (lab
 * data for a generic food) → community (volunteer-entered) → label_photo
 * (read off a photo of the label) → estimate (portion guessed from a photo).
 */
export type ReliabilityLevel = 'verified' | 'label' | 'reference' | 'community' | 'label_photo' | 'estimate';

/** Result of analysing a photo or barcode. */
export interface ScannedItem {
  name: string;
  portion: string;
  proteinG: number;
  calories: number;
  carbsG: number;
  fatG: number;
  /** 0..1 */
  confidence: number;
  /** Plausible protein range for one portion, when the value is an estimate. */
  proteinRange?: { lowG: number; highG: number };
  /** How the numbers were obtained; absent for older results. */
  reliability?: ReliabilityLevel;
}

export interface ScanResult {
  items: ScannedItem[];
  source: 'photo' | 'barcode';
}
