import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { colors, radius, shadow } from '../../theme';

export interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  /** Undefined until something is picked. */
  value: T | undefined;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Pill-shaped segmented control (units toggle, dose picker). */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.wrap}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.item, selected ? styles.selected : null]}
          >
            <AppText variant="label" color={selected ? colors.primaryDark : colors.textSecondary}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4, alignSelf: 'center' },
  item: { minHeight: 44, minWidth: 88, paddingHorizontal: 18, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.surface, ...shadow.card },
});
