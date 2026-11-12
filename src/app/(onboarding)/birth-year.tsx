import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { WheelPicker } from '../../components/WheelPicker';
import { OnboardingScaffold, range, useOnboardingNav } from '../../features/onboarding';
import { useProfile } from '../../state/profile';

const MIN_AGE = 13;
const MAX_AGE = 100;

function lineFor(age: number): string {
  if (age < 20) return `${age}! I'm 6. In cow years that's… 6.`;
  if (age < 40) return `${age}. A fine vintage.`;
  if (age < 60) return `${age}. Aged like good cheddar.`;
  return `${age}. Wise. I can tell.`;
}

export default function BirthYearStep() {
  const { next } = useOnboardingNav('birth-year', { record: false });
  const saved = useProfile((s) => s.answers.birthYear);
  const setAnswers = useProfile((s) => s.setAnswers);
  const thisYear = useMemo(() => new Date().getFullYear(), []);
  const years = useMemo(() => range(thisYear - MAX_AGE, thisYear - MIN_AGE, 1), [thisYear]);
  const [year, setYear] = useState(() => (saved && years.includes(saved) ? saved : thisYear - 28));
  const age = thisYear - year;

  return (
    <OnboardingScaffold
      step="birth-year"
      title="What year were you born?"
      subtitle="Age changes how many calories you burn."
      cowLine={lineFor(age)}
      cowPose="idle"
      onContinue={() => {
        setAnswers({ birthYear: year });
        next();
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <WheelPicker testID="wheel-birth-year" values={years} value={year} onChange={setYear} accessibilityLabel="Birth year" width={180} />
      </View>
    </OnboardingScaffold>
  );
}
