import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';
import { OnboardingScaffold, formatTime, useOnboardingNav } from '../../features/onboarding';
import { requestNotificationPermission, syncReminders } from '../../features/reminders';
import { useProfile } from '../../state/profile';
import { colors, radius, spacing } from '../../theme';

export default function NotificationsStep() {
  const { next } = useOnboardingNav('notifications', { record: false });
  const creatine = useProfile((s) => s.creatine);
  const setNotificationsAsked = useProfile((s) => s.setNotificationsAsked);
  const setMealReminders = useProfile((s) => s.setMealReminders);
  const [busy, setBusy] = useState(false);
  const creatineReminder = creatine.enabled && creatine.reminderTime;

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
      title="Want a nudge from me?"
      subtitle="Logging is the bit people forget. A tiny moo at the right moment helps."
      cowLine="I only moo when it matters."
      cowPose="wave"
      cowSize={112}
      onContinue={remindMe}
      continueLabel={busy ? 'One sec…' : 'Remind me'}
      continueDisabled={busy}
      secondaryLabel="Not now"
      onSecondary={notNow}
      footnote="You can change this any time in Settings."
    >
      {/* A picture of what a nudge looks like; not a real notification. */}
      <Card style={styles.preview}>
        <View style={styles.icon}>
          <AppText style={{ fontSize: 22 }}>🐮</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="small">MOO · now</AppText>
          <AppText variant="label">Lunch o&apos;clock!</AppText>
          <AppText variant="caption" color={colors.text}>
            Got 10 seconds? Feed me your protein numbers.
          </AppText>
        </View>
      </Card>

      <View style={styles.list}>
        <Bullet emoji="🍽️" text="Gentle meal-time nudges to log" />
        {creatineReminder ? <Bullet emoji="⏰" text={`Your creatine reminder at ${formatTime(creatineReminder)}`} /> : null}
        <Bullet emoji="🤫" text="No spam. Cows are famously chill." />
      </View>
    </OnboardingScaffold>
  );
}

function Bullet({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.bullet}>
      <AppText style={{ fontSize: 20 }}>{emoji}</AppText>
      <AppText variant="label" style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  bullet: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', minHeight: 32 },
});
