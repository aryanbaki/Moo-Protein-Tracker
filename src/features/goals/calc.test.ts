import type { Goals, OnboardingAnswers } from '../../types';
import {
  activityFactor,
  ageFromBirthYear,
  applyGoalEdit,
  bmrMifflinStJeor,
  checkGoals,
  cmToFtIn,
  computeGoalBreakdown,
  computeGoals,
  formatHeight,
  formatWeight,
  ftInToCm,
  kgToLb,
  lbToKg,
  minCalories,
  paceDirection,
  safePaceMaxKgPerWeek,
} from './calc';

const YEAR = 2026;
const man: OnboardingAnswers = { sex: 'male', birthYear: 1996, heightCm: 180, weightKg: 80, gymDays: '2-3', mainGoal: 'maintain' };
const woman: OnboardingAnswers = { sex: 'female', birthYear: 1996, heightCm: 165, weightKg: 60, gymDays: '2-3', mainGoal: 'maintain' };

describe('unit helpers', () => {
  it('converts kg and lb both ways', () => {
    expect(kgToLb(100)).toBeCloseTo(220.46, 2);
    expect(lbToKg(220.46226218)).toBeCloseTo(100, 6);
    expect(lbToKg(kgToLb(72.5))).toBeCloseTo(72.5, 9);
  });

  it('converts cm to feet and inches without ever showing 12 inches', () => {
    expect(cmToFtIn(180)).toEqual({ ft: 5, in: 11 });
    expect(cmToFtIn(182.5)).toEqual({ ft: 6, in: 0 });
    expect(cmToFtIn(152.4)).toEqual({ ft: 5, in: 0 });
    expect(ftInToCm(5, 9)).toBeCloseTo(175.26, 2);
  });

  it('formats height and weight per unit system', () => {
    expect(formatHeight(175, 'metric')).toBe('175 cm');
    expect(formatHeight(175.26, 'imperial')).toBe('5\'9"');
    expect(formatWeight(70, 'metric')).toBe('70 kg');
    expect(formatWeight(70, 'imperial')).toBe('154 lb');
  });
});

describe('building blocks', () => {
  it('computes Mifflin-St Jeor BMR', () => {
    expect(bmrMifflinStJeor(80, 180, 30, 'male')).toBe(1780);
    expect(bmrMifflinStJeor(60, 165, 30, 'female')).toBeCloseTo(1320.25, 5);
    // No sex: midpoint of the two constants.
    expect(bmrMifflinStJeor(80, 180, 30)).toBe(1697);
  });

  it('maps gym days to an activity factor', () => {
    expect(activityFactor('0-1')).toBe(1.3);
    expect(activityFactor('2-3')).toBe(1.45);
    expect(activityFactor('4-5')).toBe(1.6);
    expect(activityFactor('6+')).toBe(1.75);
    expect(activityFactor(undefined)).toBe(1.45);
  });

  it('has a calorie floor by sex', () => {
    expect(minCalories('female')).toBe(1200);
    expect(minCalories('male')).toBe(1500);
    expect(minCalories(undefined)).toBe(1200);
  });

  it('caps pace at 1% of body weight per week', () => {
    expect(safePaceMaxKgPerWeek(80)).toBeCloseTo(0.8, 9);
    expect(safePaceMaxKgPerWeek(55)).toBeCloseTo(0.55, 9);
    expect(safePaceMaxKgPerWeek(0)).toBeCloseTo(0.7, 9);
    expect(safePaceMaxKgPerWeek(Number.NaN)).toBeCloseTo(0.7, 9);
  });

  it('derives age from birth year with a fallback', () => {
    expect(ageFromBirthYear(1996, YEAR)).toBe(30);
    expect(ageFromBirthYear(undefined, YEAR)).toBe(30);
    expect(ageFromBirthYear(2025, YEAR)).toBe(30);
    expect(ageFromBirthYear(1800, YEAR)).toBe(30);
  });

  it('works out pace direction', () => {
    expect(paceDirection({ mainGoal: 'maintain', weightKg: 80, targetWeightKg: 70 })).toBe('none');
    expect(paceDirection({ mainGoal: 'eat_better' })).toBe('none');
    expect(paceDirection({ mainGoal: 'lose_fat', weightKg: 80 })).toBe('lose');
    expect(paceDirection({ mainGoal: 'build_muscle', weightKg: 80 })).toBe('gain');
    expect(paceDirection({ mainGoal: 'lose_fat', weightKg: 80, targetWeightKg: 80 })).toBe('none');
    expect(paceDirection({ mainGoal: 'build_muscle', weightKg: 80, targetWeightKg: 75 })).toBe('lose');
  });
});

