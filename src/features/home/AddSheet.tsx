import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { Sheet } from '../../components/Sheet';
import { colors, radius, shadow, spacing } from '../../theme';
import { Icon, type IconName } from './icons';

export type AddAction = 'photo' | 'barcode' | 'search' | 'manual' | 'quick';

export interface AddSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (action: AddAction) => void;
  /** When logging to a past day, scans are hidden (a scan always logs to today). */
  dayLabel?: string | null;
}

/** `hint` is only read out by screen readers. */
const ACTIONS: { key: AddAction; icon: IconName; title: string; hint: string }[] = [
  { key: 'photo', icon: 'camera', title: 'Scan', hint: 'Scan food with a photo for a rough estimate' },
  { key: 'barcode', icon: 'barcode', title: 'Barcode', hint: 'Scan the barcode on packaged food' },
  { key: 'search', icon: 'search', title: 'Search', hint: 'Search the food databases by name' },
  { key: 'manual', icon: 'pencil', title: 'Type', hint: 'Type in the name, protein, calories, carbs and fat' },
  { key: 'quick', icon: 'bolt', title: 'Quick add', hint: 'Just the protein grams' },
];

/** The "+" menu: the ways to log. */
export function AddSheet({ visible, onClose, onPick, dayLabel }: AddSheetProps) {
  const actions = dayLabel ? ACTIONS.filter((a) => a.key === 'search' || a.key === 'manual' || a.key === 'quick') : ACTIONS;
  return (
    <Sheet visible={visible} onClose={onClose} title={dayLabel ?? 'Add'} testID="add-sheet">
      <View style={styles.list}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            onPress={() => onPick(a.key)}
            accessibilityRole="button"
            accessibilityLabel={`${a.title}. ${a.hint}`}
            style={({ pressed }) => [styles.row, pressed ? { opacity: 0.85, transform: [{ scale: 0.99 }] } : null]}
            testID={`add-${a.key}`}
          >
            <View style={styles.icon}>
              <Icon name={a.icon} color={colors.primaryDark} />
            </View>
            <AppText variant="label" style={styles.title}>
              {a.title}
            </AppText>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surface, ...shadow.card },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  title: { flex: 1, fontSize: 18 },
});
