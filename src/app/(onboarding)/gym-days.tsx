import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { GymDays } from '../../types';

const CHOICES: Choice<GymDays>[] = [
  { value: '0-1', label: '0–1', cowPose: 'chew' },
  { value: '2-3', label: '2–3', cowPose: 'wave' },
  { value: '4-5', label: '4–5', cowPose: 'flex' },
  { value: '6+', label: '6+', cowPose: 'shocked' },
];

export default function GymDaysStep() {
  const { next } = useOnboardingNav('gym-days', { record: false });
  const value = useProfile((s) => s.answers.gymDays);
  const setAnswers = useProfile((s) => s.setAnswers);
  return (
    <ChoiceStep
      step="gym-days"
      title="Workouts per week"
      choices={CHOICES}
      value={value}
      onSelect={(gymDays) => setAnswers({ gymDays })}
      onContinue={() => next()}
    />
  );
}
