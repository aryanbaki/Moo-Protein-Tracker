import { View } from 'react-native';

import { OptionCard } from '../../components';
import type { CowPose } from '../../mascot';
import { spacing } from '../../theme';
import { OnboardingScaffold } from './OnboardingScaffold';
import type { StepName } from './steps';

export interface Choice<T extends string> {
  value: T;
  title: string;
  subtitle?: string;
  emoji?: string;
  /** What the cow says and does once this is picked. */
  cowLine: string;
  cowPose?: CowPose;
}

export interface ChoiceStepProps<T extends string> {
  step: StepName;
  title: string;
  subtitle?: string;
  choices: Choice<T>[];
  value: T | undefined;
  onSelect: (value: T) => void;
  onContinue: () => void;
  /** Before anything is picked. */
  idleLine: string;
  idlePose?: CowPose;
  footnote?: string;
}

/** One single-choice question. The cow reacts to whatever is selected. */
export function ChoiceStep<T extends string>({ step, title, subtitle, choices, value, onSelect, onContinue, idleLine, idlePose = 'idle', footnote }: ChoiceStepProps<T>) {
  const picked = choices.find((c) => c.value === value);
  return (
    <OnboardingScaffold
      step={step}
      title={title}
      subtitle={subtitle}
      cowLine={picked ? picked.cowLine : idleLine}
      cowPose={picked ? (picked.cowPose ?? 'idle') : idlePose}
      cowSize={choices.length > 3 ? 130 : 160}
      onContinue={onContinue}
      continueDisabled={!picked}
      footnote={footnote}
    >
      <View accessibilityRole="radiogroup" accessibilityLabel={title} style={{ gap: spacing.sm + 2 }}>
        {choices.map((c) => (
          <OptionCard key={c.value} title={c.title} subtitle={c.subtitle} emoji={c.emoji} selected={c.value === value} onPress={() => onSelect(c.value)} />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
