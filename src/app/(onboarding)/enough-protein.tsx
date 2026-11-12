import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { EnoughProtein } from '../../types';

const CHOICES: Choice<EnoughProtein>[] = [
  { value: 'yes', title: 'Yes, I think so', emoji: '😎', cowLine: "Confident! Let's prove it.", cowPose: 'flex' },
  { value: 'no', title: 'Probably not', emoji: '😬', cowLine: 'Honest! We can fix that.', cowPose: 'idle' },
  { value: 'no_idea', title: 'No idea', emoji: '🤷', cowLine: "Most people don't. That's why I'm here.", cowPose: 'shrug' },
];

export default function EnoughProteinStep() {
  const { next } = useOnboardingNav('enough-protein', { record: false });
  const value = useProfile((s) => s.answers.enoughProtein);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="enough-protein"
      title="Are you getting enough protein today?"
      choices={CHOICES}
      value={value}
      onSelect={(enoughProtein) => setAnswers({ enoughProtein })}
      onContinue={() => next()}
      idleLine="Gut feeling. I have four."
    />
  );
}
