import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { MainGoal } from '../../types';

const CHOICES: Choice<MainGoal>[] = [
  { value: 'build_muscle', label: 'Build muscle', cowPose: 'flex' },
  { value: 'lose_fat', label: 'Lose fat', cowPose: 'sweat' },
  { value: 'maintain', label: 'Maintain', cowPose: 'idle' },
  { value: 'eat_better', label: 'Eat better', cowPose: 'chew' },
];

export default function GoalStep() {
  const { next } = useOnboardingNav('goal', { record: false });
  const value = useProfile((s) => s.answers.mainGoal);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="goal"
      title="Your goal"
      choices={CHOICES}
      value={value}
      onSelect={(mainGoal) => setAnswers({ mainGoal })}
      onContinue={() => next()}
      idlePose="wave"
    />
  );
}
