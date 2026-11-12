import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef, type Ref } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button } from '../../components';
import { dayName } from '../../features/home/copy';
import { successHaptic, tapHaptic, warningHaptic } from '../../features/home/haptics';
import { isValidDay, MAX_NAME_LENGTH, useLog } from '../../features/log';
import {
  addGrams,
  amountToText,
  emptyForm,
  pressKey,
  sanitizeAmountInput,
  validateEntryForm,
  type EntryFormErrors,
  type EntryFormValues,
  type KeypadKey,
} from '../../features/log/form';
import { localDay } from '../../lib/date';
import { Cow } from '../../mascot';
import { colors, fonts, radius, spacing } from '../../theme';
import type { FoodEntry } from '../../types';

type InputRef = ComponentRef<typeof TextInput>;

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function EntryScreen() {
  const params = useLocalSearchParams<{ mode?: string; id?: string; day?: string }>();
  const id = one(params.id);
  const dayParam = one(params.day);
  const day = isValidDay(dayParam) && dayParam <= localDay() ? dayParam : undefined;
  // Read once: the form must not reset if the store changes underneath it.
  const existing = useMemo(() => (id ? useLog.getState().entries.find((e) => e.id === id) : undefined), [id]);

  if (id && !existing) return <Missing />;
  if (existing) return <EntryForm kind="edit" existing={existing} />;
  return <EntryForm kind={one(params.mode) === 'quick' ? 'quick' : 'manual'} day={day} />;
}

function Missing() {
  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Entry" />
      <View style={styles.missing}>
        <Cow size={180} pose="shrug" />
        <AppText variant="heading" center>
          Not found
        </AppText>
        <Button title="Back" onPress={close} style={{ alignSelf: 'stretch' }} />
      </View>
    </SafeAreaView>
  );
}

/** `tag` is a single word shown next to the title, e.g. the day when it is not today. */
function Header({ title, tag }: { title: string; tag?: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {tag ? (
          <View style={styles.tag}>
            <AppText variant="small" color={colors.primaryDark}>
              {tag}
            </AppText>
          </View>
        ) : null}
      </View>
      <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={styles.close} testID="entry-close">
        <AppText variant="label" color={colors.textSecondary}>
          ✕
        </AppText>
      </Pressable>
    </View>
  );
}

interface EntryFormProps {
  kind: 'quick' | 'manual' | 'edit';
  existing?: FoodEntry;
  day?: string;
}

