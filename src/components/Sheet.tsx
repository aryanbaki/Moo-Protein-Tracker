/**
 * Reusable bottom sheet. Slides up over a dimmed backdrop; tap the backdrop,
 * press the close button, or use the system back gesture to dismiss.
 * Built on RN's Modal so it works the same on iOS and web.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../theme';
import { AppText } from './index';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  /** One or two words. */
  title?: string;
  children: ReactNode;
  testID?: string;
}

const OPEN_MS = 260;
const CLOSE_MS = 180;
const TRAVEL = 520;

export function Sheet({ visible, onClose, title, children, testID }: SheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  // Stay mounted while the closing animation plays.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  const t = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      t.value = reduceMotion ? 1 : withTiming(1, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) });
      return;
    }
    t.value = reduceMotion ? 0 : withTiming(0, { duration: CLOSE_MS, easing: Easing.in(Easing.quad) });
    const id = setTimeout(() => setMounted(false), reduceMotion ? 0 : CLOSE_MS);
    return () => clearTimeout(id);
  }, [visible, reduceMotion, t]);

  // Escape closes the sheet on web.
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: t.value }));
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - t.value) * TRAVEL }] }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} testID={testID}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View accessibilityViewIsModal style={[styles.panel, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm }, panelStyle]}>
          <View style={styles.grabber} />
          {title ? (
            <View style={styles.header}>
              <AppText variant="heading" accessibilityRole="header" style={{ flex: 1, fontSize: 24 }}>
                {title}
              </AppText>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={styles.close}>
                <AppText variant="label" color={colors.textSecondary}>
                  ✕
                </AppText>
              </Pressable>
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

export default Sheet;

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: colors.overlay },
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
});
