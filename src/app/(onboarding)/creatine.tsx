import { ChoiceStep, useOnboardingNav, type Choice } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import type { CreatineChoice } from '../../types';

const CHOICES: Choice<CreatineChoice>[] = [
  { value: 'yes', title: 'Yes', emoji: '✅', cowLine: "Nice. I'll help you remember it.", cowPose: 'flex' },
  { value: 'no', title: 'No', emoji: '🙅', cowLine: 'Cool, cool. More grass for me.', cowPose: 'chew' },
  { value: 'thinking', title: 'Thinking about it', emoji: '🤔', cowLine: "I'll give you the short version.", cowPose: 'idle' },
];

export default function CreatineStep() {
  const { next } = useOnboardingNav('creatine', { record: false });
  const value = useProfile((s) => s.answers.creatineChoice);
  const setAnswers = useProfile((s) => s.setAnswers);
  const setCreatine = useProfile((s) => s.setCreatine);
  return (
    <ChoiceStep
      step="creatine"
      title="Do you take creatine?"
      subtitle="Totally optional. I can tick it off with you each day."
      choices={CHOICES}
      value={value}
      onSelect={(creatineChoice) => {
        setAnswers({ creatineChoice });
        // "No" switches it off now; "yes"/"thinking" decide on the next screens.
        if (creatineChoice === 'no') setCreatine({ enabled: false, reminderTime: null });
      }}
      onContinue={() => next()}
      idleLine="No pressure. I only take grass."
    />
  );
}
