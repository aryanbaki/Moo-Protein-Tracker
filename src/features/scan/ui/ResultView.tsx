/** Editable result of a photo or barcode scan. */
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppText, Button, Card, Screen } from '../../../components';
import { colors, fonts, radius, spacing } from '../../../theme';
import { formatServings, lowestConfidence, MAX_SERVINGS, MIN_SERVINGS, scaled, stepServings, totalsOf, type EditableItem } from '../totals';
import { CloseButton, Pill } from './parts';

export interface ResultViewProps {
  items: EditableItem[];
  source: 'photo' | 'barcode';
  mock: boolean;
  photoUri?: string;
  saving: boolean;
  onChange: (items: EditableItem[]) => void;
  onSave: () => void;
  onRetake: () => void;
  /** Overrides the secondary button label (defaults to Retake / Rescan). */
  retakeLabel?: string;
  onClose: () => void;
}

const LOW_CONFIDENCE = 0.5;

function fmt(n: number): string {
  return String(Math.round(n));
}

export function ResultView({ items, source, mock, photoUri, saving, onChange, onSave, onRetake, retakeLabel, onClose }: ResultViewProps) {
  const totals = totalsOf(items);
  const unsure = items.length > 0 && lowestConfidence(items) < LOW_CONFIDENCE;
  const patch = (key: string, p: Partial<EditableItem>) => onChange(items.map((i) => (i.key === key ? { ...i, ...p } : i)));

  return (
    <Screen
      scroll
      footer={
        <>
          <Button title="Add" onPress={onSave} disabled={items.length === 0 || saving} accessibilityLabel={`Add to today: ${fmt(totals.proteinG)} grams of protein, ${fmt(totals.calories)} calories`} />
          <Button title={retakeLabel ?? (source === 'photo' ? 'Retake' : 'Rescan')} variant="ghost" onPress={onRetake} style={{ minHeight: 44 }} />
        </>
      }
    >
      <View style={styles.header}>
        <CloseButton onPress={onClose} />
        <View style={styles.tags}>
          {mock ? <Pill text="Demo" tone="warning" accessibilityLabel="Demo result: sample numbers, not your photo" testID="tag-demo" /> : null}
          <Pill
            text="Estimate"
            tone={unsure ? 'warning' : 'soft'}
            accessibilityLabel={unsure ? 'Rough estimate. Check the items and portions before you add it.' : 'Estimate. Every value can be edited.'}
            testID="tag-estimate"
          />
        </View>
      </View>

      <Card style={styles.totals}>
        <View style={styles.heroLine}>
          <View accessible accessibilityLabel={`${fmt(totals.proteinG)} grams of protein`} style={styles.heroRow}>
            <Text style={styles.heroNumber}>{fmt(totals.proteinG)}</Text>
            <AppText variant="label" color={colors.primaryDark} style={{ marginBottom: 10 }}>g protein</AppText>
          </View>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.thumb} accessibilityIgnoresInvertColors accessibilityLabel="Your photo" /> : null}
        </View>
        <View style={styles.tiles}>
          <MacroTile label="Calories" value={fmt(totals.calories)} unit="kcal" color={colors.calories} />
          <MacroTile label="Carbs" value={fmt(totals.carbsG)} unit="g" color={colors.carbs} />
          <MacroTile label="Fat" value={fmt(totals.fatG)} unit="g" color={colors.fat} />
        </View>
      </Card>

      {items.length === 0 ? <AppText variant="caption" center>No items</AppText> : null}

      {items.map((item) => {
        const s = scaled(item);
        return (
          <Card key={item.key} style={styles.item}>
            <View style={styles.itemTop}>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={item.name}
                  onChangeText={(name) => patch(item.key, { name })}
                  accessibilityLabel="Food name"
                  placeholder="Food name"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={80}
                  style={styles.nameInput}
                />
                <TextInput
                  value={item.portion}
                  onChangeText={(portion) => patch(item.key, { portion })}
                  accessibilityLabel={`Portion for ${item.name}`}
                  placeholder="Portion"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={60}
                  style={styles.portionInput}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name}`}
                hitSlop={6}
                onPress={() => onChange(items.filter((i) => i.key !== item.key))}
                style={styles.remove}
              >
                <Text style={styles.removeGlyph}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.itemBottom}>
              <View style={{ flex: 1 }}>
                <AppText variant="label" color={colors.primaryDark}>{fmt(s.proteinG)} g protein</AppText>
                <AppText variant="small">{fmt(s.calories)} kcal · {fmt(s.carbsG)} g carbs · {fmt(s.fatG)} g fat</AppText>
              </View>
              <View style={styles.stepper} accessibilityRole="adjustable" accessibilityLabel={`Servings of ${item.name}`} accessibilityValue={{ text: formatServings(item.servings) }}>
                <StepButton glyph="−" label={`Fewer servings of ${item.name}`} disabled={item.servings <= MIN_SERVINGS} onPress={() => patch(item.key, { servings: stepServings(item.servings, -1) })} />
                <AppText variant="label" center style={styles.stepValue}>{formatServings(item.servings)}</AppText>
                <StepButton glyph="+" label={`More servings of ${item.name}`} disabled={item.servings >= MAX_SERVINGS} onPress={() => patch(item.key, { servings: stepServings(item.servings, 1) })} />
              </View>
            </View>
          </Card>
        );
      })}

      {source === 'barcode' ? <AppText variant="small" center>Open Food Facts · USDA</AppText> : null}
    </Screen>
  );
}

function MacroTile({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value} ${unit}`} style={styles.tile}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="label">{value}<AppText variant="small"> {unit}</AppText></AppText>
      <AppText variant="small">{label}</AppText>
    </View>
  );
}

function StepButton({ glyph, label, disabled, onPress }: { glyph: string; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.stepButton, { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}
    >
      <Text style={styles.stepGlyph}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  totals: { gap: spacing.md, backgroundColor: colors.primarySoft, shadowOpacity: 0, elevation: 0 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  heroNumber: { fontFamily: fonts.black, fontSize: 56, lineHeight: 60, color: colors.primaryDark },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: 12, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  item: { gap: spacing.sm },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  nameInput: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, minHeight: 32, paddingVertical: 2, paddingHorizontal: 0 },
  portionInput: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary, minHeight: 28, paddingVertical: 2, paddingHorizontal: 0 },
  remove: { width: 44, height: 44, marginTop: -6, marginRight: -8, alignItems: 'center', justifyContent: 'center' },
  removeGlyph: { fontFamily: fonts.bold, fontSize: 16, color: colors.textSecondary },
  itemBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill },
  stepButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  stepGlyph: { fontFamily: fonts.black, fontSize: 22, lineHeight: 26, color: colors.primaryDark },
  stepValue: { minWidth: 42 },
});
