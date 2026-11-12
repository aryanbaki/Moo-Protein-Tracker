import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, OptionCard } from '../../components';
import { cmToFtIn, computeGoals, ftInToCm, kgToLb, lbToKg } from '../../features/goals';
import { parseNumber } from '../../features/settings/export';
import { Field, Note, Segmented, SettingsScreen } from '../../features/settings/ui';
import { useProfile } from '../../state/profile';
import { spacing } from '../../theme';
import type { GymDays, MainGoal, Sex } from '../../types';

const MAIN_GOALS: { value: MainGoal; title: string; emoji: string }[] = [
  { value: 'build_muscle', title: 'Build muscle', emoji: '💪' },
  { value: 'lose_fat', title: 'Lose fat', emoji: '🔥' },
  { value: 'maintain', title: 'Maintain', emoji: '⚖️' },
  { value: 'eat_better', title: 'Eat better', emoji: '🥗' },
];
const GYM_DAYS: { value: GymDays; label: string }[] = [
  { value: '0-1', label: '0–1' },
  { value: '2-3', label: '2–3' },
  { value: '4-5', label: '4–5' },
  { value: '6+', label: '6+' },
];

const one = (n: number) => String(Math.round(n * 10) / 10);

export default function BodySettings() {
  const answers = useProfile((s) => s.answers);
  const goals = useProfile((s) => s.goals);
  const units = useProfile((s) => s.units);
  const setAnswers = useProfile((s) => s.setAnswers);
  const metric = units === 'metric';
  const thisYear = new Date().getFullYear();

  const startFtIn = answers.heightCm ? cmToFtIn(answers.heightCm) : null;
  const [year, setYear] = useState(answers.birthYear ? String(answers.birthYear) : '');
  const [cm, setCm] = useState(answers.heightCm ? String(Math.round(answers.heightCm)) : '');
  const [ft, setFt] = useState(startFtIn ? String(startFtIn.ft) : '');
  const [inch, setInch] = useState(startFtIn ? String(startFtIn.in) : '');
  const [weight, setWeight] = useState(answers.weightKg ? one(metric ? answers.weightKg : kgToLb(answers.weightKg)) : '');
  const [applied, setApplied] = useState(false);

  const touch = () => setApplied(false);

  const yearNum = parseNumber(year);
  const yearOk = yearNum !== null && Number.isInteger(yearNum) && yearNum >= thisYear - 110 && yearNum <= thisYear - 13;
  const onYear = (t: string) => {
    const clean = t.replace(/[^\d]/g, '');
    setYear(clean);
    touch();
    const n = Number(clean);
    if (clean.length === 4 && n >= thisYear - 110 && n <= thisYear - 13) setAnswers({ birthYear: n });
  };

  const heightCm = metric ? parseNumber(cm) : parseNumber(ft) !== null ? ftInToCm(parseNumber(ft) ?? 0, parseNumber(inch) ?? 0) : null;
  const heightOk = heightCm !== null && heightCm >= 100 && heightCm <= 250 && (metric || (parseNumber(inch) ?? 0) < 12);
  const commitHeight = (nextCm: number | null, inchesOk = true) => {
    touch();
    if (nextCm !== null && inchesOk && nextCm >= 100 && nextCm <= 250) setAnswers({ heightCm: Math.round(nextCm * 10) / 10 });
  };

  const weightNum = parseNumber(weight);
  const weightKg = weightNum === null ? null : metric ? weightNum : lbToKg(weightNum);
  const weightOk = weightKg !== null && weightKg >= 25 && weightKg <= 350;
  const onWeight = (t: string) => {
    setWeight(t);
    touch();
    const n = parseNumber(t);
    const kg = n === null ? null : metric ? n : lbToKg(n);
    if (kg !== null && kg >= 25 && kg <= 350) setAnswers({ weightKg: Math.round(kg * 100) / 100 });
  };

  const suggested = computeGoals(answers);
  const differs = !goals || suggested.proteinG !== goals.proteinG || suggested.calories !== goals.calories || suggested.carbsG !== goals.carbsG || suggested.fatG !== goals.fatG;

  return (
    <SettingsScreen title="Body details">
      <AppText variant="label">Sex</AppText>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(['male', 'female'] as Sex[]).map((s) => (
          <View key={s} style={{ flex: 1 }}>
            <OptionCard title={s === 'male' ? 'Male' : 'Female'} selected={answers.sex === s} onPress={() => { setAnswers({ sex: s }); touch(); }} />
          </View>
        ))}
      </View>

      <Field label="Birth year" value={year} onChangeText={onYear} maxLength={4} placeholder="1998" tone={year !== '' && !yearOk ? 'bad' : 'neutral'} note={year !== '' && !yearOk ? `${thisYear - 110}–${thisYear - 13}` : undefined} />

      {metric ? (
        <Field label="Height" value={cm} suffix="cm" maxLength={3} placeholder="175" onChangeText={(t) => { const c = t.replace(/[^\d]/g, ''); setCm(c); commitHeight(parseNumber(c)); }} tone={cm !== '' && !heightOk ? 'bad' : 'neutral'} note={cm !== '' && !heightOk ? '100–250 cm' : undefined} />
      ) : (
        <View style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Field label="Height" value={ft} suffix="ft" maxLength={1} placeholder="5" onChangeText={(t) => { const c = t.replace(/[^\d]/g, ''); setFt(c); const f = parseNumber(c); const i = parseNumber(inch) ?? 0; commitHeight(f === null ? null : ftInToCm(f, i), i < 12); }} tone={ft !== '' && !heightOk ? 'bad' : 'neutral'} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label=" " accessibilityLabel="Height" value={inch} suffix="in" maxLength={2} placeholder="9" onChangeText={(t) => { const c = t.replace(/[^\d]/g, ''); setInch(c); const f = parseNumber(ft); const i = parseNumber(c) ?? 0; commitHeight(f === null ? null : ftInToCm(f, i), i < 12); }} tone={ft !== '' && !heightOk ? 'bad' : 'neutral'} />
            </View>
          </View>
          {ft !== '' && !heightOk ? <AppText variant="caption">⛔ 3 ft 4 in – 8 ft 2 in</AppText> : null}
        </View>
      )}

      <Field label="Weight" value={weight} suffix={metric ? 'kg' : 'lb'} keyboardType="decimal-pad" placeholder={metric ? '80' : '176'} onChangeText={onWeight} tone={weight !== '' && !weightOk ? 'bad' : 'neutral'} note={weight !== '' && !weightOk ? (metric ? '25–350 kg' : '56–771 lb') : undefined} />

      <AppText variant="label">Goal</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel="Main goal" style={{ gap: spacing.sm }}>
        {MAIN_GOALS.map((g) => (
          <OptionCard key={g.value} title={g.title} emoji={g.emoji} selected={answers.mainGoal === g.value} onPress={() => { setAnswers({ mainGoal: g.value }); touch(); }} />
        ))}
      </View>

      <AppText variant="label">Gym days</AppText>
      <Segmented accessibilityLabel="Gym days per week" options={GYM_DAYS} value={answers.gymDays ?? ('' as GymDays)} onChange={(v) => { setAnswers({ gymDays: v }); touch(); }} />

      {applied ? (
        <Note tone="good">Goals updated</Note>
      ) : differs ? (
        <Note tone="good">
          <AppText variant="label" center accessibilityLabel={`Suggested goals: ${suggested.proteinG} grams protein, ${suggested.calories} calories, ${suggested.carbsG} grams carbs, ${suggested.fatG} grams fat`}>
            {`${suggested.proteinG} g protein · ${String(suggested.calories).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} kcal`}
          </AppText>
          <Button title="Update goals" accessibilityLabel="Use suggested goals" variant="secondary" style={{ minHeight: 50, marginTop: spacing.xs }} onPress={() => { useProfile.getState().setGoals(suggested); setApplied(true); }} />
        </Note>
      ) : null}
    </SettingsScreen>
  );
}
