import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { GymDays } from '../../types';

const CHOICES: Choice<GymDays>[] = [
  { value: '0-1', title: '0–1 days', subtitle: 'Mostly grazing', emoji: '🛋️', cowLine: 'Rest is a legitimate hobby.', cowPose: 'chew' },
  { value: '2-3', title: '2–3 days', subtitle: 'A steady trot', emoji: '🚶', cowLine: 'A steady trot. Respect.', cowPose: 'idle' },
  { value: '4-5', title: '4–5 days', subtitle: 'Regular lifter', emoji: '🏋️', cowLine: 'Look at you, prize bull.', cowPose: 'flex' },
  { value: '6+', title: '6+ days', subtitle: 'Basically lives there', emoji: '🏆', cowLine: 'Do you… sleep at the gym?', cowPose: 'shocked' },
];

export default function GymDaysStep() {
  const { next } = useOnboardingNav('gym-days', { record: false });
  const value = useProfile((s) => s.answers.gymDays);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="gym-days"
      title="How often do you work out?"
      subtitle="Per week, roughly."
      choices={CHOICES}
      value={value}
      onSelect={(gymDays) => setAnswers({ gymDays })}
      onContinue={() => next()}
      idleLine="Be honest. I nap standing up."
    />
  );
}
