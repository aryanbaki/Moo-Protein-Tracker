/**
 * The one ordered list of onboarding steps. Progress, next and back all come
 * from here. Step names are the route file names in src/app/(onboarding)/.
 */
import type { CreatineChoice, MainGoal } from '../../types';

export const ALL_STEPS = [
  'index', // splash
  'welcome',
  'goal',
  'gym-days',
  'hardest-part',
  'enough-protein',
  'about', // sex + birth year
  'body',
  'target-weight',
  'pace',
  'chart',
  'creatine',
  'creatine-setup', // dose + reminder
  'notifications',
  'loading',
  'plan',
] as const;

export type StepName = (typeof ALL_STEPS)[number];

/** Steps without a progress bar: intro screens and the loading interlude. */
const UNCOUNTED: readonly StepName[] = ['index', 'welcome', 'loading'];

/** Steps that pass by on their own; "back" never lands on them. */
const TRANSIENT: readonly StepName[] = ['index', 'loading'];

export interface StepContext {
  mainGoal?: MainGoal;
  creatineChoice?: CreatineChoice;
}

export function needsWeightTarget(mainGoal?: MainGoal): boolean {
  return mainGoal === 'lose_fat' || mainGoal === 'build_muscle';
}

export function isStepIncluded(step: StepName, ctx: StepContext): boolean {
  switch (step) {
    case 'target-weight':
    case 'pace':
      // Unknown yet: assume the longer path so progress never jumps backwards.
      return ctx.mainGoal === undefined || needsWeightTarget(ctx.mainGoal);
    case 'creatine-setup':
      // "No" goes straight on. Unknown yet: assume the longer path so progress never jumps backwards.
      return ctx.creatineChoice !== 'no';
    default:
      return true;
  }
}

export function getSteps(ctx: StepContext = {}): StepName[] {
  return ALL_STEPS.filter((s) => isStepIncluded(s, ctx));
}

export function isStepName(value: unknown): value is StepName {
  return typeof value === 'string' && (ALL_STEPS as readonly string[]).includes(value);
}

export function nextStep(current: StepName, ctx: StepContext = {}): StepName | null {
  const from = ALL_STEPS.indexOf(current);
  for (let i = from + 1; i < ALL_STEPS.length; i++) {
    const s = ALL_STEPS[i];
    if (s && isStepIncluded(s, ctx)) return s;
  }
  return null;
}

/** Previous step a person can actually sit on (skips splash and loading). */
export function prevStep(current: StepName, ctx: StepContext = {}): StepName | null {
  const from = ALL_STEPS.indexOf(current);
  for (let i = from - 1; i >= 0; i--) {
    const s = ALL_STEPS[i];
    if (s && isStepIncluded(s, ctx) && !TRANSIENT.includes(s)) return s;
  }
  return null;
}

/** 0..1 for the progress bar, or null on steps that do not show one. */
export function stepProgress(current: StepName, ctx: StepContext = {}): { value: number; index: number; total: number } | null {
  if (UNCOUNTED.includes(current)) return null;
  const counted = getSteps(ctx).filter((s) => !UNCOUNTED.includes(s));
  const index = counted.indexOf(current);
  if (index < 0) return null;
  return { value: (index + 1) / counted.length, index: index + 1, total: counted.length };
}

/** Step names saved by builds from before screens were merged. */
const RENAMED: Readonly<Record<string, StepName>> = {
  sex: 'about',
  'birth-year': 'about',
  'creatine-no': 'creatine',
  'creatine-dose': 'creatine-setup',
  'creatine-reminder': 'creatine-setup',
};

/**
 * Where to send someone who quit mid-flow. Unknown or no-longer-valid steps
 * fall back to the start; the intro screens are not worth resuming into.
 */
export function resumeStep(saved: string | null | undefined, ctx: StepContext = {}): StepName | null {
  const step = typeof saved === 'string' && Object.prototype.hasOwnProperty.call(RENAMED, saved) ? RENAMED[saved] : saved;
  if (!isStepName(step)) return null;
  if (step === 'index' || step === 'welcome') return null;
  if (!isStepIncluded(step, ctx)) return null;
  return step;
}

/** Route path for a step ("/goal"); the splash lives at "/". */
export function stepHref(step: StepName): string {
  return step === 'index' ? '/' : `/${step}`;
}
