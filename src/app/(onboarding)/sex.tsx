import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { Sex } from '../../types';

const CHOICES: Choice<Sex>[] = [
  { value: 'female', title: 'Female', emoji: '♀️', cowLine: 'Noted. Sums adjusted.', cowPose: 'idle' },
  { value: 'male', title: 'Male', emoji: '♂️', cowLine: 'Noted. Sums adjusted.', cowPose: 'idle' },
];

export default function SexStep() {
  const { next } = useOnboardingNav('sex', { record: false });
  const value = useProfile((s) => s.answers.sex);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="sex"
      title="What's your sex?"
      subtitle="Only used for the calorie formula."
      choices={CHOICES}
      value={value}
      onSelect={(sex) => setAnswers({ sex })}
      onContinue={() => next()}
      idleLine="Just for the maths. Pinky hoof."
      footnote="The formula (Mifflin-St Jeor) only knows these two. Pick whichever fits your body best."
    />
  );
}
