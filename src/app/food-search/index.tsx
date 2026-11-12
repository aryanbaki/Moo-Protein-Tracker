/** Search the free food databases by name, pick a food, adjust servings, log it. */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components';
import { foods, foodToScannedItem, FoodLookupError, type FoodItem } from '../../features/foods';
import { unitGramsOf } from '../../features/foods/amount';
import { PROVIDER_NAME, proteinLine, resultA11yLabel, SEARCH_ERRORS, sourceLine } from '../../features/foods/copy';
import { displayName } from '../../features/foods/toScan';
import { GramsInput } from '../../features/foods/ui/GramsInput';
import { NutritionFacts } from '../../features/foods/ui/NutritionFacts';
import { isValidDay, useLog } from '../../features/log';
import { toEditable, totalsOf, type EditableItem } from '../../features/scan/totals';
import { CloseButton } from '../../features/scan/ui/parts';
import { ResultView } from '../../features/scan/ui/ResultView';
import { colors, fonts, radius, shadow, spacing } from '../../theme';

const DEBOUNCE_MS = 450;
const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

type State = { k: 'idle' } | { k: 'loading' } | { k: 'done'; results: FoodItem[] } | { k: 'error'; message: string };

export default function FoodSearchScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const dayParam = one(params.day);
  const day = dayParam && isValidDay(dayParam) ? dayParam : undefined;

  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>({ k: 'idle' });
  const [picked, setPicked] = useState<{ food: FoodItem; items: EditableItem[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const job = useRef(0);

  useEffect(() => {
    const q = query.trim();
    const id = ++job.current;
    if (q.length < 2) return;
    const t = setTimeout(() => {
      setState({ k: 'loading' });
      foods()
        .search(q)
        .then((results) => id === job.current && setState({ k: 'done', results }))
        .catch((e: unknown) => {
          if (id !== job.current) return;
          const code = e instanceof FoodLookupError && e.code !== 'invalid' ? e.code : 'server';
          setState({ k: 'error', message: SEARCH_ERRORS[code] });
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const save = async (items: EditableItem[]) => {
    setSaving(true);
    try {
      const t = totalsOf(items);
      const name = items.map((i) => i.name).join(', ').slice(0, 120) || 'Food';
      // Logged as 'manual': the entry source list is shared with sync and the database schema.
      await useLog.getState().addEntry({ name, proteinG: Math.round(t.proteinG), calories: Math.round(t.calories), carbsG: Math.round(t.carbsG), fatG: Math.round(t.fatG), source: 'manual', day });
      close();
    } catch {
      setSaving(false);
      setState({ k: 'error', message: SEARCH_ERRORS.server });
      setPicked(null);
    }
  };

  // Too short to search: always the hint, whatever an earlier search left behind.
  const view: State = query.trim().length < 2 ? { k: 'idle' } : state;

  if (picked) {
    const { food, items } = picked;
    // Weight of what is being logged: label servings × serving weight, else 100 g portions.
    // Grams in one "serving" of the item: the label serving, or 100 g when the food has no serving. Null for "1 bar" without a weight.
    const unitGrams = unitGramsOf(food);
    const grams = unitGrams ? unitGrams * (items[0]?.servings ?? 1) : null;
    return (
      <ResultView
        items={items}
        source="barcode"
        mock={false}
        saving={saving}
        onChange={(next) => setPicked({ food, items: next })}
        onSave={() => void save(items)}
        onRetake={() => setPicked(null)}
        retakeLabel="Back"
        onClose={close}
      >
        {items[0] && unitGrams ? <GramsInput servingGrams={unitGrams} servings={items[0].servings} onServings={(servings) => setPicked({ food, items: items.map((i, n) => (n === 0 ? { ...i, servings } : i)) })} /> : null}
        {food.panel && grams ? <NutritionFacts panel={food.panel} grams={grams} source={(food.reliability?.sources ?? [food.provider]).map((p) => PROVIDER_NAME[p]).join(' + ')} /> : null}
      </ResultView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <AppText variant="heading" style={{ flex: 1 }}>Search</AppText>
        <CloseButton onPress={close} />
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Chicken breast, whey, Quest bar…"
        placeholderTextColor={colors.textSecondary}
        autoFocus
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Search foods"
        style={styles.input}
        testID="food-search-input"
      />
      {view.k === 'loading' ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null}
      {view.k === 'error' ? <AppText variant="caption" center style={{ marginTop: spacing.lg }}>{view.message}</AppText> : null}
      {view.k === 'idle' ? (
        <AppText variant="small" center style={{ marginTop: spacing.lg }}>USDA · Open Food Facts</AppText>
      ) : null}
      {view.k === 'done' ? (
        <FlatList
          data={view.results}
          keyExtractor={(f) => f.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
          ListEmptyComponent={<AppText variant="caption" center style={{ marginTop: spacing.lg }}>Nothing found</AppText>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setPicked({ food: item, items: toEditable([foodToScannedItem(item)]) })}
              accessibilityRole="button"
              accessibilityLabel={resultA11yLabel(item)}
              style={({ pressed }) => [styles.row, pressed ? { opacity: 0.85 } : null]}
            >
              <View style={{ flex: 1 }}>
                <AppText variant="label" numberOfLines={2}>{displayName(item)}</AppText>
                <AppText variant="caption" numberOfLines={1}>{proteinLine(item)}</AppText>
                <AppText variant="small">{sourceLine(item)}</AppText>
              </View>
              <AppText variant="label" color={colors.textSecondary}>›</AppText>
            </Pressable>
          )}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  input: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, fontFamily: fonts.medium, fontSize: 18, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, ...shadow.card },
});
