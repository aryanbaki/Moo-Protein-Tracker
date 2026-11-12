import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { MainGoal } from '../../types';

const CHOICES: Choice<MainGoal>[] = [
  { value: 'build_muscle', title: 'Build muscle', emoji: '💪', cowLine: 'Beef up? Bold thing to tell a cow.', cowPose: 'flex' },
  { value: 'lose_fat', title: 'Lose fat', emoji: '🔥', cowLine: 'Lean and mean. Well, lean and friendly.', cowPose: 'idle' },
  { value: 'maintain', title: 'Maintain', emoji: '⚖️', cowLine: "If it ain't broke, don't milk it.", cowPose: 'idle' },
  { value: 'eat_better', title: 'Just eat better', emoji: '🥗', cowLine: 'Greener pastures. I approve.', cowPose: 'chew' },
];

export default function GoalStep() {
  const { next } = useOnboardingNav('goal', { record: false });
  const value = useProfile((s) => s.answers.mainGoal);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="goal"
      title="What's your main goal?"
      subtitle="This sets how much protein I aim you at."
      choices={CHOICES}
      value={value}
      onSelect={(mainGoal) => setAnswers({ mainGoal })}
      onContinue={() => next()}
      idleLine="No wrong answers. I'm a cow."
      idlePose="wave"
    />
  );
}
