import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppText } from '../../components';
import { colors, radius, shadow, spacing } from '../../theme';

export interface UndoToastProps {
  /** Visible text, one word. */
  message: string | null;
  /** Longer text for screen readers, e.g. "Deleted Chicken burrito". */
  accessibilityLabel?: string;
  onUndo: () => void;
  onDismiss: () => void;
  /** How long the toast stays up. */
  durationMs?: number;
  bottom?: number;
}

/** "Deleted · Undo" pill that goes away on its own. */
export function UndoToast({ message, accessibilityLabel, onUndo, onDismiss, durationMs = 5000, bottom = 16 }: UndoToastProps) {
  const reduceMotion = useReducedMotion();
  const [appear] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!message) return;
    appear.setValue(reduceMotion ? 1 : 0);
    if (!reduceMotion) Animated.timing(appear, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  }, [message, reduceMotion, appear]);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;
  return (
    <Animated.View
      style={[styles.toast, { bottom, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
      accessibilityLiveRegion="polite"
      testID="undo-toast"
    >
      <AppText variant="caption" color={colors.textOnPrimary} numberOfLines={1} style={{ flex: 1 }} accessibilityLabel={accessibilityLabel}>
        {message}
      </AppText>
      <Pressable onPress={onUndo} accessibilityRole="button" accessibilityLabel="Undo delete" hitSlop={10} style={styles.undo}>
        <AppText variant="label" color={colors.beam}>
          Undo
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md + 4,
    paddingRight: spacing.sm,
    gap: spacing.sm,
    ...shadow.card,
  },
  undo: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
});
