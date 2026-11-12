import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, Card } from '../../components';
import { WheelPicker } from '../../components/WheelPicker';
import { FALLBACKS, formatWeight, kgToLb, lbToKg, paceDirection, safePaceMaxKgPerWeek } from '../../features/goals';
import { OnboardingScaffold, nearest, range, useOnboardingNav } from '../../features/onboarding';
import type { CowPose } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors, spacing } from '../../theme';

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

  let line: string;
  let pose: CowPose;
  if (gaining) {
    const top = value === values[values.length - 1];
    line = top ? "Full steam. That's my top gear." : 'Slow gains stick. Trust the cud.';
    pose = top ? 'flex' : 'chew';
  } else if (share > 0.0075) {
    line = "Phew! That's as fast as I'll go.";
    pose = 'sweat';
  } else if (share > 0.005) {
    line = 'A brisk trot. Doable.';
    pose = 'idle';
  } else {
    line = 'Easy does it. Very sustainable.';
    pose = 'chew';
  }

  const targetKg = answers.targetWeightKg;
  const distanceKg = targetKg ? Math.abs(targetKg - weightKg) : 0;
  const weeks = distanceKg > 0 ? Math.max(1, Math.ceil(distanceKg / toKg(value))) : null;

  return (
    <OnboardingScaffold
      step="pace"
      title={gaining ? 'How fast do you want to gain?' : 'How fast do you want to go?'}
      subtitle="Weight change per week."
      cowLine={line}
      cowPose={pose}
      cowSize={112}
      footnote="Rough estimates, not medical advice."
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
          format={(v) => `${v} ${unit}`}
          accessibilityLabel="Pace per week"
          accessibilityValueText={(v) => `${v} ${metric ? 'kilograms' : 'pounds'} per week`}
          visibleCount={3}
          width={200}
        />
      </View>
      <Card style={{ gap: spacing.xs }}>
        {weeks && targetKg ? (
          <AppText variant="label" center>
            About {weeks} {weeks === 1 ? 'week' : 'weeks'} to reach {formatWeight(targetKg, units)}
          </AppText>
        ) : null}
        <AppText variant="caption" center color={colors.textSecondary}>
          {gaining
            ? 'Moo caps the surplus at 500 kcal a day, so the wheel stops here.'
            : `The wheel stops at about 1% of your body weight a week (${Math.round(toDisplay(safeMaxKg) * 10) / 10} ${unit}).`}
        </AppText>
      </Card>
    </OnboardingScaffold>
  );
}
