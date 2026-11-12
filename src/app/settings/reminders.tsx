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

const MEAL_TIMES = MEAL_REMINDER_TIMES.map((t) => formatTime12(formatTime(t))).join(' · ');

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
        <Note>iPhone app only.</Note>
      ) : permission === 'denied' ? (
        <Note tone="warning">
          <AppText variant="label">Notifications are off</AppText>
          <Button title="Open Settings" variant="secondary" style={{ minHeight: 50 }} onPress={() => void openNotificationSettings()} />
        </Note>
      ) : permission === 'undetermined' ? (
        <Button title="Allow notifications" variant="secondary" onPress={() => void ask()} />
      ) : null}

      <Group>
        <ToggleRow label="Meals" accessibilityLabel="Meal reminders" sublabel={MEAL_TIMES} value={mealReminders} onChange={(v) => void toggleMeals(v)} />
        <Row
          label="Creatine"
          accessibilityLabel="Creatine reminder"
          value={creatine.enabled && creatine.reminderTime ? formatTime12(creatine.reminderTime) : 'Off'}
          onPress={() => router.push('/settings/creatine')}
        />
      </Group>
    </SettingsScreen>
  );
}
