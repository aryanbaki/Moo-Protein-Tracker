import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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

  // Coming back from the reality check via "Edit": reopen that field.
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
      // Blocked values are never saved; the reality check takes over.
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
      // Allowed but unusual: show the typical range and leave the choice with them.
      return { field, text: `${meta.label} ${c.verdict}. Typical ${formatNumber(c.recommended.min)}–${formatNumber(c.recommended.max)} ${meta.unit}.` };
    })
    .filter((x): x is { field: GoalField; text: string } => x !== null);

  return (
    <>
      <OnboardingScaffold
        step="plan"
        title="Your plan"
        cowPose="dance"
        cowSize={headsUp.length > 0 ? 170 : 230}
        onContinue={onContinue}
        continueLabel="Start"
        footnote="Estimate. Not medical advice."
      >
        <Pressable
          testID="goal-proteinG"
          accessibilityRole="button"
          accessibilityLabel={`Protein: ${goals.proteinG} grams. Edit.`}
          onPress={() => setEditing('proteinG')}
          style={({ pressed }) => [styles.hero, pressed ? styles.pressed : null]}
        >
          <AppText variant="caption" color={colors.primaryDark}>
            Protein
          </AppText>
          <View style={styles.heroRow}>
            <AppText variant="display" color={colors.primaryDark} style={styles.heroNumber} adjustsFontSizeToFit numberOfLines={1}>
              {formatNumber(goals.proteinG)}
            </AppText>
            <AppText variant="heading" color={colors.primaryDark}>
              g
            </AppText>
          </View>
          <View style={styles.pencil}>
            <Pencil color={colors.primaryDark} />
          </View>
        </Pressable>

        <View style={styles.tiles}>
          {TILES.map(({ field, color }) => (
            <Pressable
              key={field}
              testID={`goal-${field}`}
              accessibilityRole="button"
              accessibilityLabel={`${GOAL_META[field].label}: ${goals[field]} ${GOAL_META[field].unit}. Edit.`}
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

/** Says "editable" without words. */
function Pencil({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 013 0l.5.5a2.1 2.1 0 010 3L8.5 19 4 20z" stroke={color} strokeWidth={2.4} strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center', minHeight: 44 },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  heroNumber: { lineHeight: 72 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm + 4, alignItems: 'center', gap: 2, minHeight: 44, ...shadow.card },
  tileNumber: { fontSize: 24 },
  pencil: { position: 'absolute', top: spacing.md, right: spacing.md, opacity: 0.7 },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  headsUp: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm + 4, borderLeftWidth: 4, borderLeftColor: colors.warning },
});
