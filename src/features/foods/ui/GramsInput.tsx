/** Exact amount in grams for a database food; sets the item's servings so every number scales. */
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { colors, fonts, radius, spacing } from '../../../theme';
import { gramsToServings, servingsToGrams } from '../amount';

export interface GramsInputProps {
  /** Grams in one serving of the item (100 for per-100 g foods). */
  servingGrams: number;
  servings: number;
  onServings: (servings: number) => void;
}

export function GramsInput({ servingGrams, servings, onServings }: GramsInputProps) {
  const shown = String(servingsToGrams(servings, servingGrams));
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <AppText variant="label" style={{ flex: 1 }}>Amount</AppText>
        <TextInput
          value={draft ?? shown}
          onChangeText={(t) => {
            setDraft(t);
            const next = gramsToServings(t, servingGrams);
            if (next !== null) onServings(next);
          }}
          onBlur={() => setDraft(null)}
          keyboardType="decimal-pad"
          accessibilityLabel="Amount in grams"
          selectTextOnFocus
          maxLength={6}
          style={styles.input}
          testID="grams-input"
        />
        <AppText variant="label">g</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { minWidth: 88, minHeight: 44, textAlign: 'right', borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, fontFamily: fonts.bold, fontSize: 18, color: colors.text },
});
