import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '../../components';
import { colors, fonts, radius, spacing } from '../../theme';
import type { GoalField, GoalRange } from '../goals';
import { GOAL_META, formatNumber } from './format';

export interface GoalEditSheetProps {
  /** Field being edited, or null when the sheet is closed. */
  field: GoalField | null;
  /** Current value of that field. */
  value: number;
  /** Everyday range shown as a hint. */
  recommended?: GoalRange;
  onSave: (field: GoalField, value: number) => void;
  onClose: () => void;
}

/** Bottom sheet with one numeric field, used to edit a single daily goal. */
export function GoalEditSheet({ field, value, recommended, onSave, onClose }: GoalEditSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!field} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.grabber} />
          {/* key: a fresh field starts from that field's current value */}
          {field ? <SheetBody key={field} field={field} value={value} recommended={recommended} onSave={onSave} onClose={onClose} /> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetBody({ field, value, recommended, onSave, onClose }: GoalEditSheetProps & { field: GoalField }) {
  const [text, setText] = useState(() => String(Math.round(value)));
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    // Focus after the sheet has slid in (autoFocus is unreliable inside Modal).
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, []);

  const meta = GOAL_META[field];
  const parsed = Number.parseInt(text, 10);
  const valid = text.length > 0 && Number.isFinite(parsed);
  const save = () => {
    if (valid) onSave(field, parsed);
  };

  return (
    <>
      <AppText accessibilityRole="header" variant="heading" center>
        Daily {meta.short}
      </AppText>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          testID="goal-input"
          accessibilityLabel={`Daily ${meta.short} in ${meta.unit}`}
          value={text}
          onChangeText={(t) => setText(t.replace(/[^0-9]/g, '').slice(0, 5))}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          onSubmitEditing={save}
          selectTextOnFocus
          maxLength={5}
          style={styles.input}
        />
        <AppText variant="heading" color={colors.textSecondary}>
          {meta.unit}
        </AppText>
      </View>
      {recommended ? (
        <AppText variant="caption" center>
          Typical for you: {formatNumber(recommended.min)}–{formatNumber(recommended.max)} {meta.unit}
        </AppText>
      ) : null}
      <View style={styles.buttons}>
        <Button title="Save" onPress={save} disabled={!valid} />
        <Button title="Cancel" variant="ghost" onPress={onClose} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
  inputRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: spacing.sm },
  input: { minWidth: 150, minHeight: 72, textAlign: 'center', fontFamily: fonts.black, fontSize: 48, color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary, paddingHorizontal: spacing.md },
  buttons: { gap: spacing.xs },
});
