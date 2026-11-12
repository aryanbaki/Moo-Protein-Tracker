import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { AppText, Button } from '../../components';
import {
  formatTime12,
  getNotificationPermission,
  MEAL_REMINDER_TIMES,
  formatTime,
  openNotificationSettings,
  requestNotificationPermission,
  syncReminders,
  type NotificationPermission,
} from '../../features/reminders';
import { Group, Note, Row, SettingsScreen, ToggleRow } from '../../features/settings/ui';
import { useProfile } from '../../state/profile';

const MEAL_TIMES = MEAL_REMINDER_TIMES.map((t) => formatTime12(formatTime(t))).join(' and ');

export default function RemindersSettings() {
  const mealReminders = useProfile((s) => s.mealReminders);
  const creatine = useProfile((s) => s.creatine);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  const refresh = useCallback(async () => {
    setPermission(await getNotificationPermission());
  }, []);

  useEffect(() => {
    let alive = true;
    void getNotificationPermission().then((p) => {
      if (alive) setPermission(p);
    });
    // Coming back from the system settings app may have changed the permission.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh().then(syncReminders);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, [refresh]);

  const ask = async () => {
    await requestNotificationPermission();
    useProfile.getState().setNotificationsAsked(true);
    await refresh();
    await syncReminders();
  };

  const toggleMeals = async (on: boolean) => {
    useProfile.getState().setMealReminders(on);
    if (on && permission === 'undetermined') await ask();
    else await syncReminders();
  };

  return (
    <SettingsScreen title="Reminders">
      {permission === 'unsupported' ? (
        <Note>Notifications only work in the iPhone app. Your choices are saved and will apply there.</Note>
      ) : permission === 'granted' ? (
        <Note tone="good">🔔 Notifications are allowed. Moo will only moo when you ask it to.</Note>
      ) : permission === 'denied' ? (
        <Note tone="warning">
          <AppText variant="label">Notifications are switched off for Moo</AppText>
          <AppText variant="caption">Reminders can&apos;t reach you until you allow them in Settings.</AppText>
          <Button title="Open Settings" variant="secondary" style={{ minHeight: 50 }} onPress={() => void openNotificationSettings()} />
        </Note>
      ) : permission === 'undetermined' ? (
        <Note>
          <AppText variant="label">Moo hasn&apos;t asked yet</AppText>
          <AppText variant="caption">Allow notifications so reminders can reach you.</AppText>
          <Button title="Allow notifications" variant="secondary" style={{ minHeight: 50 }} onPress={() => void ask()} />
        </Note>
      ) : null}

      <Group title="Meals" footer={`Two gentle nudges a day, at ${MEAL_TIMES}: "Had protein yet? The cow is looking a bit empty."`}>
        <ToggleRow label="Meal reminders" sublabel="Lunch and dinner nudges" value={mealReminders} onChange={(v) => void toggleMeals(v)} />
      </Group>

      <Group title="Creatine">
        <Row
          label="Creatine reminder"
          value={!creatine.enabled ? 'Creatine off' : creatine.reminderTime ? formatTime12(creatine.reminderTime) : 'No reminder'}
          onPress={() => router.push('/settings/creatine')}
        />
      </Group>
    </SettingsScreen>
  );
}
