import { memo, type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radius } from '../theme';

export interface WheelPickerProps<T extends string | number> {
  /** Ordered values. Must be unique. */
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** Text shown on the wheel for a value. Defaults to String(value). */
  format?: (value: T) => string;
  /** Read by screen readers, e.g. "Height". */
  accessibilityLabel: string;
  /** Spoken value, e.g. "175 centimetres". Defaults to format(value). */
  accessibilityValueText?: (value: T) => string;
  /** Row height in points; at least 44 for touch. */
  itemHeight?: number;
  /** Odd number of rows on show (3, 5 or 7). */
  visibleCount?: number;
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const isWeb = Platform.OS === 'web';

/**
 * Snap-scrolling wheel. Works on iOS (snapToInterval) and on web (CSS scroll
 * snap); rows can also be tapped, and on web the arrow keys step the value.
 * For assistive tech it is one "adjustable" control with increment/decrement.
 */
export function WheelPicker<T extends string | number>({
  values,
  value,
  onChange,
  format,
  accessibilityLabel,
  accessibilityValueText,
  itemHeight = 44,
  visibleCount = 5,
  width,
  style,
  testID,
}: WheelPickerProps<T>) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const label = useCallback((v: T) => (format ? format(v) : String(v)), [format]);
  const count = values.length;
  const clamp = useCallback((i: number) => Math.max(0, Math.min(count - 1, i)), [count]);

  const valueIndex = useMemo(() => {
    const i = values.indexOf(value);
    return i < 0 ? 0 : i;
  }, [values, value]);

  // Row currently under the highlight (follows the finger while scrolling).
  const [liveIndex, setLiveIndex] = useState(valueIndex);
  // Last index this wheel reported, so prop echoes do not fight the scroll.
  const reported = useRef(valueIndex);
  const pad = ((visibleCount - 1) / 2) * itemHeight;
  const height = visibleCount * itemHeight;

  const scrollToIndex = useCallback(
    (i: number, animated: boolean) => {
      scrollRef.current?.scrollTo({ y: i * itemHeight, animated });
    },
    [itemHeight],
  );

  // Initial position (web has no contentOffset prop support we can rely on).
  useEffect(() => {
    const id = requestAnimationFrame(() => scrollToIndex(reported.current, false));
    return () => cancelAnimationFrame(id);
  }, [scrollToIndex]);

  // Follow value changes that came from outside (not from our own scroll).
  useEffect(() => {
    if (valueIndex !== reported.current) {
      reported.current = valueIndex;
      setLiveIndex(valueIndex);
      scrollToIndex(valueIndex, false);
    }
  }, [valueIndex, scrollToIndex]);

  const report = useCallback(
    (i: number) => {
      const idx = clamp(i);
      setLiveIndex(idx);
      if (idx !== reported.current) {
        reported.current = idx;
        const v = values[idx];
        if (v !== undefined) onChange(v);
      }
    },
    [clamp, onChange, values],
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      report(Math.round(e.nativeEvent.contentOffset.y / itemHeight));
    },
    [itemHeight, report],
  );

  const step = useCallback(
    (delta: number) => {
      const idx = clamp(reported.current + delta);
      scrollToIndex(idx, !isWeb);
      report(idx);
    },
    [clamp, report, scrollToIndex],
  );

  const onAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      if (e.nativeEvent.actionName === 'increment') step(1);
      if (e.nativeEvent.actionName === 'decrement') step(-1);
    },
    [step],
  );

  const onRowPress = useCallback(
    (i: number) => {
      scrollToIndex(i, true);
      if (isWeb) report(i);
    },
    [report, scrollToIndex],
  );

  const current = values[liveIndex] ?? value;
  const spoken = accessibilityValueText ? accessibilityValueText(current) : label(current);

  // Web: keyboard support and native slider semantics.
  const webProps = isWeb
    ? ({
        tabIndex: 0,
        onKeyDown: (e: { key: string; preventDefault: () => void }) => {
          const map: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, PageDown: 5, PageUp: -5 };
          const d = map[e.key];
          if (d !== undefined) {
            e.preventDefault();
            step(d);
          } else if (e.key === 'Home') {
            e.preventDefault();
            step(-count);
          } else if (e.key === 'End') {
            e.preventDefault();
            step(count);
          }
        },
      } as object)
    : null;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: spoken, min: 0, max: Math.max(0, count - 1), now: liveIndex }}
      accessibilityActions={[
        { name: 'increment', label: 'Next value' },
        { name: 'decrement', label: 'Previous value' },
      ]}
      onAccessibilityAction={onAccessibilityAction}
      {...webProps}
      style={[styles.wrap, { height, width }, isWeb ? (webFocus as ViewStyle) : null, style]}
    >
      <View pointerEvents="none" style={[styles.highlight, { top: pad, height: itemHeight }]} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={itemHeight}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentOffset={{ x: 0, y: valueIndex * itemHeight }}
        contentContainerStyle={{ paddingVertical: pad }}
        style={isWeb ? (webScroll as ViewStyle) : undefined}
        // The wheel is one control for assistive tech; rows stay out of the tree.
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {values.map((v, i) => (
          <Row key={String(v)} index={i} text={label(v)} distance={Math.min(2, Math.abs(i - liveIndex))} height={itemHeight} onPress={onRowPress} />
        ))}
      </ScrollView>
    </View>
  );
}

interface RowProps {
  index: number;
  text: string;
  /** 0 = selected, 1 = neighbour, 2 = further away. */
  distance: number;
  height: number;
  onPress: (index: number) => void;
}

/** Memoised so a long wheel only re-renders the few rows whose look changed. */
const Row = memo(function Row({ index, text, distance, height, onPress }: RowProps) {
  return (
    <Pressable accessible={false} focusable={false} onPress={() => onPress(index)} style={[styles.item, { height }, isWeb ? (webItem as ViewStyle) : null]}>
      <Text numberOfLines={1} style={[styles.text, distance === 0 ? styles.textSelected : null, { opacity: distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25 }]}>
        {text}
      </Text>
    </Pressable>
  );
});

// react-native-web passes unknown style keys through to CSS.
const webScroll = { scrollSnapType: 'y mandatory', overscrollBehavior: 'contain', scrollbarWidth: 'none' };
const webFocus = { outlineColor: colors.primary, outlineOffset: 2 };
const webItem = { scrollSnapAlign: 'center', cursor: 'pointer', userSelect: 'none' };

const styles = StyleSheet.create({
  wrap: { minWidth: 96, overflow: 'hidden', borderRadius: radius.md },
  highlight: { position: 'absolute', left: 0, right: 0, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  item: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  text: { fontFamily: fonts.bold, fontSize: 20, color: colors.textSecondary },
  textSelected: { fontFamily: fonts.black, fontSize: 24, color: colors.primaryDark },
});
