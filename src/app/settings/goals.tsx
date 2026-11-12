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
  const [recalculated, setRecalculated] = useState(false);

  // Unparseable or empty input becomes NaN, which checkGoals reports as blocked.
  const num = (k: GoalField) => {
    const n = parseNumber(draft[k]);
    return n === null ? Number.NaN : Math.round(n);
  };
  const goals: Goals = { proteinG: num('proteinG'), calories: num('calories'), carbsG: num('carbsG'), fatG: num('fatG') };
  const check = checkGoals(goals, answers.weightKg ?? Number.NaN, answers.sex);
  const dirty = !stored || FIELDS.some((f) => goals[f.key] !== stored[f.key]);
  const macroKcal = goals.proteinG * 4 + goals.carbsG * 4 + goals.fatG * 9;

  const set = (k: GoalField, v: string) => {
    setDraft((d) => ({ ...d, [k]: v.replace(/[^\d]/g, '') }));
    setRecalculated(false);
  };

  const blockedField = check.firstBlocked;
  const blocked = blockedField ? FIELDS.find((f) => f.key === blockedField) : undefined;
  const blockedCheck = blockedField ? check[blockedField] : null;
  const blockedValue = blockedField ? goals[blockedField] : Number.NaN;

  const blockedTitle = () => {
    if (!blocked || !blockedCheck) return '';
    if (!Number.isFinite(blockedValue)) return `${blocked.label} needs a number. Moo can't count "nothing".`;
    if (blockedCheck.side === 'high') return blockedField === 'proteinG' ? `${commas(blockedValue)} g? Even I can't eat that.` : `${commas(blockedValue)} ${blocked.unit}? That's a whole herd's worth.`;
    return blockedField === 'calories' ? `${commas(blockedValue)} kcal? I'd faint in the field.` : `${commas(blockedValue)} ${blocked.unit} is too low to save.`;
  };

  const useRecommended = () => {
    if (!blockedField || !blockedCheck) return;
    const v = blockedCheck.side === 'high' ? blockedCheck.recommended.max : blockedCheck.recommended.min;
    setDraft((d) => ({ ...d, [blockedField]: String(v) }));
  };

  const noteFor = (k: GoalField, unit: string): { note?: string; tone: 'neutral' | 'warning' | 'bad' } => {
    const c = check[k];
    const range = `${commas(c.recommended.min)}–${commas(c.recommended.max)} ${unit}`;
    if (c.verdict === 'blocked') return { tone: 'bad', note: `Can't save this. Recommended ${range}; Moo accepts ${commas(c.allowed.min)}–${commas(c.allowed.max)} ${unit}.` };
    if (c.verdict === 'high') return { tone: 'warning', note: `On the high side. Recommended ${range}.` };
    if (c.verdict === 'low') return { tone: 'warning', note: `On the low side. Recommended ${range}.` };
    return { tone: 'neutral', note: k === 'proteinG' || k === 'calories' ? `Recommended ${range}` : undefined };
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
      footer={<Button title={check.blocked ? "Can't save that" : dirty ? 'Save goals' : 'Saved'} disabled={check.blocked || !dirty} onPress={save} />}
    >
      {blocked && blockedCheck ? (
        <Note tone="warning">
          <View style={{ alignItems: 'center', gap: spacing.sm }} accessibilityLiveRegion="polite">
            <Cow size={110} pose="shocked" accessibilityLabel="Moo the cow, shocked" />
            <AppText variant="label" center>{blockedTitle()}</AppText>
            <AppText variant="caption" center>
              {`Recommended for you: ${commas(blockedCheck.recommended.min)}–${commas(blockedCheck.recommended.max)} ${blocked.unit} a day.`}
            </AppText>
            <Button title="Use recommended" variant="secondary" onPress={useRecommended} style={{ alignSelf: 'stretch', minHeight: 50 }} />
          </View>
        </Note>
      ) : null}

      {FIELDS.map((f) => (
        <Field key={f.key} label={`${f.label} per day`} value={draft[f.key]} onChangeText={(v) => set(f.key, v)} suffix={f.unit} maxLength={5} {...noteFor(f.key, f.unit)} />
      ))}

      {Number.isFinite(macroKcal) && Number.isFinite(goals.calories) ? (
        <AppText variant="caption">
          {`Your macros add up to about ${commas(macroKcal)} kcal (calorie goal: ${commas(goals.calories)}). They don't have to match exactly.`}
        </AppText>
      ) : null}

      <Button
        title="Recalculate from my details"
        variant="secondary"
        onPress={() => {
          setDraft(toDraft(computeGoals(answers)));
          setRecalculated(true);
        }}
      />
      {recalculated ? <AppText variant="caption" center accessibilityLiveRegion="polite">Fresh numbers from your body details. Tap Save to keep them.</AppText> : null}
      <AppText variant="small" center>Goals are estimates from standard formulas, not medical advice.</AppText>
    </SettingsScreen>
  );
}
