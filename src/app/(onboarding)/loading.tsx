import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '../../components';
import { computeGoals } from '../../features/goals';
import { useOnboardingNav } from '../../features/onboarding';
import { UfoScene } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors, radius, spacing } from '../../theme';

const LINES = ['Weighing the hay…', 'Counting grams…', 'Calibrating the cow…'] as const;
const STEP_MS = 1250;
const DONE_HOLD_MS = 500;

export default function LoadingStep() {
  const { next } = useOnboardingNav('loading');
  const [done, setDone] = useState(0);

  useEffect(() => {
    // The sums are instant; the wait is just the cow enjoying the ride.
    const s = useProfile.getState();
    s.setGoals(computeGoals(s.answers));

    const timers = LINES.map((_, i) => setTimeout(() => setDone(i + 1), STEP_MS * (i + 1)));
    const finish = setTimeout(() => next('replace'), STEP_MS * LINES.length + DONE_HOLD_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [next]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <UfoScene size={250} active />
        <AppText accessibilityRole="header" variant="heading" center>
          Beaming up your plan
        </AppText>
        <View accessibilityLiveRegion="polite" accessibilityLabel={`Building your plan, step ${Math.min(done + 1, LINES.length)} of ${LINES.length}`} style={styles.list}>
          {LINES.map((text, i) => {
            const state = i < done ? 'done' : i === done ? 'active' : 'waiting';
            return (
              <View key={text} style={[styles.row, state === 'waiting' ? { opacity: 0.4 } : null]}>
                <View style={[styles.check, state === 'done' ? styles.checkDone : null]}>
                  {state === 'done' ? (
                    <Svg width={16} height={16} viewBox="0 0 24 24">
                      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={colors.textOnPrimary} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </Svg>
                  ) : null}
                </View>
                <AppText variant="label" color={state === 'done' ? colors.text : colors.textSecondary}>
                  {text}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  list: { gap: spacing.md, marginTop: spacing.sm, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 32 },
  check: { width: 28, height: 28, borderRadius: radius.pill, borderWidth: 2.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.good, borderColor: colors.good },
});
