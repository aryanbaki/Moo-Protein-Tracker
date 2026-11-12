import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';
import { FALLBACKS, applyGoalEdit, checkGoals, computeGoals, type GoalField } from '../../features/goals';
import { CowLine, GOAL_META, OnboardingScaffold, formatNumber, hrefOf, useCowSize, usePlanUi } from '../../features/onboarding';
import { Cow } from '../../mascot';
import { useProfile } from '../../state/profile';
import { colors, spacing } from '../../theme';

const FIELDS: readonly GoalField[] = ['proteinG', 'calories', 'carbsG', 'fatG'];

/** The one joke in onboarding, built from the number they typed. */
function cowLine(field: GoalField, value: number, side: 'low' | 'high' | null): string {
  const amount = `${formatNumber(value)} ${GOAL_META[field].unit}`;
  return side === 'low' ? `${amount}? That's barely a snack.` : `${amount}? Even I can't eat that.`;
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
  const cowSize = useCowSize(230);

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

  return (
    <OnboardingScaffold
      step="plan"
      record={false}
      title={result.side === 'low' ? 'Too low' : 'Too high'}
      cowSlot={
        <>
          <CowLine text={cowLine(field, attempted, result.side)} size={17} />
          <Cow size={cowSize} pose="shocked" />
        </>
      }
      onBack={leave}
      onContinue={useRecommended}
      continueLabel={`Use ${formatNumber(recommendedValue)} ${meta.unit}`}
      secondaryLabel="Edit"
      onSecondary={fixIt}
    >
      <Card style={styles.card}>
        <AppText variant="caption">{meta.label}</AppText>
        <View style={styles.rangeRow}>
          <AppText variant="title" color={colors.primaryDark} adjustsFontSizeToFit numberOfLines={1}>
            {formatNumber(shown.min)}–{formatNumber(shown.max)}
          </AppText>
          <AppText variant="heading" color={colors.primaryDark}>
            {meta.unit}
          </AppText>
        </View>
      </Card>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs, alignItems: 'center' },
  rangeRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
});
