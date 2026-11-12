import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { EnoughProtein } from '../../types';

const CHOICES: Choice<EnoughProtein>[] = [
  { value: 'yes', label: 'Yes', cowPose: 'flex' },
  { value: 'no', label: 'No', cowPose: 'sweat' },
  { value: 'no_idea', label: 'Not sure', cowPose: 'shrug' },
];

export default function EnoughProteinStep() {
  const { next } = useOnboardingNav('enough-protein', { record: false });
  const value = useProfile((s) => s.answers.enoughProtein);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="enough-protein"
      title="Enough protein now?"
      choices={CHOICES}
      value={value}
      onSelect={(enoughProtein) => setAnswers({ enoughProtein })}
      onContinue={() => next()}
    />
  );
}
