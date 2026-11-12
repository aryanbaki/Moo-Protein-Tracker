import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { WheelPicker } from '../../components/WheelPicker';
import { FALLBACKS, kgToLb, lbToKg } from '../../features/goals';
import { OnboardingScaffold, nearest, range, useOnboardingNav } from '../../features/onboarding';
import { useProfile } from '../../state/profile';

export default function TargetWeightStep() {
  const { next, goTo } = useOnboardingNav('target-weight', { record: false });
  const units = useProfile((s) => s.units);
  const answers = useProfile((s) => s.answers);
  const setAnswers = useProfile((s) => s.setAnswers);
  const metric = units === 'metric';
  const losing = answers.mainGoal !== 'build_muscle';
  const weightKg = answers.weightKg ?? FALLBACKS.weightKg;
  const heightM = (answers.heightCm ?? FALLBACKS.heightCm) / 100;

  const toDisplay = (kg: number) => (metric ? kg : kgToLb(kg));
  const toKg = (v: number) => (metric ? v : lbToKg(v));
  const unit = metric ? 'kg' : 'lb';
  const current = Math.round(toDisplay(weightKg));

  // Losing: never offer a target under a BMI of 18.5. Gaining: up to +30 kg.
  const values = useMemo(() => {
    if (losing) {
      const floor = Math.ceil(toDisplay(Math.max(30, 18.5 * heightM * heightM)));
      const list = range(floor, current - 1, 1);
      return list.length > 0 ? list : [current];
    }
    return range(current + 1, current + Math.round(toDisplay(30)), 1);
    // toDisplay only depends on `metric`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [losing, current, heightM, metric]);

  const [targetKg, setTargetKg] = useState(() => {
    if (answers.targetWeightKg) return answers.targetWeightKg;
    return weightKg + (losing ? -1 : 1) * (metric ? (losing ? 5 : 3) : lbToKg(losing ? 10 : 5));
  });
  const value = nearest(values, toDisplay(targetKg));
  const diff = Math.abs(value - current);
  const stuck = losing && values.length === 1 && value === current;

  const line = stuck
    ? "You're already light on your hooves."
    : losing
      ? `${diff} ${unit} to go. Let's mooove.`
      : `${diff} ${unit} of gains. Beefy!`;

  return (
    <OnboardingScaffold
      step="target-weight"
      title="What's your target weight?"
      subtitle={stuck ? "Moo won't aim lower than this. We'll focus on eating well." : `You're at ${current} ${unit} now.`}
      cowLine={line}
      cowPose={losing ? 'idle' : 'flex'}
      onContinue={() => {
        if (stuck) {
          // Nothing to lose: no pace to pick either.
          setAnswers({ targetWeightKg: weightKg, paceKgPerWeek: undefined });
          goTo('chart');
          return;
        }
        setAnswers({ targetWeightKg: Math.round(toKg(value) * 10) / 10 });
        next();
      }}
    >
      <View key={units} style={{ alignItems: 'center' }}>
        <WheelPicker
          testID="wheel-target"
          values={values}
          value={value}
          onChange={(v) => setTargetKg(toKg(v))}
          format={(v) => `${v} ${unit}`}
          accessibilityLabel="Target weight"
          accessibilityValueText={(v) => `${v} ${metric ? 'kilograms' : 'pounds'}`}
          width={200}
        />
      </View>
    </OnboardingScaffold>
  );
}
