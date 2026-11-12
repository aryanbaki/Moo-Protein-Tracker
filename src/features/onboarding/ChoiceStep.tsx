import { View } from 'react-native';

import { OptionCard } from '../../components';
import type { CowPose } from '../../mascot';
import { spacing } from '../../theme';
import { OnboardingScaffold } from './OnboardingScaffold';
import type { StepName } from './steps';

export interface Choice<T extends string> {
  value: T;
  /** The whole row: a label, nothing else. */
  label: string;
  /** How the cow reacts once this is picked. */
  cowPose?: CowPose;
}

export interface ChoiceStepProps<T extends string> {
  step: StepName;
  title: string;
  choices: Choice<T>[];
  value: T | undefined;
  onSelect: (value: T) => void;
  onContinue: () => void;
  /** Before anything is picked. */
  idlePose?: CowPose;
}

/** One single-choice question. The cow reacts to the selection with a pose. */
export function ChoiceStep<T extends string>({ step, title, choices, value, onSelect, onContinue, idlePose = 'idle' }: ChoiceStepProps<T>) {
  const picked = choices.find((c) => c.value === value);
  return (
    <OnboardingScaffold
      step={step}
      title={title}
      cowPose={picked ? (picked.cowPose ?? 'idle') : idlePose}
      cowSize={choices.length > 3 ? 250 : 290}
      onContinue={onContinue}
      continueDisabled={!picked}
    >
      <View accessibilityRole="radiogroup" accessibilityLabel={title} style={{ gap: spacing.sm + 2 }}>
        {choices.map((c) => (
          <OptionCard key={c.value} title={c.label} selected={c.value === value} onPress={() => onSelect(c.value)} />
        ))}
      </View>
    </OnboardingScaffold>
  );
}
