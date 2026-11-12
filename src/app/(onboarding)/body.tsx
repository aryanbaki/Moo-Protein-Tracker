import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { WheelPicker } from '../../components/WheelPicker';
import { FALLBACKS, cmToFtIn, cmToIn, inToCm, kgToLb, lbToKg } from '../../features/goals';
import { OnboardingScaffold, Segmented, nearest, range, useOnboardingNav } from '../../features/onboarding';
import { useProfile } from '../../state/profile';
import { spacing } from '../../theme';
import type { Units } from '../../types';

const CM = range(120, 220, 1);
const INCHES = range(48, 87, 1);
const KG = range(30, 250, 1);
const LB = range(66, 550, 1);

const UNIT_OPTIONS = [
  { value: 'imperial', label: 'ft · lb' },
  { value: 'metric', label: 'cm · kg' },
] as const;

const feetInches = (inches: number) => {
  const { ft, in: i } = cmToFtIn(inToCm(inches));
  return `${ft}'${i}"`;
};

export default function BodyStep() {
  const { next } = useOnboardingNav('body', { record: false });
  const units = useProfile((s) => s.units);
  const setUnits = useProfile((s) => s.setUnits);
  const setAnswers = useProfile((s) => s.setAnswers);
  const saved = useProfile((s) => s.answers);
  // Always held in cm / kg; the wheels only translate for display.
  const [heightCm, setHeightCm] = useState(saved.heightCm ?? FALLBACKS.heightCm);
  const [weightKg, setWeightKg] = useState(saved.weightKg ?? FALLBACKS.weightKg);

  const metric = units === 'metric';
  const heightValue = useMemo(() => (metric ? nearest(CM, heightCm) : nearest(INCHES, cmToIn(heightCm))), [metric, heightCm]);
  const weightValue = useMemo(() => (metric ? nearest(KG, weightKg) : nearest(LB, kgToLb(weightKg))), [metric, weightKg]);

  return (
    <OnboardingScaffold
      step="body"
      title="Height and weight"
      subtitle="Ballpark is fine. You can change these later."
      cowLine={metric ? "I'm 635 kg. Zero judgement here." : "I'm 1,400 lb. Zero judgement here."}
      cowPose="idle"
      cowSize={104}
      onContinue={() => {
        setAnswers({ heightCm: Math.round(heightCm * 10) / 10, weightKg: Math.round(weightKg * 10) / 10 });
        next();
      }}
    >
      <Segmented<Units> accessibilityLabel="Units" options={UNIT_OPTIONS} value={units} onChange={setUnits} />
      {/* key: remount the wheels when the unit system (and so the value list) changes */}
      <View key={units} style={styles.wheels}>
        <View style={styles.col}>
          <AppText variant="caption" center>
            Height
          </AppText>
          <WheelPicker
            testID="wheel-height"
            values={metric ? CM : INCHES}
            value={heightValue}
            onChange={(v) => setHeightCm(metric ? v : inToCm(v))}
            format={metric ? (v) => `${v} cm` : feetInches}
            accessibilityLabel="Height"
            accessibilityValueText={metric ? (v) => `${v} centimetres` : (v) => `${Math.floor(v / 12)} feet ${v % 12} inches`}
            style={styles.wheel}
          />
        </View>
        <View style={styles.col}>
          <AppText variant="caption" center>
            Weight
          </AppText>
          <WheelPicker
            testID="wheel-weight"
            values={metric ? KG : LB}
            value={weightValue}
            onChange={(v) => setWeightKg(metric ? v : lbToKg(v))}
            format={(v) => `${v} ${metric ? 'kg' : 'lb'}`}
            accessibilityLabel="Weight"
            accessibilityValueText={(v) => `${v} ${metric ? 'kilograms' : 'pounds'}`}
            style={styles.wheel}
          />
        </View>
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  wheels: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  col: { flex: 1, maxWidth: 170, gap: spacing.xs },
  wheel: { alignSelf: 'stretch' },
});
