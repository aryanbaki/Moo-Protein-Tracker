import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
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
  /** The only heading on the screen: six words or fewer. There is no subtitle slot. */
  title: string;
  /** The cow reacts through its pose, not through words. */
  cowPose?: CowPose;
  /** Width at a 844 pt tall screen; it shrinks on shorter ones. */
  cowSize?: number;
  /** Replaces the cow (the reality check adds its one allowed speech bubble here). */
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
}

/**
 * Shared frame for every onboarding question: back arrow + progress bar on
 * top, one short title, the cow, the question body, and a Continue button
 * pinned to the bottom. Deliberately no subtitle and no speech-bubble props.
 */
export function OnboardingScaffold({
  step,
  record,
  title,
  cowPose = 'idle',
  cowSize = 200,
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
}: OnboardingScaffoldProps) {
  const { back, progress, hasBack } = useOnboardingNav(step, { record });
  const size = useCowSize(cowSize);
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText accessibilityRole="header" variant="heading" center style={styles.title}>
          {title}
        </AppText>

        <View style={styles.cow}>{cowSlot !== undefined ? cowSlot : <Cow size={size} pose={cowPose} />}</View>

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

/** Cow width scaled to the screen height, so short phones keep the body on screen. */
export function useCowSize(size: number): number {
  const { height } = useWindowDimensions();
  const k = Math.min(1, Math.max(0.55, (height - 480) / 364));
  return Math.round(size * k);
}

/**
 * The cow's speech bubble. Only two places may use it: "MOO!" on the splash
 * and the single line on the reality check.
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
  title: { lineHeight: 34 },
  // Takes the spare height, so the cow sits centred between title and body.
  cow: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  line: { alignSelf: 'center', maxWidth: '100%' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
});
