import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText } from '../../components';
import { WheelPicker } from '../../components/WheelPicker';
import { FALLBACKS, kgToLb, lbToKg, paceDirection, safePaceMaxKgPerWeek } from '../../features/goals';
import { OnboardingScaffold, nearest, range, useOnboardingNav } from '../../features/onboarding';
import type { CowPose } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors } from '../../theme';

/** A 500 kcal/day surplus is roughly this much per week; faster gain is not offered. */
const MAX_GAIN_KG = 0.46;

export default function PaceStep() {
  const { next } = useOnboardingNav('pace', { record: false });
  const units = useProfile((s) => s.units);
  const answers = useProfile((s) => s.answers);
  const setAnswers = useProfile((s) => s.setAnswers);
  const metric = units === 'metric';
  const weightKg = answers.weightKg ?? FALLBACKS.weightKg;
  const direction = paceDirection(answers);
  const gaining = direction === 'gain';
  const unit = metric ? 'kg' : 'lb';

  const safeMaxKg = safePaceMaxKgPerWeek(weightKg);
  const maxKg = gaining ? Math.min(safeMaxKg, MAX_GAIN_KG) : safeMaxKg;
  const toDisplay = (kg: number) => (metric ? kg : kgToLb(kg));
  const toKg = (v: number) => (metric ? v : lbToKg(v));

  const values = useMemo(() => {
    const step = metric ? 0.1 : 0.25;
    const list = range(step, toDisplay(maxKg) + 1e-6, step);
    return list.length > 0 ? list : [step];
    // toDisplay only depends on `metric`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, maxKg]);

  const [paceKg, setPaceKg] = useState(() => answers.paceKgPerWeek ?? (gaining ? 0.25 : weightKg * 0.005));
  const value = nearest(values, toDisplay(Math.min(paceKg, maxKg)));
  const share = toKg(value) / weightKg; // fraction of body weight per week

  // The cow shows how hard the pace is: relaxed, steady, or sweating at the cap.
  let pose: CowPose;
  if (gaining) pose = value === values[values.length - 1] ? 'flex' : 'chew';
  else if (share > 0.0075) pose = 'sweat';
  else if (share > 0.005) pose = 'idle';
  else pose = 'chew';

  const targetKg = answers.targetWeightKg;
  const distanceKg = targetKg ? Math.abs(targetKg - weightKg) : 0;
  const weeks = distanceKg > 0 ? Math.max(1, Math.ceil(distanceKg / toKg(value))) : null;

  return (
    <OnboardingScaffold
      step="pace"
      title="Pace"
      cowPose={pose}
      cowSize={260}
      onContinue={() => {
        setAnswers({ paceKgPerWeek: Math.round(toKg(value) * 1000) / 1000 });
        next();
      }}
    >
      <View key={units} style={{ alignItems: 'center' }}>
        <WheelPicker
          testID="wheel-pace"
          values={values}
          value={value}
          onChange={(v) => setPaceKg(toKg(v))}
          format={(v) => `${v} ${unit}/week`}
          accessibilityLabel="Pace per week"
          accessibilityValueText={(v) => `${v} ${metric ? 'kilograms' : 'pounds'} per week`}
          visibleCount={3}
          width={220}
        />
      </View>
      {weeks && targetKg ? (
        <AppText variant="heading" center color={colors.primaryDark}>
          {weeks} {weeks === 1 ? 'week' : 'weeks'}
        </AppText>
      ) : null}
    </OnboardingScaffold>
  );
}
