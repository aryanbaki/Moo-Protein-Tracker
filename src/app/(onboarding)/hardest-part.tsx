import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { HardestPart } from '../../types';

const CHOICES: Choice<HardestPart>[] = [
  { value: 'eating_enough', label: 'Eating enough', cowPose: 'chew' },
  { value: 'knowing_food', label: "Knowing what's in food", cowPose: 'shrug' },
  { value: 'remembering', label: 'Remembering to log', cowPose: 'shocked' },
  { value: 'consistency', label: 'Staying consistent', cowPose: 'sweat' },
];

export default function HardestPartStep() {
  const { next } = useOnboardingNav('hardest-part', { record: false });
  const value = useProfile((s) => s.answers.hardestPart);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="hardest-part"
      title="Hardest part"
      choices={CHOICES}
      value={value}
      onSelect={(hardestPart) => setAnswers({ hardestPart })}
      onContinue={() => next()}
    />
  );
}
