import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { WheelPicker } from '../../components/WheelPicker';
import { HALF_HOUR_TIMES, OnboardingScaffold, Segmented, formatTime, range, useOnboardingNav } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import { spacing } from '../../theme';

type DoseChoice = '3' | '5' | 'custom';
type RemindChoice = 'on' | 'off';
const CUSTOM_DOSES = range(1, 10, 1);
const DOSE_OPTIONS = [
  { value: '3', label: '3 g' },
  { value: '5', label: '5 g' },
  { value: 'custom', label: 'Other' },
] as const;
const REMIND_OPTIONS = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
] as const;

/** Creatine dose and daily reminder on one screen. */
export default function CreatineSetupStep() {
  const { next } = useOnboardingNav('creatine-setup', { record: false });
  const choice = useProfile((s) => s.answers.creatineChoice);
  const savedDose = useProfile((s) => s.creatine.doseG);
  const savedTime = useProfile((s) => s.creatine.reminderTime);
  const setCreatine = useProfile((s) => s.setCreatine);
  const thinking = choice === 'thinking';

  const [mode, setMode] = useState<DoseChoice>(savedDose === 3 ? '3' : savedDose === 5 ? '5' : 'custom');
  const [custom, setCustom] = useState(CUSTOM_DOSES.includes(savedDose) ? savedDose : 5);
  const [remind, setRemind] = useState<RemindChoice>('on');
  const [time, setTime] = useState(savedTime && HALF_HOUR_TIMES.includes(savedTime) ? savedTime : '08:00');
  const dose = mode === 'custom' ? custom : Number(mode);
  const wheels = (mode === 'custom' ? 1 : 0) + (remind === 'on' ? 1 : 0);

  return (
    <OnboardingScaffold
      step="creatine-setup"
      title="Dose and reminder"
      cowPose={remind === 'on' ? 'flex' : 'idle'}
      cowSize={wheels === 2 ? (thinking ? 64 : 120) : wheels === 1 ? 190 : 260}
      onContinue={() => {
        setCreatine({ enabled: true, doseG: dose, reminderTime: remind === 'on' ? time : null });
        next();
      }}
      secondaryLabel={thinking ? 'Skip' : undefined}
      onSecondary={
        thinking
          ? () => {
              // Deciding later: creatine stays off, with no reminder.
              setCreatine({ enabled: false, reminderTime: null });
              next();
            }
          : undefined
      }
    >
      <AppText variant="caption" center>
        3–5 g a day is typical. Not medical advice.
      </AppText>

      <View style={styles.group}>
        <AppText variant="caption" center>
          Dose
        </AppText>
        <Segmented<DoseChoice> accessibilityLabel="Daily creatine dose" options={DOSE_OPTIONS} value={mode} onChange={setMode} />
        {mode === 'custom' ? (
          <WheelPicker
            testID="wheel-dose"
            values={CUSTOM_DOSES}
            value={custom}
            onChange={setCustom}
            format={(v) => `${v} g`}
            accessibilityLabel="Creatine dose"
            accessibilityValueText={(v) => `${v} grams`}
            visibleCount={3}
            width={160}
            style={styles.wheel}
          />
        ) : null}
      </View>

      <View style={styles.group}>
        <AppText variant="caption" center>
          Reminder
        </AppText>
        <Segmented<RemindChoice> accessibilityLabel="Daily creatine reminder" options={REMIND_OPTIONS} value={remind} onChange={setRemind} />
        {remind === 'on' ? (
          <WheelPicker
            testID="wheel-time"
            values={HALF_HOUR_TIMES}
            value={time}
            onChange={setTime}
            format={formatTime}
            accessibilityLabel="Reminder time"
            visibleCount={3}
            width={200}
            style={styles.wheel}
          />
        ) : null}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  wheel: { alignSelf: 'center' },
});
