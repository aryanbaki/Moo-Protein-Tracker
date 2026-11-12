import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { WheelPicker } from '../../components/WheelPicker';
import { OnboardingScaffold, Segmented, range, useOnboardingNav } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import { spacing } from '../../theme';
import type { Sex } from '../../types';

const MIN_AGE = 13;
const MAX_AGE = 100;

const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
] as const;

/** Sex and birth year on one screen; both feed the calorie formula. */
export default function AboutStep() {
  const { next } = useOnboardingNav('about', { record: false });
  const sex = useProfile((s) => s.answers.sex);
  const savedYear = useProfile((s) => s.answers.birthYear);
  const setAnswers = useProfile((s) => s.setAnswers);
  const thisYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => range(thisYear - MAX_AGE, thisYear - MIN_AGE, 1), [thisYear]);
  const [year, setYear] = useState(() => (savedYear && years.includes(savedYear) ? savedYear : thisYear - 28));

  return (
    <OnboardingScaffold
      step="about"
      title="About you"
      cowPose={sex ? 'wave' : 'idle'}
      cowSize={230}
      continueDisabled={!sex}
      onContinue={() => {
        setAnswers({ birthYear: year });
        next();
      }}
    >
      <View style={styles.group}>
        <AppText variant="caption" center>
          Sex
        </AppText>
        <Segmented<Sex> accessibilityLabel="Sex" options={SEX_OPTIONS} value={sex} onChange={(value) => setAnswers({ sex: value })} />
      </View>
      <View style={styles.group}>
        <AppText variant="caption" center>
          Birth year
        </AppText>
        <WheelPicker testID="wheel-birth-year" values={years} value={year} onChange={setYear} accessibilityLabel="Birth year" visibleCount={3} width={180} style={styles.wheel} />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  wheel: { alignSelf: 'center' },
});
