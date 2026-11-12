import { useState } from 'react';
import { View } from 'react-native';

import { OptionCard } from '../../components';
import { WheelPicker } from '../../components/WheelPicker';
import { HALF_HOUR_TIMES, OnboardingScaffold, formatTime, useOnboardingNav } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import { spacing } from '../../theme';

export default function CreatineReminderStep() {
  const { next } = useOnboardingNav('creatine-reminder', { record: false });
  const saved = useProfile((s) => s.creatine.reminderTime);
  const doseG = useProfile((s) => s.creatine.doseG);
  const setCreatine = useProfile((s) => s.setCreatine);
  const [remind, setRemind] = useState(true);
  const [time, setTime] = useState(saved && HALF_HOUR_TIMES.includes(saved) ? saved : '08:00');

  return (
    <OnboardingScaffold
      step="creatine-reminder"
      title="Want a daily reminder?"
      subtitle={`One nudge a day for your ${doseG} g. That's it.`}
      cowLine={remind ? `I'll moo at ${formatTime(time)}. Softly.` : "No reminder. You've got this."}
      cowPose={remind ? 'wave' : 'shrug'}
      cowSize={104}
      onContinue={() => {
        setCreatine({ enabled: true, reminderTime: remind ? time : null });
        next();
      }}
    >
      <View accessibilityRole="radiogroup" accessibilityLabel="Daily creatine reminder" style={{ gap: spacing.sm }}>
        <OptionCard title="Yes, remind me" emoji="🔔" selected={remind} onPress={() => setRemind(true)} />
        <OptionCard title="No reminder" emoji="🔕" selected={!remind} onPress={() => setRemind(false)} />
      </View>
      {remind ? (
        <View style={{ alignItems: 'center' }}>
          <WheelPicker
            testID="wheel-time"
            values={HALF_HOUR_TIMES}
            value={time}
            onChange={setTime}
            format={formatTime}
            accessibilityLabel="Reminder time"
            visibleCount={3}
            width={200}
          />
        </View>
      ) : null}
    </OnboardingScaffold>
  );
}
