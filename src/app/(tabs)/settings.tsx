import { router } from 'expo-router';

import { AppText, Screen } from '../../components';
import { useAuth } from '../../features/auth';
import { useBilling } from '../../features/billing';
import { formatTime12 } from '../../features/reminders';
import { Group, Row } from '../../features/settings/ui';
import { useProfile } from '../../state/profile';

type SubScreen = 'goals' | 'body' | 'units' | 'reminders' | 'creatine' | 'account' | 'subscription' | 'data' | 'about';
const open = (name: SubScreen) => () => router.push(`/settings/${name}`);

export default function SettingsScreen() {
  const goals = useProfile((s) => s.goals);
  const units = useProfile((s) => s.units);
  const creatine = useProfile((s) => s.creatine);
  const mealReminders = useProfile((s) => s.mealReminders);
  const user = useAuth((s) => s.user);
  const isPremium = useBilling((s) => s.isPremium);

  const creatineValue = !creatine.enabled ? 'Off' : creatine.reminderTime ? `${creatine.doseG} g · ${formatTime12(creatine.reminderTime)}` : `${creatine.doseG} g`;

  return (
    <Screen scroll edges={['top']}>
      <AppText variant="title" accessibilityRole="header">Settings</AppText>

      <Group>
        <Row emoji="🎯" label="Goals" value={goals ? `${goals.proteinG} g` : '—'} onPress={open('goals')} />
        <Row emoji="📏" label="Body details" onPress={open('body')} />
        <Row emoji="⚖️" label="Units" value={units === 'metric' ? 'Metric' : 'Imperial'} onPress={open('units')} />
      </Group>

      <Group>
        <Row emoji="🔔" label="Reminders" value={mealReminders ? 'On' : 'Off'} onPress={open('reminders')} />
        <Row emoji="🥄" label="Creatine" value={creatineValue} onPress={open('creatine')} />
      </Group>

      <Group>
        <Row emoji="👤" label="Account" value={user ? (user.email ?? 'Signed in') : 'Signed out'} onPress={open('account')} />
        <Row emoji="👑" label="Subscription" value={isPremium ? 'Premium' : 'Free'} onPress={open('subscription')} />
      </Group>

      <Group>
        <Row emoji="📦" label="Your data" onPress={open('data')} />
        <Row emoji="🐮" label="About Moo" onPress={open('about')} />
      </Group>
    </Screen>
  );
}
