import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { CreatineChoice } from '../../types';

const CHOICES: Choice<CreatineChoice>[] = [
  { value: 'yes', label: 'Yes', cowPose: 'flex' },
  { value: 'no', label: 'No', cowPose: 'shrug' },
  { value: 'thinking', label: 'Maybe', cowPose: 'chew' },
];

export default function CreatineStep() {
  const { next } = useOnboardingNav('creatine', { record: false });
  const value = useProfile((s) => s.answers.creatineChoice);
  const setAnswers = useProfile((s) => s.setAnswers);
  const setCreatine = useProfile((s) => s.setCreatine);
  return (
    <ChoiceStep
      step="creatine"
      title="Creatine?"
      choices={CHOICES}
      value={value}
      onSelect={(creatineChoice) => {
        setAnswers({ creatineChoice });
        // "No" switches it off now and skips the set-up screen; "yes"/"maybe" decide there.
        if (creatineChoice === 'no') setCreatine({ enabled: false, reminderTime: null });
      }}
      onContinue={() => next()}
    />
  );
}
