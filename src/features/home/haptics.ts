/** Haptics that are safe to call anywhere: no-ops on web and never throw. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

function safely(run: () => Promise<void>): void {
  if (!enabled) return;
  try {
    run().catch(() => undefined);
  } catch {
    // Haptics are a nicety; never let them break a tap.
  }
}

export const tapHaptic = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const thumpHaptic = () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const successHaptic = () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warningHaptic = () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
