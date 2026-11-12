import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';
import { FALLBACKS, applyGoalEdit, checkGoals, computeGoals, type GoalField } from '../../features/goals';
import { GOAL_META, OnboardingScaffold, formatNumber, hrefOf, usePlanUi } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import { colors, spacing } from '../../theme';

const FIELDS: readonly GoalField[] = ['proteinG', 'calories', 'carbsG', 'fatG'];

function cowLine(field: GoalField, value: number, side: 'low' | 'high' | null): string {
  const n = formatNumber(value);
  if (field === 'proteinG') return side === 'low' ? `${n} g? That's not a goal, that's a garnish.` : `${n} g? Even I can't eat that.`;
  if (field === 'calories') return side === 'low' ? `${n} kcal? That's a snack, not a plan.` : `${n} kcal? I have four stomachs and I'm full.`;
  if (field === 'carbsG') return `${n} g of carbs? That's a whole hay barn.`;
  return `${n} g of fat? That's a lot of butter. I'd know.`;
}

/**
 * Shown only when an edited goal is outside the hard limits. There is no way
 * forward from here with the blocked value: either take the recommendation or
 * go back and change it.
 */
export default function RealityCheck() {
  const router = useRouter();
  const params = useLocalSearchParams<{ field?: string; value?: string }>();
  const answers = useProfile((s) => s.answers);
  const savedGoals = useProfile((s) => s.goals);
  const setGoals = useProfile((s) => s.setGoals);

  const field: GoalField = FIELDS.includes(params.field as GoalField) ? (params.field as GoalField) : 'proteinG';
  const value = Number.parseInt(params.value ?? '', 10);
  const attempted = Number.isFinite(value) ? value : 0;

  const suggested = computeGoals(answers);
  const goals = savedGoals ?? suggested;
  const weightKg = answers.weightKg ?? FALLBACKS.weightKg;
  const result = checkGoals(applyGoalEdit(goals, field, attempted), weightKg, answers.sex)[field];
  const meta = GOAL_META[field];

  // Protein and calories go back to the computed plan; carbs and fat to what fits the current plan.
  const recommendedValue = field === 'proteinG' || field === 'calories' ? suggested[field] : applyGoalEdit(goals, 'calories', goals.calories)[field];

  // The plan's own suggestion always counts as inside the recommended range.
  const shown = { min: Math.min(result.recommended.min, recommendedValue), max: Math.max(result.recommended.max, recommendedValue) };

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace(hrefOf('plan'));
  };

  const useRecommended = () => {
    setGoals(applyGoalEdit(goals, field, recommendedValue));
    leave();
  };

  const fixIt = () => {
    usePlanUi.getState().setReopenField(field);
    leave();
  };

  const limit =
    result.side === 'low'
      ? `The lowest Moo will set is ${formatNumber(result.allowed.min)} ${meta.unit}.`
      : `The most Moo will set is ${formatNumber(result.allowed.max)} ${meta.unit}.`;

  return (
    <OnboardingScaffold
      step="plan"
      record={false}
      title="Whoa there, cowpoke"
      cowLine={cowLine(field, attempted, result.side)}
      cowPose="shocked"
      cowSize={150}
      onBack={leave}
      onContinue={useRecommended}
      continueLabel="Use recommended"
      secondaryLabel="Let me fix it"
      onSecondary={fixIt}
      footnote="General guidance, not medical advice."
    >
      <Card style={styles.card}>
        <AppText variant="caption" center>
          Recommended for you
        </AppText>
        <View style={styles.rangeRow}>
          <AppText variant="title" color={colors.primaryDark} adjustsFontSizeToFit numberOfLines={1}>
            {formatNumber(shown.min)}–{formatNumber(shown.max)}
          </AppText>
          <AppText variant="heading" color={colors.primaryDark}>
            {meta.unit}
          </AppText>
        </View>
        <AppText variant="caption" center color={colors.text}>
          of {meta.short} a day. Your plan suggested {formatNumber(recommendedValue)} {meta.unit}.
        </AppText>
        <AppText variant="small" center style={{ marginTop: spacing.xs }}>
          {limit}
        </AppText>
      </Card>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs, alignItems: 'center' },
  rangeRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
});
