import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { HardestPart } from '../../types';

const CHOICES: Choice<HardestPart>[] = [
  { value: 'eating_enough', title: 'Eating enough protein', emoji: '🍗', cowLine: "Challenge accepted. I'll keep count.", cowPose: 'flex' },
  { value: 'knowing_food', title: "Knowing what's in my food", emoji: '🔍', cowLine: "Snap a photo. I'll take a good guess.", cowPose: 'chew' },
  { value: 'remembering', title: 'Remembering to log', emoji: '🧠', cowLine: "I'll nudge you. Gently. With my nose.", cowPose: 'wave' },
  { value: 'consistency', title: 'Staying consistent', emoji: '📅', cowLine: 'One day at a time. Herd mentality.', cowPose: 'idle' },
];

export default function HardestPartStep() {
  const { next } = useOnboardingNav('hardest-part', { record: false });
  const value = useProfile((s) => s.answers.hardestPart);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="hardest-part"
      title="What's the hardest part?"
      choices={CHOICES}
      value={value}
      onSelect={(hardestPart) => setAnswers({ hardestPart })}
      onContinue={() => next()}
      idleLine="Tell me everything. I've got big ears."
    />
  );
}
