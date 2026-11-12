/** Small UI kit shared by the Settings screens (and the Progress tab's segmented control). */
import { router } from 'expo-router';
import { Children, Fragment, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { AppText, Button, Card, Screen } from '../../components';
import { colors, fonts, radius, spacing } from '../../theme';

export function SettingsScreen({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  const back = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  return (
    <Screen scroll footer={footer}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={back} style={styles.back}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </AppText>
      </View>
      {children}
    </Screen>
  );
}

/** A titled card whose children are separated by hairlines. */
export function Group({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: spacing.sm }}>
      {title ? (
        <AppText variant="small" accessibilityRole="header" style={styles.groupTitle}>
          {title.toUpperCase()}
        </AppText>
      ) : null}
      <Card style={styles.group}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={styles.divider} /> : null}
            {child}
          </Fragment>
        ))}
      </Card>
      {footer ? <AppText variant="small" style={styles.groupFooter}>{footer}</AppText> : null}
    </View>
  );
}

export interface RowProps {
  label: string;
  sublabel?: string;
  value?: string;
  emoji?: string;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Replaces the chevron. */
  right?: ReactNode;
}

export function Row({ label, sublabel, value, emoji, onPress, danger, disabled, right }: RowProps) {
  const body = (
    <>
      {emoji ? <Text style={styles.rowEmoji}>{emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <AppText variant="label" color={danger ? colors.bad : colors.text}>{label}</AppText>
        {sublabel ? <AppText variant="caption">{sublabel}</AppText> : null}
      </View>
      {value ? <AppText variant="caption" numberOfLines={1} style={styles.rowValue}>{value}</AppText> : null}
      {right ?? (onPress ? <Text style={styles.chevron}>›</Text> : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.45 : pressed ? 0.6 : 1 }]}
    >
      {body}
    </Pressable>
  );
}

export function ToggleRow({ label, sublabel, value, onChange, disabled }: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <AppText variant="label">{label}</AppText>
        {sublabel ? <AppText variant="caption">{sublabel}</AppText> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.fill }}
        thumbColor={colors.surface}
        // react-native-web only
        {...({ activeThumbColor: colors.surface, activeTrackColor: colors.fill } as object)}
      />
    </View>
  );
}

export interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  suffix?: string;
  /** Shown under the field. */
  note?: string;
  tone?: 'neutral' | 'warning' | 'bad';
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'characters';
}

export function Field({ label, value, onChangeText, suffix, note, tone = 'neutral', keyboardType = 'number-pad', placeholder, maxLength = 6, autoCapitalize }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const toneColor = tone === 'bad' ? colors.bad : tone === 'warning' ? colors.warning : focused ? colors.primary : colors.border;
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.field, { borderColor: toneColor }]}>
        <TextInput
          accessibilityLabel={suffix ? `${label}, ${suffix}` : label}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          inputMode={keyboardType === 'decimal-pad' ? 'decimal' : keyboardType === 'number-pad' ? 'numeric' : 'text'}
          placeholder={placeholder}
          placeholderTextColor={colors.border}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.fieldInput}
        />
        {suffix ? <AppText variant="label" color={colors.textSecondary}>{suffix}</AppText> : null}
      </View>
      {note ? (
        <AppText variant="caption" color={tone === 'bad' ? colors.bad : colors.textSecondary} accessibilityLiveRegion="polite">
          {tone === 'bad' ? '⛔ ' : tone === 'warning' ? '⚠️ ' : ''}
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

export function Stepper({ label, valueText, onDec, onInc, decLabel, incLabel, disabled }: { label: string; valueText: string; onDec: () => void; onInc: () => void; decLabel: string; incLabel: string; disabled?: boolean }) {
  return (
    <View style={[styles.row, { opacity: disabled ? 0.45 : 1 }]}>
      <AppText variant="label" style={{ flex: 1 }}>{label}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={decLabel} disabled={disabled} onPress={onDec} style={styles.stepBtn}>
        <Text style={styles.stepGlyph}>−</Text>
      </Pressable>
      <AppText variant="label" center style={styles.stepValue} accessibilityLiveRegion="polite">{valueText}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={incLabel} disabled={disabled} onPress={onInc} style={styles.stepBtn}>
        <Text style={styles.stepGlyph}>+</Text>
      </Pressable>
    </View>
  );
}

export interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string; badge?: string }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel: string;
}

export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.segmented}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityLabel={o.badge ? `${o.label}, premium` : o.label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on ? styles.segmentOn : null]}
          >
            <Text style={[styles.segmentText, on ? { color: colors.textOnPrimary } : null]}>
              {o.label}
              {o.badge ? ` ${o.badge}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  /** When set, the user has to type this word before the confirm button works. */
  requireText?: string;
  busy?: boolean;
  error?: string | null;
  top?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Destructive confirmation. A Modal instead of Alert so it also works on web. */
export function ConfirmModal({ visible, title, body, confirmLabel, requireText, busy, error, top, onConfirm, onCancel }: ConfirmModalProps) {
  const [typed, setTyped] = useState('');
  const ok = !requireText || typed.trim().toUpperCase() === requireText.toUpperCase();
  const close = () => {
    setTyped('');
    onCancel();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.modalBackdrop}>
        <View accessibilityViewIsModal style={styles.modalCard}>
          {top ? <View style={{ alignItems: 'center' }}>{top}</View> : null}
          <AppText variant="heading" center>{title}</AppText>
          <AppText variant="body" center color={colors.textSecondary}>{body}</AppText>
          {requireText ? (
            <Field label={`Type ${requireText} to confirm`} value={typed} onChangeText={setTyped} keyboardType="default" autoCapitalize="characters" maxLength={20} placeholder={requireText} />
          ) : null}
          {error ? <AppText variant="caption" color={colors.bad} center>{error}</AppText> : null}
          <Button
            title={busy ? 'Working…' : confirmLabel}
            variant="danger"
            disabled={!ok || busy}
            onPress={() => {
              setTyped('');
              onConfirm();
            }}
          />
          <Button title="Cancel" variant="ghost" onPress={close} />
        </View>
      </View>
    </Modal>
  );
}

/** Soft coloured note box. */
export function Note({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warning' }) {
  const bg = tone === 'good' ? colors.primarySoft : colors.surfaceAlt;
  return (
    <View style={[styles.note, { backgroundColor: bg }, tone === 'warning' ? { borderWidth: 2, borderColor: colors.warning } : null]}>
      {typeof children === 'string' ? <AppText variant="caption" color={colors.text}>{children}</AppText> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  back: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backGlyph: { fontSize: 32, lineHeight: 34, color: colors.text, fontFamily: fonts.regular, marginTop: -4 },
  groupTitle: { letterSpacing: 1, marginLeft: spacing.sm, fontFamily: fonts.bold },
  groupFooter: { marginHorizontal: spacing.sm },
  group: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rowEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  rowValue: { maxWidth: '48%', textAlign: 'right' },
  chevron: { fontSize: 26, lineHeight: 28, color: colors.textSecondary, fontFamily: fonts.regular, marginTop: -3 },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, borderRadius: radius.md, borderWidth: 2, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  fieldInput: { flex: 1, minWidth: 0, fontFamily: fonts.bold, fontSize: 20, color: colors.text, paddingVertical: spacing.sm, ...({ outlineStyle: 'none' } as object) },
  stepBtn: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepGlyph: { fontSize: 24, lineHeight: 26, color: colors.primaryDark, fontFamily: fonts.black },
  stepValue: { minWidth: 84 },
  segmented: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4 },
  segment: { flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  segmentOn: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textSecondary },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  note: { borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
});
