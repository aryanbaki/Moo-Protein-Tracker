import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { FALLBACKS, applyGoalEdit, checkGoals, computeGoals, type GoalField } from '../../features/goals';
import { GOAL_META, GoalEditSheet, OnboardingScaffold, formatNumber, usePlanUi } from '../../features/onboarding';
import { Confetti } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors, radius, shadow, spacing } from '../../theme';

const TILES: { field: GoalField; color: string }[] = [
  { field: 'calories', color: colors.calories },
  { field: 'carbsG', color: colors.carbs },
  { field: 'fatG', color: colors.fat },
];

export default function PlanStep() {
  const router = useRouter();
  const answers = useProfile((s) => s.answers);
  const savedGoals = useProfile((s) => s.goals);
  const setGoals = useProfile((s) => s.setGoals);
  const suggested = useMemo(() => computeGoals(answers), [answers]);
  const goals = savedGoals ?? suggested;
  const weightKg = answers.weightKg ?? FALLBACKS.weightKg;
  const check = useMemo(() => checkGoals(goals, weightKg, answers.sex), [goals, weightKg, answers.sex]);
  const [editing, setEditing] = useState<GoalField | null>(null);

  // Coming back from the reality check via "Let me fix it": reopen that field.
  useFocusEffect(
    useCallback(() => {
      const { reopenField, setReopenField } = usePlanUi.getState();
      if (reopenField) {
        setReopenField(null);
        setEditing(reopenField);
      }
    }, []),
  );

  const save = (field: GoalField, value: number) => {
    const candidate = applyGoalEdit(goals, field, value);
    const verdict = checkGoals(candidate, weightKg, answers.sex)[field].verdict;
    setEditing(null);
    if (verdict === 'blocked') {
      // Blocked values are never saved; the cow has words instead.
      router.push({ pathname: '/reality-check', params: { field, value: String(value) } });
      return;
    }
    setGoals(candidate);
  };

  const onContinue = () => {
    if (check.firstBlocked) {
      router.push({ pathname: '/reality-check', params: { field: check.firstBlocked, value: String(goals[check.firstBlocked]) } });
      return;
    }
    setGoals(goals);
    router.push({ pathname: '/auth', params: { flow: 'onboarding' } });
  };

  const headsUp = (['proteinG', 'calories', 'carbsG', 'fatG'] as const)
    .map((field) => {
      const c = check[field];
      if (c.verdict !== 'high' && c.verdict !== 'low') return null;
      const meta = GOAL_META[field];
      const rangeText = `${formatNumber(c.recommended.min)}–${formatNumber(c.recommended.max)} ${meta.unit}`;
      return {
        field,
        text:
          c.verdict === 'high'
            ? `Heads-up: ${formatNumber(goals[field])} ${meta.unit} of ${meta.short} is a lot for your size. Most people do well on ${rangeText}. Your call.`
            : `Heads-up: ${formatNumber(goals[field])} ${meta.unit} of ${meta.short} is on the low side. Most people do well on ${rangeText}. Your call.`,
      };
    })
    .filter((x): x is { field: GoalField; text: string } => x !== null);

  const edited = goals.proteinG !== suggested.proteinG || goals.calories !== suggested.calories || goals.carbsG !== suggested.carbsG || goals.fatG !== suggested.fatG;

  return (
    <>
      <OnboardingScaffold
        step="plan"
        title="Your plan is ready!"
        subtitle="Tap any number to change it."
        cowLine={edited ? 'Custom-built. Fancy.' : 'Fresh from the mothership.'}
        cowPose="dance"
        cowSize={124}
        onContinue={onContinue}
        continueLabel="Looks good"
        footnote="Estimates from your answers, not medical advice."
      >
        <Pressable
          testID="goal-proteinG"
          accessibilityRole="button"
          accessibilityLabel={`Daily protein goal: ${goals.proteinG} grams. Tap to edit.`}
          onPress={() => setEditing('proteinG')}
          style={({ pressed }) => [styles.hero, pressed ? styles.pressed : null]}
        >
          <AppText variant="caption" color={colors.primaryDark}>
            Daily protein
          </AppText>
          <View style={styles.heroRow}>
            <AppText variant="display" color={colors.primaryDark} style={styles.heroNumber} adjustsFontSizeToFit numberOfLines={1}>
              {formatNumber(goals.proteinG)}
            </AppText>
            <AppText variant="heading" color={colors.primaryDark}>
              g
            </AppText>
          </View>
          <EditHint color={colors.primaryDark} />
        </Pressable>

        <View style={styles.tiles}>
          {TILES.map(({ field, color }) => (
            <Pressable
              key={field}
              testID={`goal-${field}`}
              accessibilityRole="button"
              accessibilityLabel={`Daily ${GOAL_META[field].short}: ${goals[field]} ${GOAL_META[field].unit}. Tap to edit.`}
              onPress={() => setEditing(field)}
              style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <AppText variant="small">{GOAL_META[field].label}</AppText>
              <AppText variant="label" style={styles.tileNumber} adjustsFontSizeToFit numberOfLines={1}>
                {formatNumber(goals[field])}
              </AppText>
              <AppText variant="small">{GOAL_META[field].unit}</AppText>
            </Pressable>
          ))}
        </View>

        {headsUp.map((h) => (
          <View key={h.field} accessibilityRole="alert" style={styles.headsUp}>
            <AppText style={{ fontSize: 18 }}>⚠️</AppText>
            <AppText variant="caption" color={colors.text} style={{ flex: 1, lineHeight: 19 }}>
              {h.text}
            </AppText>
          </View>
        ))}
      </OnboardingScaffold>

      <Confetti fireKey="plan-ready" />

      <GoalEditSheet field={editing} value={editing ? goals[editing] : 0} recommended={editing ? check[editing].recommended : undefined} onSave={save} onClose={() => setEditing(null)} />
    </>
  );
}

function EditHint({ color }: { color: string }) {
  return (
    <AppText variant="small" color={color} style={{ opacity: 0.8 }}>
      Tap to edit
    </AppText>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center', minHeight: 44 },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  heroNumber: { lineHeight: 72 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 4, alignItems: 'center', gap: 2, minHeight: 44, ...shadow.card },
  tileNumber: { fontSize: 24 },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  headsUp: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm + 4, borderLeftWidth: 4, borderLeftColor: colors.warning },
});
