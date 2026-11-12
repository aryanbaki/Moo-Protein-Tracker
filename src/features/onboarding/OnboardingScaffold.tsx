import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppText, Button, ProgressBar, type ButtonProps } from '../../components';
import { Cow, SpeechBubble, type CowPose } from '../../mascot';
import { colors, radius, spacing } from '../../theme';
import type { StepName } from './steps';
import { useOnboardingNav } from './useOnboardingNav';

export interface OnboardingScaffoldProps {
  step: StepName;
  /** Set false for screens that must not be resumed into (e.g. reality check). */
  record?: boolean;
  title: string;
  subtitle?: string;
  /** The cow slot. Pass `cow={null}` to hide it, or `cowSlot` to replace it. */
  cowPose?: CowPose;
  cowLine?: string;
  cowSize?: number;
  cowSlot?: ReactNode;
  children?: ReactNode;
  /** Pinned primary button. */
  continueLabel?: string;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueVariant?: ButtonProps['variant'];
  /** Optional second button under the primary one. */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Small print above the buttons. */
  footnote?: string;
  /** Override the back arrow (defaults to the step list). */
  onBack?: () => void;
  hideBack?: boolean;
  /** Centre the body vertically (intro-style screens). */
  centered?: boolean;
}

/**
 * Shared frame for every onboarding question: back arrow + progress bar on
 * top, title, the cow with a one-liner, the question body, and a Continue
 * button pinned to the bottom.
 */
export function OnboardingScaffold({
  step,
  record,
  title,
  subtitle,
  cowPose = 'idle',
  cowLine,
  cowSize = 150,
  cowSlot,
  children,
  continueLabel = 'Continue',
  onContinue,
  continueDisabled,
  continueVariant = 'primary',
  secondaryLabel,
  onSecondary,
  footnote,
  onBack,
  hideBack,
  centered,
}: OnboardingScaffoldProps) {
  const { back, progress, hasBack } = useOnboardingNav(step, { record });
  const showBack = !hideBack && (hasBack || !!onBack);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        {showBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={onBack ?? back} style={({ pressed }) => [styles.back, pressed ? { opacity: 0.6 } : null]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path d="M15 5l-7 7 7 7" stroke={colors.text} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        {progress ? (
          <View accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${progress.index} of ${progress.total}`} accessibilityValue={{ min: 0, max: progress.total, now: progress.index }} style={styles.progress}>
            <ProgressBar value={progress.value} height={8} />
          </View>
        ) : (
          <View style={styles.progress} />
        )}
        <View style={styles.backSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, centered ? styles.centered : null]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titles}>
          <AppText accessibilityRole="header" variant="heading" center style={styles.title}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" center style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {cowSlot !== undefined ? (
          cowSlot
        ) : (
          <View style={styles.cow}>
            {cowLine ? <CowLine text={cowLine} /> : null}
            <Cow size={cowSize} pose={cowPose} />
          </View>
        )}

        {children}
      </ScrollView>

      {onContinue || onSecondary || footnote ? (
        <View style={styles.footer}>
          {footnote ? (
            <AppText variant="small" center>
              {footnote}
            </AppText>
          ) : null}
          {onContinue ? <Button title={continueLabel} variant={continueVariant} onPress={onContinue} disabled={continueDisabled} /> : null}
          {onSecondary && secondaryLabel ? <Button title={secondaryLabel} variant="ghost" onPress={onSecondary} /> : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * What the cow says: the mascot's speech bubble (which pops in and reads
 * itself to screen readers), sized for onboarding and kept inside the screen.
 */
export function CowLine({ text, size = 19 }: { text: string; size?: number }) {
  return (
    <View style={styles.line}>
      <SpeechBubble text={text} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, minHeight: 52 },
  back: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  backSpacer: { width: 44, height: 44 },
  progress: { flex: 1, justifyContent: 'center', minHeight: 44 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.md, flexGrow: 1 },
  centered: { justifyContent: 'center' },
  titles: { gap: spacing.xs },
  title: { lineHeight: 34 },
  subtitle: { lineHeight: 20, paddingHorizontal: spacing.sm },
  cow: { alignItems: 'center', gap: spacing.xs },
  line: { alignSelf: 'center', maxWidth: '100%' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
});
