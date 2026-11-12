/**
 * Reminders: local notifications only (expo-notifications). Nothing here ever
 * throws; on web, or without permission, everything is a quiet no-op.
 */
import { Linking, Platform } from 'react-native';

import { useProfile } from '../../state/profile';
import { buildSchedule, REMINDER_PREFIX } from './schedule';

export * from './schedule';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

type Notifications = typeof import('expo-notifications');

let modulePromise: Promise<Notifications | null> | null = null;

/** Lazily load expo-notifications (never on web) and install the foreground handler once. */
function load(): Promise<Notifications | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  modulePromise ??= import('expo-notifications')
    .then((N) => {
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return N;
    })
    .catch(() => null);
  return modulePromise;
}

/** Current system permission state, without prompting. */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  try {
    const N = await load();
    if (!N) return 'unsupported';
    const res = await N.getPermissionsAsync();
    if (res.granted) return 'granted';
    return res.canAskAgain === false || res.status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'unsupported';
  }
}

/** Ask the system for notification permission. Resolves true when granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const N = await load();
    if (!N) return false;
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    if (current.canAskAgain === false) return false;
    const res = await N.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    return res.granted;
  } catch {
    return false;
  }
}

/** Open the system settings page for Moo (used when permission was denied). */
export async function openNotificationSettings(): Promise<void> {
  try {
    if (Platform.OS !== 'web') await Linking.openSettings();
  } catch {
    // Nothing useful to do.
  }
}

/**
 * Re-schedule all local reminders from the current profile state
 * (creatine reminder time, meal reminders). Safe to call repeatedly.
 */
export async function syncReminders(): Promise<void> {
  try {
    const N = await load();
    if (!N) return;
    const scheduled = await N.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
        .map((n) => N.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
    );
    const perm = await N.getPermissionsAsync();
    if (!perm.granted) return;
    const { creatine, mealReminders } = useProfile.getState();
    for (const r of buildSchedule({ creatine, mealReminders })) {
      await N.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body },
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute },
      });
    }
  } catch {
    // Reminders are best-effort; never break the app over them.
  }
}

// Install the foreground handler as soon as this module is loaded on a device.
void load();
