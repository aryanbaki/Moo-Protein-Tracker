import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Card } from '../../components';
import { WheelPicker } from '../../components/WheelPicker';
import { OnboardingScaffold, Segmented, range, useOnboardingNav } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import { colors, spacing } from '../../theme';

type DoseChoice = '3' | '5' | 'custom';
const CUSTOM_DOSES = range(1, 10, 1);
const OPTIONS = [
  { value: '3', label: '3 g' },
  { value: '5', label: '5 g' },
  { value: 'custom', label: 'Custom' },
] as const;

export default function CreatineDoseStep() {
  const { next } = useOnboardingNav('creatine-dose', { record: false });
  const choice = useProfile((s) => s.answers.creatineChoice);
  const savedDose = useProfile((s) => s.creatine.doseG);
  const setCreatine = useProfile((s) => s.setCreatine);
  const thinking = choice === 'thinking';

  const [mode, setMode] = useState<DoseChoice>(savedDose === 3 ? '3' : savedDose === 5 ? '5' : 'custom');
  const [custom, setCustom] = useState(CUSTOM_DOSES.includes(savedDose) ? savedDose : 5);
  const dose = mode === 'custom' ? custom : Number(mode);

  const line = mode === '5' ? 'Five grams. The classic.' : mode === '3' ? 'Three grams. Neat and tidy.' : `${dose} g. Custom order, coming up.`;

  return (
    <OnboardingScaffold
      step="creatine-dose"
      title={thinking ? 'Creatine, the short version' : 'How much do you take?'}
      cowLine={line}
      cowPose={thinking ? 'idle' : 'flex'}
      cowSize={96}
      onContinue={() => {
        setCreatine({ enabled: true, doseG: dose });
        next();
      }}
      continueLabel={thinking ? 'Add it to my day' : 'Continue'}
      secondaryLabel={thinking ? "I'll decide later" : undefined}
      onSecondary={
        thinking
          ? () => {
              setCreatine({ enabled: false, reminderTime: null });
              next();
            }
          : undefined
      }
    >
      <Card style={{ gap: spacing.xs }}>
        <AppText variant="label">The gist</AppText>
        <AppText variant="caption" color={colors.text} style={{ lineHeight: 20 }}>
          3–5 g a day is the commonly studied dose of creatine monohydrate. Moo doesn&apos;t sell it or push it. I just help you tick it off.
        </AppText>
        <AppText variant="small" style={{ marginTop: spacing.xs }}>
          Not medical advice. Check with your doctor if unsure.
        </AppText>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="caption" center>
          Daily amount
        </AppText>
        <Segmented<DoseChoice> accessibilityLabel="Daily creatine amount" options={OPTIONS} value={mode} onChange={setMode} />
        {mode === 'custom' ? (
          <View style={{ alignItems: 'center' }}>
            <WheelPicker
              testID="wheel-dose"
              values={CUSTOM_DOSES}
              value={custom}
              onChange={setCustom}
              format={(v) => `${v} g`}
              accessibilityLabel="Custom creatine amount"
              accessibilityValueText={(v) => `${v} grams`}
              visibleCount={3}
              width={160}
            />
          </View>
        ) : null}
      </View>
    </OnboardingScaffold>
  );
}
