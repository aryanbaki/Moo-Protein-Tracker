import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { colors, radius } from '../../theme';

export interface SegmentedProps<T extends string> {
  options: { value: T; label: string; badge?: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.badge ? `${o.label}, ${o.badge}` : o.label}
            style={[styles.segment, selected ? styles.selected : null]}
            testID={`segment-${o.value}`}
          >
            <AppText variant="label" color={selected ? colors.textOnPrimary : colors.textSecondary}>
              {o.label}
              {o.badge ? ' 🔒' : ''}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4, alignSelf: 'center' },
  segment: { minHeight: 44, minWidth: 96, paddingHorizontal: 20, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.text },
});
