/** Small shared pieces for the scan flow. */
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../../../components';
import { colors, fonts, radius, spacing } from '../../../theme';

export type ScanMode = 'photo' | 'barcode';

export function CloseButton({ onPress, dark }: { onPress: () => void; dark?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close scanner"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.round, dark ? styles.roundDark : styles.roundLight, pressed ? { opacity: 0.7 } : null]}
    >
      <Text style={[styles.roundGlyph, { color: dark ? colors.textOnPrimary : colors.text }]}>✕</Text>
    </Pressable>
  );
}

/** A one or two word tag. `accessibilityLabel` can say more than the visible text. */
export function Pill({ text, tone = 'soft', style, accessibilityLabel, testID }: { text: string; tone?: 'soft' | 'dark' | 'warning'; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; testID?: string }) {
  const bg = tone === 'dark' ? 'rgba(0,0,0,0.55)' : tone === 'warning' ? colors.warning : colors.primarySoft;
  const fg = tone === 'dark' ? colors.textOnPrimary : tone === 'warning' ? colors.text : colors.primaryDark;
  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? text} testID={testID} style={[styles.pill, { backgroundColor: bg }, style]}>
      <AppText variant="small" color={fg} style={{ fontFamily: fonts.bold }}>{text}</AppText>
    </View>
  );
}

export function ModeToggle({ mode, onChange, dark }: { mode: ScanMode; onChange: (m: ScanMode) => void; dark?: boolean }) {
  const options: { key: ScanMode; label: string }[] = [
    { key: 'photo', label: 'Food' },
    { key: 'barcode', label: 'Barcode' },
  ];
  return (
    <View accessibilityRole="tablist" style={[styles.toggle, { backgroundColor: dark ? 'rgba(0,0,0,0.55)' : colors.surfaceAlt }]}>
      {options.map((o) => {
        const selected = o.key === mode;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${o.label} mode`}
            onPress={() => onChange(o.key)}
            style={[styles.toggleItem, selected ? { backgroundColor: dark ? colors.surface : colors.primary } : null]}
          >
            <AppText variant="label" color={selected ? (dark ? colors.text : colors.textOnPrimary) : dark ? colors.textOnPrimary : colors.textSecondary}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roundDark: { backgroundColor: 'rgba(0,0,0,0.55)' },
  roundLight: { backgroundColor: colors.surfaceAlt },
  roundGlyph: { fontFamily: fonts.black, fontSize: 18, lineHeight: 22 },
  pill: { paddingHorizontal: spacing.md, minHeight: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', borderRadius: radius.pill, padding: 4, alignSelf: 'center' },
  toggleItem: { minHeight: 44, minWidth: 104, paddingHorizontal: spacing.md, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
