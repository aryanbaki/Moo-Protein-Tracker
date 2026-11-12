/** Shared UI primitives. Keep them small; feature-specific UI lives with its feature. */
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, fonts, radius, shadow, spacing, typography } from '../theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'small';
const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.black, fontSize: typography.sizes.display, color: colors.text },
  title: { fontFamily: fonts.black, fontSize: 34, color: colors.text },
  heading: { fontFamily: fonts.bold, fontSize: typography.sizes.heading, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: typography.sizes.body, color: colors.text },
  label: { fontFamily: fonts.bold, fontSize: typography.sizes.label, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: typography.sizes.caption, color: colors.textSecondary },
  small: { fontFamily: fonts.medium, fontSize: typography.sizes.small, color: colors.textSecondary },
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
}

export function AppText({ variant = 'body', color, center, style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[variantStyle[variant], color ? { color } : null, center ? { textAlign: 'center' } : null, style]} />;
}

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  /** Pinned to the bottom, outside the scroll area (e.g. the Continue button). */
  footer?: ReactNode;
}

export function Screen({ children, scroll, edges = ['top', 'bottom'], style, footer }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, style]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
  left?: ReactNode;
}

export function Button({ title, variant = 'primary', disabled, style, left, ...rest }: ButtonProps) {
  const bg = { primary: colors.primary, dark: colors.text, secondary: colors.primarySoft, ghost: 'transparent', danger: colors.bad }[variant];
  const fg = variant === 'secondary' ? colors.primaryDark : variant === 'ghost' ? colors.textSecondary : colors.textOnPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      {left}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export interface OptionCardProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  selected?: boolean;
  onPress: () => void;
}

/** Single-choice row used by onboarding questions and settings. */
export function OptionCard({ title, subtitle, emoji, selected, onPress }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.option, selected ? styles.optionSelected : null]}
    >
      {emoji ? <Text style={styles.optionEmoji}>{emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <AppText variant="label" color={selected ? colors.textOnPrimary : colors.text}>{title}</AppText>
        {subtitle ? <AppText variant="caption" color={selected ? colors.primarySoft : colors.textSecondary}>{subtitle}</AppText> : null}
      </View>
    </Pressable>
  );
}

/** Thin progress bar, value 0..1. */
export function ProgressBar({ value, color = colors.primary, height = 6 }: { value: number; color?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }} style={{ height, borderRadius: height, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  button: { minHeight: 58, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  buttonText: { fontFamily: fonts.black, fontSize: 18, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 68, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionEmoji: { fontSize: 26 },
});
