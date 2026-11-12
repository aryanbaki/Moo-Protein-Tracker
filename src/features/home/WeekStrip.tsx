import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { colors, fonts, spacing } from '../../theme';
import type { DayTotals } from '../../types';
import { dayLetter, dayName, dotState, formatNumber } from './copy';

export interface WeekStripProps {
  days: string[];
  totals: DayTotals[];
  today: string;
  selected: string;
  goalG: number | null;
  onSelect: (day: string) => void;
}

const DOT = 30;

/** Seven day dots: filled green = goal met, ring = partly there, faded = still to come. */
export function WeekStrip({ days, totals, today, selected, goalG, onSelect }: WeekStripProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {days.map((day, i) => {
        const protein = totals[i]?.proteinG ?? 0;
        const state = dotState(day, today, protein, goalG);
        const isSelected = day === selected;
        const isToday = day === today;
        const status = state === 'future' ? 'not here yet' : state === 'met' ? 'goal met' : state === 'partial' ? `${formatNumber(protein)} grams so far` : 'nothing logged';
        return (
          <Pressable
            key={day}
            disabled={state === 'future'}
            onPress={() => onSelect(day)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled: state === 'future' }}
            accessibilityLabel={`${dayName(day)}${isToday ? ', today' : ''}, ${status}`}
            style={[styles.cell, state === 'future' ? styles.future : null]}
            testID={`day-${day}`}
          >
            <AppText variant="small" style={{ fontFamily: isToday ? fonts.black : fonts.medium }} color={isToday ? colors.text : colors.textSecondary}>
              {dayLetter(day)}
            </AppText>
            <View style={[styles.halo, isSelected ? styles.haloSelected : null]}>
              <View
                style={[
                  styles.dot,
                  state === 'met' ? styles.met : null,
                  state === 'partial' ? styles.partial : null,
                  state === 'future' ? styles.dashed : null,
                ]}
              >
                {state === 'met' ? (
                  <AppText variant="small" color={colors.textOnPrimary} style={styles.check}>
                    ✓
                  </AppText>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  cell: { alignItems: 'center', gap: 2, minHeight: 56, minWidth: 36, justifyContent: 'center' },
  future: { opacity: 0.4 },
  halo: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  haloSelected: { borderColor: colors.text },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 3, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  met: { backgroundColor: colors.fill, borderColor: colors.fillDeep },
  partial: { borderColor: colors.fill },
  dashed: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  check: { fontFamily: fonts.black, fontSize: 15, lineHeight: 18 },
  gap: { gap: spacing.xs },
});
