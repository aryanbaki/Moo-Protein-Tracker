import { useMemo, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppText } from '../../components';
import { colors, fonts, radius, shadow, spacing } from '../../theme';
import type { FoodEntry } from '../../types';
import { formatNumber, formatTime, SOURCE_ICON, SOURCE_LABEL } from './copy';

export interface EntryRowProps {
  entry: FoodEntry;
  onPress: (entry: FoodEntry) => void;
  onDelete: (entry: FoodEntry) => void;
}

const DELETE_AT = -96;
const FLING_VELOCITY = -0.8;

/** One logged food. Tap to edit; swipe left to delete (also offered as an accessibility action). */
export function EntryRow({ entry, onPress, onDelete }: EntryRowProps) {
  const [x] = useState(() => new Animated.Value(0));
  const reduceMotion = useReducedMotion();
  // On web a mouse drag still ends in a click; this keeps a swipe from also opening the entry.
  const [dragging, setDragging] = useState(false);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onMoveShouldSetPanResponderCapture: (_e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => setDragging(true),
        onPanResponderMove: (_e, g) => x.setValue(Math.min(0, g.dx)),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_e, g) => {
          const rm = reduceMotion;
          setTimeout(() => setDragging(false), 250);
          if (g.dx < DELETE_AT || g.vx < FLING_VELOCITY) {
            Animated.timing(x, { toValue: -600, duration: rm ? 0 : 160, useNativeDriver: false }).start(() => onDelete(entry));
          } else {
            Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: rm ? 0 : 6 }).start();
          }
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
        },
      }),
    [x, entry, onDelete, reduceMotion],
  );

  const time = formatTime(entry.createdAt);
  const label = `${entry.name}, ${formatNumber(entry.proteinG)} grams protein, ${formatNumber(entry.calories)} calories, ${time}, ${SOURCE_LABEL[entry.source]}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.behind} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <AppText variant="label" color={colors.textOnPrimary}>
          Delete
        </AppText>
      </View>
      <Animated.View style={[styles.card, { transform: [{ translateX: x }] }]} {...responder.panHandlers}>
        <Pressable
          onPress={() => {
            if (!dragging) onPress(entry);
          }}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="Opens this entry to edit. Swipe left to delete."
          accessibilityActions={[{ name: 'delete', label: 'Delete' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'delete') onDelete(entry);
          }}
          style={styles.press}
          testID={`entry-${entry.id}`}
        >
          <View style={styles.icon}>
            <AppText style={{ fontSize: 18 }}>{SOURCE_ICON[entry.source]}</AppText>
          </View>
          <View style={styles.middle}>
            <AppText variant="label" numberOfLines={1}>
              {entry.name}
            </AppText>
            <AppText variant="small" numberOfLines={1}>
              {formatNumber(entry.calories)} kcal · {time}
            </AppText>
          </View>
          <AppText variant="label" style={styles.protein}>
            {formatNumber(entry.proteinG)}
            <AppText variant="small"> g</AppText>
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, backgroundColor: colors.bad },
  behind: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'flex-end', justifyContent: 'center', paddingRight: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, ...shadow.card },
  press: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, gap: 2 },
  protein: { fontFamily: fonts.black, fontSize: 20, color: colors.primaryDark },
});
