/** Small controls shared by the Cow Lab views. */
import { type ReactNode, useId, useRef } from 'react';
import { type GestureResponderEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { type CowSkin, CowRig, getAnimation } from '../../mascot';
import { colors, fonts, radius, spacing } from '../../theme';

export function useUid(prefix: string): string {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

export function Chip({ label, on, onPress, small = false, testID }: { label: string; on: boolean; onPress: () => void; small?: boolean; testID?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} testID={testID} style={[styles.chip, small ? styles.chipSmall : null, on ? styles.chipOn : null]}>
      <AppText variant="label" color={on ? colors.textOnPrimary : colors.text} numberOfLines={1} style={small ? styles.chipSmallText : null}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Round button with a single glyph; `label` is for screen readers only. */
export function IconButton({ glyph, label, onPress, on = false, disabled = false, glyphSize = 20, testID }: { glyph: string; label: string; onPress: () => void; on?: boolean; disabled?: boolean; glyphSize?: number; testID?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on, disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      hitSlop={6}
      style={({ pressed }) => [styles.icon, on ? styles.chipOn : null, { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}
    >
      <AppText variant="label" color={on ? colors.textOnPrimary : colors.text} style={[styles.glyph, { fontSize: glyphSize, lineHeight: glyphSize + 4 }]}>
        {glyph}
      </AppText>
    </Pressable>
  );
}

const THUMB = 46;

function SkinThumb({ skin, on, onPress }: { skin: CowSkin; on: boolean; onPress: () => void }) {
  const uid = useUid('thumb');
  const hb = skin.headBox;
  // Fit the head crop inside the circle whatever its aspect ratio.
  const size = Math.round((THUMB - 8) * Math.min(1, hb.w / hb.h));
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={skin.name} accessibilityState={{ selected: on }} onPress={onPress} testID={`skin-${skin.id}`} style={styles.thumbCell}>
      <View style={[styles.thumb, on ? styles.thumbOn : null]}>
        <CowRig skin={skin} animation={getAnimation('breathe')} size={size} headOnly reduced uid={uid} />
      </View>
      <AppText variant="small" center numberOfLines={1} color={on ? colors.primaryDark : colors.textSecondary} style={on ? styles.nameOn : null}>
        {skin.name}
      </AppText>
    </Pressable>
  );
}

/** Skin thumbnails in a row; `trailing` sits after the last one (the Reduce Motion toggle). */
export function SkinPicker({ skins, value, onChange, trailing }: { skins: readonly CowSkin[]; value: string; onChange: (id: string) => void; trailing?: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.picker} testID="skin-picker">
      {skins.map((s) => (
        <SkinThumb key={s.id} skin={s} on={s.id === value} onPress={() => onChange(s.id)} />
      ))}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </ScrollView>
  );
}

/** Horizontal 0..1 slider: tap or drag anywhere on the track. */
export function LevelSlider({ value, onChange, testID }: { value: number; onChange: (v: number) => void; testID?: string }) {
  const width = useRef(1);
  const set = (e: GestureResponderEvent) => {
    const v = Math.max(0, Math.min(1, e.nativeEvent.locationX / width.current));
    onChange(Math.round(v * 20) / 20);
  };
  const pct = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const;
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      testID={testID}
      style={styles.slider}
      onLayout={(e) => {
        width.current = Math.max(1, e.nativeEvent.layout.width);
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={set}
      onResponderMove={set}
    >
      <View style={[styles.track, { pointerEvents: 'none' }]}>
        <View style={[styles.trackOn, { width: pct }]} />
      </View>
      <View style={[styles.knobRail, { pointerEvents: 'none' }]}>
        <View style={[styles.knob, { left: pct }]} />
      </View>
    </View>
  );
}

const KNOB = 24;

const styles = StyleSheet.create({
  noGrow: { flexGrow: 0 },
  chip: { paddingHorizontal: spacing.md, height: 38, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  chipSmall: { paddingHorizontal: 11, height: 34 },
  chipSmallText: { fontSize: 14 },
  chipOn: { backgroundColor: colors.primary },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  glyph: { textAlign: 'center' },
  trailing: { height: THUMB + 6, justifyContent: 'center', marginLeft: 2 },
  picker: { gap: 2, paddingHorizontal: spacing.md, flexGrow: 1, justifyContent: 'center' },
  thumbCell: { width: 61, alignItems: 'center', gap: 2 },
  thumb: { width: THUMB + 6, height: THUMB + 6, borderRadius: (THUMB + 6) / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.border },
  thumbOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  nameOn: { fontFamily: fonts.bold },
  slider: { flex: 1, height: 42, justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  trackOn: { height: 8, backgroundColor: colors.fill },
  knobRail: { position: 'absolute', left: 0, right: KNOB, top: (42 - KNOB) / 2, height: KNOB },
  knob: { position: 'absolute', width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.primary },
});