function EntryForm({ kind, existing, day }: EntryFormProps) {
  const [values, setValues] = useState<EntryFormValues>(() =>
    existing
      ? {
          name: existing.name,
          protein: amountToText(existing.proteinG),
          calories: amountToText(existing.calories, true),
          carbs: amountToText(existing.carbsG, true),
          fat: amountToText(existing.fatG, true),
        }
      : emptyForm(),
  );
  const [errors, setErrors] = useState<EntryFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const proteinRef = useRef<InputRef>(null);
  const caloriesRef = useRef<InputRef>(null);

  const set = (field: keyof EntryFormValues, text: string) => {
    setValues((v) => ({ ...v, [field]: field === 'name' ? text : sanitizeAmountInput(text) }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    setSaveError(null);
  };

  const isQuick = kind === 'quick';

  const save = async () => {
    if (busy) return;
    const result = validateEntryForm(values, isQuick ? 'quick' : 'manual');
    if (!result.ok) {
      setErrors(result.errors);
      warningHaptic();
      return;
    }
    setBusy(true);
    try {
      if (existing) await useLog.getState().updateEntry(existing.id, result.entry);
      else await useLog.getState().addEntry({ ...result.entry, source: isQuick ? 'quick' : 'manual', ...(day ? { day } : null) });
      successHaptic();
      close();
    } catch (e) {
      setBusy(false);
      setSaveError(e instanceof Error && e.name === 'LogValidationError' ? e.message : 'Not saved');
    }
  };

  const remove = async () => {
    if (!existing || busy) return;
    setBusy(true);
    try {
      await useLog.getState().deleteEntry(existing.id);
      close();
    } catch {
      setBusy(false);
      setSaveError('Not deleted');
    }
  };

  const title = kind === 'edit' ? 'Edit' : isQuick ? 'Quick add' : 'Add food';
  const entryDay = existing?.day ?? day;
  const tag = entryDay && entryDay !== localDay() ? dayName(entryDay) : undefined;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header title={title} tag={tag} />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {isQuick ? (
            <QuickPad
              value={values.protein}
              error={errors.protein}
              onChange={(text) => {
                setValues((v) => ({ ...v, protein: text }));
                setErrors((e) => ({ ...e, protein: undefined }));
              }}
            />
          ) : (
            <>
              <Field label="Name" error={errors.name} value={values.name} onChangeText={(t) => set('name', t)} placeholder="Chicken burrito" maxLength={MAX_NAME_LENGTH} autoCapitalize="sentences" autoFocus={kind === 'manual'} returnKeyType="next" onSubmitEditing={() => proteinRef.current?.focus()} testID="field-name" />
              <Field ref={proteinRef} label="Protein" unit="g" big error={errors.protein} value={values.protein} onChangeText={(t) => set('protein', t)} placeholder="0" keyboardType="decimal-pad" inputMode="decimal" returnKeyType="next" onSubmitEditing={() => caloriesRef.current?.focus()} testID="field-protein" />
            </>
          )}

          <View style={styles.row}>
            <Field ref={caloriesRef} style={{ flex: 1 }} label="Calories" unit="kcal" error={errors.calories} value={values.calories} onChangeText={(t) => set('calories', t)} placeholder={isQuick ? 'optional' : '0'} keyboardType="decimal-pad" inputMode="decimal" testID="field-calories" />
            {isQuick ? (
              <Field style={{ flex: 1.3 }} label="Name" error={errors.name} value={values.name} onChangeText={(t) => set('name', t)} placeholder="optional" maxLength={MAX_NAME_LENGTH} testID="field-name" />
            ) : null}
          </View>
          {!isQuick ? (
            <View style={styles.row}>
              <Field style={{ flex: 1 }} label="Carbs" unit="g" error={errors.carbs} value={values.carbs} onChangeText={(t) => set('carbs', t)} placeholder="0" keyboardType="decimal-pad" inputMode="decimal" testID="field-carbs" />
              <Field style={{ flex: 1 }} label="Fat" unit="g" error={errors.fat} value={values.fat} onChangeText={(t) => set('fat', t)} placeholder="0" keyboardType="decimal-pad" inputMode="decimal" testID="field-fat" />
            </View>
          ) : null}

          {saveError ? (
            <AppText variant="caption" color={colors.bad} accessibilityLiveRegion="polite">
              {saveError}
            </AppText>
          ) : null}

          {existing ? (
            confirmDelete ? (
              <View style={styles.row} testID="confirm-delete">
                <Button title="Cancel" variant="secondary" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }} testID="delete-cancel" />
                <Button title="Delete" variant="danger" onPress={remove} disabled={busy} accessibilityLabel={`Delete ${existing.name}`} style={{ flex: 1 }} testID="delete-confirm" />
              </View>
            ) : (
              <Button title="Delete" variant="ghost" onPress={() => setConfirmDelete(true)} testID="delete-entry" />
            )
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button title={existing ? 'Save' : 'Add'} onPress={save} disabled={busy} testID="entry-save" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Quick add: big number, chips, keypad ---------- */

const KEYS: KeypadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];
const CHIPS = [10, 20, 30];

function QuickPad({ value, error, onChange }: { value: string; error?: string; onChange: (text: string) => void }) {
  return (
    <View style={styles.pad}>
      <View accessible accessibilityRole="text" accessibilityLabel={`${value || '0'} grams of protein`} accessibilityLiveRegion="polite" style={styles.display}>
        <AppText variant="display" color={value ? colors.text : colors.border} style={styles.displayNumber} testID="quick-display">
          {value || '0'}
        </AppText>
        <AppText variant="heading" color={colors.textSecondary}>
          {' '}
          g
        </AppText>
      </View>
      <AppText variant="caption" center color={error ? colors.bad : colors.textSecondary} accessibilityLiveRegion="polite" testID="quick-hint">
        {error ?? 'protein'}
      </AppText>
      <View style={styles.chips}>
        {CHIPS.map((g) => (
          <Pressable
            key={g}
            onPress={() => {
              tapHaptic();
              onChange(addGrams(value, g));
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add ${g} grams`}
            style={({ pressed }) => [styles.chip, pressed ? { opacity: 0.8 } : null]}
            testID={`chip-${g}`}
          >
            <AppText variant="label" color={colors.primaryDark}>
              +{g}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.keys}>
        {KEYS.map((k) => (
          <Pressable
            key={k}
            onPress={() => {
              tapHaptic();
              onChange(pressKey(value, k));
            }}
            onLongPress={k === 'back' ? () => onChange('') : undefined}
            accessibilityRole="button"
            accessibilityLabel={k === 'back' ? 'Delete last digit' : k === '.' ? 'Decimal point' : k}
            style={({ pressed }) => [styles.key, pressed ? styles.keyPressed : null]}
            testID={`key-${k}`}
          >
            <AppText style={styles.keyText}>{k === 'back' ? '⌫' : k}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ---------- Labelled field with inline error ---------- */

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  unit?: string;
  error?: string;
  big?: boolean;
  style?: object;
  ref?: Ref<InputRef>;
}

function Field({ label, unit, error, big, style, ref, ...input }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      <AppText variant="caption" color={error ? colors.bad : colors.textSecondary}>
        {label}
      </AppText>
      <View style={[styles.inputWrap, big ? styles.inputWrapBig : null, focused ? styles.inputFocused : null, error ? styles.inputError : null]}>
        <TextInput
          ref={ref}
          {...input}
          accessibilityLabel={unit ? `${label}, ${unit}` : label}
          aria-invalid={!!error}
          placeholderTextColor={colors.border}
          selectionColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[styles.input, big ? styles.inputBig : null]}
        />
        {unit ? (
          <AppText variant="caption" style={{ marginLeft: 6 }}>
            {unit}
          </AppText>
        ) : null}
      </View>
      {error ? (
        <AppText variant="small" color={colors.bad} accessibilityLiveRegion="polite" testID={`${input.testID ?? 'field'}-error`}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg, gap: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm + 4, alignItems: 'flex-start' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  tag: { paddingHorizontal: spacing.sm + 4, minHeight: 26, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },

  pad: { gap: spacing.sm + 2 },
  display: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  displayNumber: { fontSize: 76, lineHeight: 84 },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm + 2 },
  chip: { minHeight: 44, minWidth: 76, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  keys: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  key: { width: '31.5%', height: 58, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  keyPressed: { backgroundColor: colors.surfaceAlt, transform: [{ scale: 0.97 }] },
  keyText: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },

  inputWrap: { flexDirection: 'row', alignItems: 'center', minHeight: 56, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  inputWrapBig: { minHeight: 72 },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.bad },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.medium, fontSize: 18, color: colors.text, paddingVertical: 10, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
  inputBig: { fontFamily: fonts.black, fontSize: 32 },
});
