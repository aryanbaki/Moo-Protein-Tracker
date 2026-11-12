import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';
import { OnboardingScaffold, useOnboardingNav } from '../../features/onboarding';
import { Cow } from '../../mascot';
import { requestNotificationPermission, syncReminders } from '../../features/reminders';
import { useProfile } from '../../state/profile';
import { colors, radius, spacing } from '../../theme';

export default function NotificationsStep() {
  const { next } = useOnboardingNav('notifications', { record: false });
  const setNotificationsAsked = useProfile((s) => s.setNotificationsAsked);
  const setMealReminders = useProfile((s) => s.setMealReminders);
  const [busy, setBusy] = useState(false);

  const remindMe = async () => {
    if (busy) return;
    setBusy(true);
    let granted = false;
    try {
      granted = await requestNotificationPermission();
    } catch {
      granted = false;
    }
    setNotificationsAsked(true);
    setMealReminders(granted);
    try {
      await syncReminders();
    } catch {
      // Reminders are a nice-to-have; never block onboarding on them.
    }
    setBusy(false);
    next();
  };

  const notNow = () => {
    setNotificationsAsked(true);
    setMealReminders(false);
    next();
  };

  return (
    <OnboardingScaffold
      step="notifications"
      title="Reminders?"
      cowPose="wave"
      cowSize={240}
      onContinue={remindMe}
      continueLabel="Allow"
      continueDisabled={busy}
      secondaryLabel="Skip"
      onSecondary={notNow}
    >
      {/* A picture of a reminder, not a real notification. */}
      <Card style={styles.preview}>
        <View style={styles.icon}>
          <Cow size={34} headOnly still />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="small">Moo</AppText>
          <AppText variant="label">Log lunch</AppText>
        </View>
      </Card>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
