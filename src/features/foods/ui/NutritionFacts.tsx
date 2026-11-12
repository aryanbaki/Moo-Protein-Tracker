/** Full nutrition-facts panel for a database food, scaled to the portion being logged. */
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { colors, spacing } from '../../../theme';
import { formatNutrient, NUTRIENTS, scalePanel, type NutrientPanel } from '../panel';

export interface NutritionFactsProps {
  /** Per 100 g. */
  panel: NutrientPanel;
  /** Weight of the portion being logged. */
  grams: number;
  /** Where the numbers come from, e.g. "USDA FoodData Central". */
  source: string;
}

export function NutritionFacts({ panel, grams, source }: NutritionFactsProps) {
  const scaled = scalePanel(panel, grams / 100);
  const rows = NUTRIENTS.filter((n) => scaled[n.key] !== undefined);
  if (rows.length === 0) return null;
  return (
    <Card style={styles.card}>
      <AppText variant="label">Nutrition facts</AppText>
      <AppText variant="small">{`${Math.round(grams)} g · ${source}`}</AppText>
      <View style={styles.rule} />
      {rows.map((n) => (
        <View key={n.key} style={styles.row} accessible accessibilityLabel={`${n.label}: ${formatNutrient(n.key, scaled[n.key]!)}`}>
          <AppText variant={n.sub ? 'small' : 'caption'} style={n.sub ? styles.sub : undefined}>{n.label}</AppText>
          <AppText variant={n.sub ? 'small' : 'caption'} color={n.key === 'protein' ? colors.primaryDark : undefined}>{formatNutrient(n.key, scaled[n.key]!)}</AppText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  rule: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  sub: { paddingLeft: spacing.md },
});
