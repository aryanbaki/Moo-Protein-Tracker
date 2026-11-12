import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { Sheet } from '../../components/Sheet';
import { colors, radius, shadow, spacing } from '../../theme';

export type AddAction = 'photo' | 'barcode' | 'manual' | 'quick';

export interface AddSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (action: AddAction) => void;
  /** When logging to a past day, scans are hidden (a scan always logs to today). */
  dayLabel?: string | null;
}

const ACTIONS: { key: AddAction; emoji: string; title: string; subtitle: string; tint: string }[] = [
  { key: 'photo', emoji: '📷', title: 'Scan food', subtitle: 'Snap a photo for a rough estimate', tint: colors.primarySoft },
  { key: 'barcode', emoji: '🏷️', title: 'Scan barcode', subtitle: 'Packaged food, per serving', tint: colors.surfaceAlt },
  { key: 'manual', emoji: '✏️', title: 'Type it in', subtitle: 'Name, protein, calories, carbs, fat', tint: colors.surfaceAlt },
  { key: 'quick', emoji: '⚡', title: 'Quick add', subtitle: 'Just the protein grams', tint: colors.surfaceAlt },
];

/** The "+" menu: four ways to feed the cow. */
export function AddSheet({ visible, onClose, onPick, dayLabel }: AddSheetProps) {
  const actions = dayLabel ? ACTIONS.filter((a) => a.key === 'manual' || a.key === 'quick') : ACTIONS;
  return (
    <Sheet visible={visible} onClose={onClose} title={dayLabel ? `Add to ${dayLabel}` : 'Feed the cow'} subtitle="How do you want to log it?" testID="add-sheet">
      <View style={styles.list}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            onPress={() => onPick(a.key)}
            accessibilityRole="button"
            accessibilityLabel={`${a.title}. ${a.subtitle}`}
            style={({ pressed }) => [styles.row, pressed ? { opacity: 0.85, transform: [{ scale: 0.99 }] } : null]}
            testID={`add-${a.key}`}
          >
            <View style={[styles.icon, { backgroundColor: a.tint }]}>
              <AppText style={{ fontSize: 24 }}>{a.emoji}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="label" style={{ fontSize: 18 }}>
                {a.title}
              </AppText>
              <AppText variant="caption">{a.subtitle}</AppText>
            </View>
            <AppText variant="label" color={colors.textSecondary}>
              ›
            </AppText>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 72, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, ...shadow.card },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
