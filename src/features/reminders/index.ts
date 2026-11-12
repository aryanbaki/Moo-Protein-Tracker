/**
 * Reminders contract. BASE STUB: no-ops. The reminders work implements these
 * with expo-notifications (local notifications only).
 */

/** Ask the system for notification permission. Resolves true when granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

/**
 * Re-schedule all local reminders from the current profile state
 * (creatine reminder time, meal reminders). Safe to call repeatedly.
 */
export async function syncReminders(): Promise<void> {}
