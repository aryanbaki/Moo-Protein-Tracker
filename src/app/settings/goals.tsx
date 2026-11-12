import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button } from '../../components';
import { checkGoals, computeGoals, type GoalField } from '../../features/goals';
import { parseNumber } from '../../features/settings/export';
import { Field, Note, SettingsScreen } from '../../features/settings/ui';
import { Cow } from '../../mascot';
import { useProfile } from '../../state/profile';
import { spacing } from '../../theme';
import type { Goals } from '../../types';

const FIELDS: { key: GoalField; label: string; unit: string }[] = [
  { key: 'proteinG', label: 'Protein', unit: 'g' },
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'carbsG', label: 'Carbs', unit: 'g' },
  { key: 'fatG', label: 'Fat', unit: 'g' },
];

type Draft = Record<GoalField, string>;
const toDraft = (g: Goals): Draft => ({ proteinG: String(g.proteinG), calories: String(g.calories), carbsG: String(g.carbsG), fatG: String(g.fatG) });
const commas = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function GoalsSettings() {
  const answers = useProfile((s) => s.answers);
  const stored = useProfile((s) => s.goals);
  const [draft, setDraft] = useState<Draft>(() => toDraft(stored ?? computeGoals(answers)));

  // Unparseable or empty input becomes NaN, which checkGoals reports as blocked.
  const num = (k: GoalField) => {
    const n = parseNumber(draft[k]);
    return n === null ? Number.NaN : Math.round(n);
  };
  const goals: Goals = { proteinG: num('proteinG'), calories: num('calories'), carbsG: num('carbsG'), fatG: num('fatG') };
  const check = checkGoals(goals, answers.weightKg ?? Number.NaN, answers.sex);
  const dirty = !stored || FIELDS.some((f) => goals[f.key] !== stored[f.key]);

  const set = (k: GoalField, v: string) => {
    setDraft((d) => ({ ...d, [k]: v.replace(/[^\d]/g, '') }));
  };

  const blockedField = check.firstBlocked;
  const blocked = blockedField ? FIELDS.find((f) => f.key === blockedField) : undefined;
  const blockedCheck = blockedField ? check[blockedField] : null;
  // The value the "Use 176 g" button fills in: the near end of the recommended range.
  const recommendedValue = blockedCheck ? (blockedCheck.side === 'high' ? blockedCheck.recommended.max : blockedCheck.recommended.min) : null;

  const useRecommended = () => {
    if (!blockedField || recommendedValue === null) return;
    setDraft((d) => ({ ...d, [blockedField]: String(recommendedValue) }));
  };

  const noteFor = (k: GoalField, unit: string): { note?: string; tone: 'neutral' | 'warning' | 'bad' } => {
    const c = check[k];
    const range = `${commas(c.recommended.min)}–${commas(c.recommended.max)} ${unit}`;
    if (c.verdict === 'blocked') return { tone: 'bad', note: `Limit ${commas(c.allowed.min)}–${commas(c.allowed.max)} ${unit}` };
    if (c.verdict === 'high') return { tone: 'warning', note: `High. Suggested ${range}` };
    if (c.verdict === 'low') return { tone: 'warning', note: `Low. Suggested ${range}` };
    return { tone: 'neutral', note: k === 'proteinG' || k === 'calories' ? `Suggested ${range}` : undefined };
  };

  const save = () => {
    if (check.blocked) return;
    useProfile.getState().setGoals(goals);
    if (router.canGoBack()) router.back();
    else router.replace('/settings');
  };

  return (
    <SettingsScreen
      title="Goals"
      footer={<Button title={!check.blocked && !dirty ? 'Saved' : 'Save'} accessibilityLabel={check.blocked ? "Can't save that" : dirty ? 'Save goals' : 'Saved'} disabled={check.blocked || !dirty} onPress={save} />}
    >
      {blocked && blockedCheck && recommendedValue !== null ? (
        <Note tone="warning">
          <View style={{ alignItems: 'center', gap: spacing.sm }} accessibilityLiveRegion="polite">
            <Cow size={110} pose="shocked" accessibilityLabel="Moo the cow, shocked" />
            <AppText variant="heading" center accessibilityLabel={`${blocked.label}: recommended ${commas(blockedCheck.recommended.min)} to ${commas(blockedCheck.recommended.max)} ${blocked.unit} a day`}>
              {`${commas(blockedCheck.recommended.min)}–${commas(blockedCheck.recommended.max)} ${blocked.unit}`}
            </AppText>
            <Button title={`Use ${commas(recommendedValue)} ${blocked.unit}`} variant="secondary" onPress={useRecommended} style={{ alignSelf: 'stretch', minHeight: 50 }} />
          </View>
        </Note>
      ) : null}

      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label} accessibilityLabel={`${f.label} per day`} value={draft[f.key]} onChangeText={(v) => set(f.key, v)} suffix={f.unit} maxLength={5} {...noteFor(f.key, f.unit)} />
      ))}

      <Button title="Recalculate" accessibilityLabel="Recalculate from my details" variant="ghost" onPress={() => setDraft(toDraft(computeGoals(answers)))} />
    </SettingsScreen>
  );
}
