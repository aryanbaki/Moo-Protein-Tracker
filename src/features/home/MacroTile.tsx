import { StyleSheet, View } from 'react-native';

import { AppText, Card, ProgressBar } from '../../components';
import { fonts, spacing } from '../../theme';
import { formatNumber, ratio } from './copy';

export interface MacroTileProps {
  label: string;
  value: number;
  goal: number | null;
  unit: string;
  color: string;
}

/** Small tile: label, eaten, goal, and a mini progress bar. */
export function MacroTile({ label, value, goal, unit, color }: MacroTileProps) {
  const u = unit ? ` ${unit}` : '';
  const a11y = goal ? `${label}: ${formatNumber(value)}${u} of ${formatNumber(goal)}${u}` : `${label}: ${formatNumber(value)}${u}, no goal set`;
  return (
    <Card style={styles.tile}>
      <View accessible accessibilityLabel={a11y} style={styles.inner}>
        <View style={styles.labelRow}>
          <View style={[styles.swatch, { backgroundColor: color }]} />
          <AppText variant="small" numberOfLines={1}>
            {label}
          </AppText>
        </View>
        <AppText variant="label" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formatNumber(value)}
        </AppText>
        <AppText variant="small" numberOfLines={1}>
          {goal ? `/ ${formatNumber(goal)}${u}` : ' '}
        </AppText>
        <ProgressBar value={ratio(value, goal)} color={color} height={6} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, padding: spacing.sm + 4 },
  inner: { gap: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 8, height: 8, borderRadius: 4 },
  value: { fontFamily: fonts.black, fontSize: 20 },
});