describe('computeGoals', () => {
  it('maintain: BMR x activity, no delta', () => {
    // BMR 1780 x 1.45 = 2581 -> 2580
    const g = computeGoals(man, YEAR);
    expect(g.calories).toBe(2580);
    expect(g.proteinG).toBe(110); // 80 x 1.4 = 112 -> 110
    expect(g.fatG).toBe(72); // 2580 x 0.25 / 9 = 71.7
    expect(g.carbsG).toBe(Math.round((2580 - 110 * 4 - 72 * 9) / 4));
  });

  it.each([
    ['0-1', 1.3],
    ['2-3', 1.45],
    ['4-5', 1.6],
    ['6+', 1.75],
  ] as const)('uses activity factor for %s gym days', (gymDays, factor) => {
    const b = computeGoalBreakdown({ ...man, gymDays }, YEAR);
    expect(b.tdee).toBeCloseTo(1780 * factor, 6);
    expect(b.goals.calories).toBe(Math.round((1780 * factor) / 10) * 10);
  });

  it.each([
    ['maintain', 110],
    ['eat_better', 110],
    ['build_muscle', 145], // 144 -> 145
    ['lose_fat', 160],
  ] as const)('protein per kg for %s', (mainGoal, protein) => {
    expect(computeGoals({ ...man, mainGoal }, YEAR).proteinG).toBe(protein);
  });

  it('rounds protein to the nearest 5 g', () => {
    for (const weightKg of [51, 63.4, 77, 92.2, 118]) {
      expect(computeGoals({ ...man, weightKg, mainGoal: 'build_muscle' }, YEAR).proteinG % 5).toBe(0);
    }
  });

  it('tops the suggested protein out at 250 g for very heavy people', () => {
    expect(computeGoals({ ...man, weightKg: 180, mainGoal: 'lose_fat' }, YEAR).proteinG).toBe(250);
  });

  it('lose fat: subtracts pace x 7700 / 7', () => {
    const b = computeGoalBreakdown({ ...man, mainGoal: 'lose_fat', paceKgPerWeek: 0.5 }, YEAR);
    // 2581 - 550 = 2031 -> rounds up to 2040
    expect(b.goals.calories).toBe(2040);
    expect(b.paceCapped).toBe(false);
    expect(b.dailyDelta).toBeLessThan(0);
  });

  it('lose fat: defaults to 0.5 kg/week when no pace was chosen', () => {
    expect(computeGoals({ ...man, mainGoal: 'lose_fat' }, YEAR).calories).toBe(2040);
  });

  it('lose fat: clamps pace to 1% of body weight', () => {
    const fast = computeGoalBreakdown({ ...man, mainGoal: 'lose_fat', paceKgPerWeek: 3 }, YEAR);
    const max = computeGoalBreakdown({ ...man, mainGoal: 'lose_fat', paceKgPerWeek: 0.8 }, YEAR);
    expect(fast.goals.calories).toBe(max.goals.calories);
    expect(fast.paceCapped).toBe(true);
  });

  it('lose fat: never goes below max(BMR x 1.05, 1500) for men', () => {
    const b = computeGoalBreakdown({ ...man, gymDays: '0-1', mainGoal: 'lose_fat', paceKgPerWeek: 0.8 }, YEAR);
    // TDEE 2314 - 880 = 1434, floor = max(1869, 1500) = 1869
    expect(b.calorieFloor).toBeCloseTo(1869, 6);
    expect(b.goals.calories).toBe(1870);
    expect(b.goals.calories).toBeGreaterThanOrEqual(b.calorieFloor);
    expect(b.paceCapped).toBe(true);
  });

  it('lose fat: never goes below max(BMR x 1.05, 1200) for women', () => {
    const small: OnboardingAnswers = { sex: 'female', birthYear: 1966, heightCm: 150, weightKg: 45, gymDays: '0-1', mainGoal: 'lose_fat', paceKgPerWeek: 0.45 };
    const b = computeGoalBreakdown(small, YEAR);
    // BMR = 450 + 937.5 - 300 - 161 = 926.5; floor = max(972.8, 1200) = 1200; TDEE = 1204.45
    expect(b.calorieFloor).toBe(1200);
    expect(b.goals.calories).toBe(1200);
  });

  it('the floor never pushes a goal above maintenance', () => {
    const tiny: OnboardingAnswers = { sex: 'male', birthYear: 1946, heightCm: 150, weightKg: 45, gymDays: '0-1', mainGoal: 'lose_fat', paceKgPerWeek: 0.3 };
    const b = computeGoalBreakdown(tiny, YEAR);
    expect(b.tdee).toBeLessThan(1500);
    expect(b.goals.calories).toBeLessThanOrEqual(Math.ceil(b.tdee / 10) * 10);
  });

  it('build muscle: adds the surplus, capped at +500 kcal', () => {
    const slow = computeGoalBreakdown({ ...man, mainGoal: 'build_muscle', paceKgPerWeek: 0.25 }, YEAR);
    expect(slow.goals.calories).toBe(2860); // 2581 + 275 = 2856
    const fast = computeGoalBreakdown({ ...man, mainGoal: 'build_muscle', paceKgPerWeek: 0.8 }, YEAR);
    expect(fast.goals.calories).toBe(3080); // 2581 + 500
    expect(fast.paceCapped).toBe(true);
  });

  it('follows the target weight for direction', () => {
    const same = computeGoals({ ...man, mainGoal: 'lose_fat', targetWeightKg: 80, paceKgPerWeek: 0.5 }, YEAR);
    expect(same.calories).toBe(2580);
    const down = computeGoals({ ...man, mainGoal: 'lose_fat', targetWeightKg: 72, paceKgPerWeek: 0.5 }, YEAR);
    expect(down.calories).toBe(2040);
  });

  it('ignores pace for maintain and eat better', () => {
    expect(computeGoals({ ...man, mainGoal: 'maintain', paceKgPerWeek: 0.8, targetWeightKg: 60 }, YEAR).calories).toBe(2580);
    expect(computeGoals({ ...man, mainGoal: 'eat_better', paceKgPerWeek: 0.8 }, YEAR).calories).toBe(2580);
  });

  it('fat is 25% of calories and carbs take the remainder', () => {
    const g = computeGoals(woman, YEAR);
    expect(g.fatG).toBe(Math.round((g.calories * 0.25) / 9));
    const kcal = g.proteinG * 4 + g.carbsG * 4 + g.fatG * 9;
    expect(Math.abs(kcal - g.calories)).toBeLessThanOrEqual(4);
  });

  it('never returns negative carbs, even for heavy people on few calories', () => {
    const heavy: OnboardingAnswers = { sex: 'female', birthYear: 1946, heightCm: 150, weightKg: 200, gymDays: '0-1', mainGoal: 'lose_fat', paceKgPerWeek: 2 };
    const g = computeGoals(heavy, YEAR);
    expect(g.carbsG).toBeGreaterThanOrEqual(0);
    expect(g.proteinG * 4 + g.fatG * 9).toBeLessThanOrEqual(g.calories + 4);
  });

  it('falls back sensibly when answers are missing', () => {
    const g = computeGoals({}, YEAR);
    // 70 kg, 170 cm, 30 y, no sex: BMR 1534.5 x 1.45 = 2225
    expect(g.calories).toBe(2230);
    expect(g.proteinG).toBe(100);
    expect(g.carbsG).toBeGreaterThan(0);
    expect(computeGoals(undefined, YEAR)).toEqual(g);
  });

  it('survives junk input', () => {
    const g = computeGoals({ weightKg: Number.NaN, heightCm: -5, birthYear: 3000, paceKgPerWeek: -1, mainGoal: 'lose_fat' }, YEAR);
    for (const v of Object.values(g)) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('produces goals that pass its own guard rails across a grid of people', () => {
    for (const sex of ['male', 'female'] as const)
      for (const weightKg of [40, 60, 80, 120, 180])
        for (const gymDays of ['0-1', '6+'] as const)
          for (const mainGoal of ['maintain', 'eat_better', 'build_muscle', 'lose_fat'] as const) {
            const a: OnboardingAnswers = { sex, weightKg, heightCm: 170, birthYear: 1990, gymDays, mainGoal, paceKgPerWeek: 5 };
            const b = computeGoalBreakdown(a, YEAR);
            const check = checkGoals(b.goals, weightKg, sex);
            expect(check.proteinG.verdict).not.toBe('blocked');
            expect(check.carbsG.verdict).not.toBe('blocked');
            expect(check.fatG.verdict).not.toBe('blocked');
            // Calories can only be under the absolute floor when maintenance itself is.
            if (b.tdee >= minCalories(sex)) expect(check.calories.verdict).toBe('ok');
          }
  });
});

describe('applyGoalEdit', () => {
  const base: Goals = { proteinG: 110, calories: 2580, carbsG: 373, fatG: 72 };

  it('rebalances carbs when protein changes', () => {
    const g = applyGoalEdit(base, 'proteinG', 160);
    expect(g).toEqual({ proteinG: 160, calories: 2580, fatG: 72, carbsG: Math.round((2580 - 640 - 648) / 4) });
  });

  it('rebalances fat and carbs when calories change', () => {
    const g = applyGoalEdit(base, 'calories', 2000);
    expect(g.fatG).toBe(56);
    expect(g.carbsG).toBe(Math.round((2000 - 440 - 56 * 9) / 4));
  });

  it('leaves the rest alone when carbs or fat change', () => {
    expect(applyGoalEdit(base, 'carbsG', 300)).toEqual({ ...base, carbsG: 300 });
    expect(applyGoalEdit(base, 'fatG', 80)).toEqual({ ...base, fatG: 80 });
  });

  it('never produces negative or fractional values', () => {
    expect(applyGoalEdit(base, 'proteinG', 1000).carbsG).toBe(0);
    expect(applyGoalEdit(base, 'fatG', -4).fatG).toBe(0);
    expect(applyGoalEdit(base, 'proteinG', 120.6).proteinG).toBe(121);
    expect(applyGoalEdit(base, 'proteinG', Number.NaN).proteinG).toBe(0);
  });
});

describe('checkGoals', () => {
  const ok: Goals = { proteinG: 130, calories: 2500, carbsG: 300, fatG: 70 };

  it('passes a sensible plan', () => {
    const c = checkGoals(ok, 80, 'male');
    expect(c.blocked).toBe(false);
    expect(c.firstBlocked).toBeNull();
    expect(c.proteinG.verdict).toBe('ok');
    expect(c.calories.verdict).toBe('ok');
    expect(c.carbsG.verdict).toBe('ok');
    expect(c.fatG.verdict).toBe('ok');
  });

  it('protein thresholds at 80 kg: low < 64, high > 200, blocked > 240', () => {
    const verdict = (proteinG: number) => checkGoals({ ...ok, proteinG }, 80, 'male').proteinG.verdict;
    expect(verdict(63)).toBe('low');
    expect(verdict(64)).toBe('ok');
    expect(verdict(200)).toBe('ok');
    expect(verdict(201)).toBe('high');
    expect(verdict(240)).toBe('high');
    expect(verdict(241)).toBe('blocked');
    expect(verdict(1000)).toBe('blocked');
    expect(verdict(0)).toBe('blocked');
  });

  it('blocks protein above 350 g regardless of weight', () => {
    expect(checkGoals({ ...ok, proteinG: 350 }, 150, 'male').proteinG.verdict).toBe('ok');
    expect(checkGoals({ ...ok, proteinG: 351 }, 150, 'male').proteinG.verdict).toBe('blocked');
    expect(checkGoals({ ...ok, proteinG: 351 }, 150, 'male').proteinG.allowed.max).toBe(350);
  });

  it('gives a recommended protein range inside the allowed range', () => {
    const c = checkGoals({ ...ok, proteinG: 1000 }, 80, 'male');
    expect(c.proteinG.recommended).toEqual({ min: 95, max: 175 });
    expect(c.proteinG.allowed).toEqual({ min: 1, max: 240 });
    expect(c.proteinG.side).toBe('high');
    expect(c.blocked).toBe(true);
    expect(c.firstBlocked).toBe('proteinG');
  });

  it('blocks calories under the floor and over 6000', () => {
    const verdict = (calories: number, sex?: 'male' | 'female') => checkGoals({ ...ok, calories }, 70, sex).calories;
    expect(verdict(1199, 'female').verdict).toBe('blocked');
    expect(verdict(1199, 'female').side).toBe('low');
    expect(verdict(1200, 'female').verdict).toBe('ok');
    expect(verdict(1499, 'male').verdict).toBe('blocked');
    expect(verdict(1500, 'male').verdict).toBe('ok');
    expect(verdict(1200, undefined).verdict).toBe('ok');
    expect(verdict(6000, 'male').verdict).toBe('ok');
    expect(verdict(6001, 'male').verdict).toBe('blocked');
    expect(verdict(6001, 'male').side).toBe('high');
    expect(verdict(500, 'male').allowed).toEqual({ min: 1500, max: 6000 });
  });

  it('recommended calorie range is ordered and inside the allowed range', () => {
    for (const kg of [35, 50, 70, 110, 200]) {
      for (const sex of ['male', 'female'] as const) {
        const { recommended, allowed } = checkGoals(ok, kg, sex).calories;
        expect(recommended.min).toBeLessThan(recommended.max);
        expect(recommended.min).toBeGreaterThanOrEqual(allowed.min);
        expect(recommended.max).toBeLessThanOrEqual(allowed.max);
      }
    }
  });

  it('only blocks absurd carbs and fat, and flags very low fat', () => {
    expect(checkGoals({ ...ok, carbsG: 0 }, 80, 'male').carbsG.verdict).toBe('ok');
    expect(checkGoals({ ...ok, carbsG: 1001 }, 80, 'male').carbsG.verdict).toBe('blocked');
    expect(checkGoals({ ...ok, carbsG: -1 }, 80, 'male').carbsG.verdict).toBe('blocked');
    expect(checkGoals({ ...ok, fatG: 401 }, 80, 'male').fatG.verdict).toBe('blocked');
    expect(checkGoals({ ...ok, fatG: 39 }, 80, 'male').fatG.verdict).toBe('low');
    expect(checkGoals({ ...ok, fatG: 40 }, 80, 'male').fatG.verdict).toBe('ok');
  });

  it('reports the first blocked field in display order', () => {
    expect(checkGoals({ proteinG: 130, calories: 100, carbsG: 5000, fatG: 70 }, 80, 'male').firstBlocked).toBe('calories');
  });

  it('falls back to 70 kg when weight is missing', () => {
    expect(checkGoals({ ...ok, proteinG: 211 }, 0, 'male').proteinG.verdict).toBe('blocked');
    expect(checkGoals({ ...ok, proteinG: 210 }, Number.NaN, 'male').proteinG.verdict).toBe('high');
  });
});
