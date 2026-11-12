/** Non-camera states of the scan flow: fallback capture, analysing, problems, out of scans. */
import { useState, type ReactNode } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Screen } from '../../../components';
import { Cow, type CowPose } from '../../../mascot';
import { colors, fonts, radius, spacing } from '../../../theme';
import { OUT_OF_SCANS, PROBLEMS, WORKING, type ProblemCode } from '../copy';
import { CloseButton, ModeToggle, Pill, type ScanMode } from './parts';

function Shell({ onClose, right, children, footer }: { onClose: () => void; right?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <Screen footer={footer}>
      <View style={styles.header}>
        <CloseButton onPress={onClose} />
        {right}
      </View>
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

export interface FallbackCaptureProps {
  mode: ScanMode;
  onModeChange: (m: ScanMode) => void;
  onClose: () => void;
  onPickLibrary: () => void;
  onBarcode: (code: string) => void;
  /** e.g. "3 left"; hidden for premium. */
  allowanceLabel?: string;
  allowanceSpoken?: string;
}

/** Shown on web and wherever there is no camera to use. */
export function FallbackCapture({ mode, onModeChange, onClose, onPickLibrary, onBarcode, allowanceLabel, allowanceSpoken }: FallbackCaptureProps) {
  const [code, setCode] = useState('');
  const isBarcode = mode === 'barcode';
  return (
    <Shell
      onClose={onClose}
      right={!isBarcode && allowanceLabel ? <Pill text={allowanceLabel} accessibilityLabel={allowanceSpoken} /> : null}
      footer={
        isBarcode ? (
          <Button title="Look up" disabled={code.trim().length === 0} onPress={() => onBarcode(code)} testID="barcode-lookup" />
        ) : (
          <Button title="Choose photo" onPress={onPickLibrary} testID="choose-photo" />
        )
      }
    >
      <Cow size={220} pose={isBarcode ? 'idle' : 'wave'} />
      {isBarcode ? (
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^\d\s-]/g, ''))}
          onSubmitEditing={() => (code.trim() ? onBarcode(code) : undefined)}
          accessibilityLabel="Barcode number"
          placeholder="Barcode number"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="search"
          maxLength={18}
          style={styles.codeInput}
          testID="barcode-input"
        />
      ) : (
        <AppText variant="heading" center accessibilityRole="header">No camera</AppText>
      )}
      <ModeToggle mode={mode} onChange={onModeChange} />
    </Shell>
  );
}

export function AnalyzingView({ kind, photoUri, onClose }: { kind: ScanMode; photoUri?: string; onClose: () => void }) {
  const spoken = kind === 'photo' ? 'Analysing your photo' : 'Looking up the barcode';
  return (
    <Shell onClose={onClose}>
      {photoUri ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: photoUri }} style={styles.photo} accessibilityIgnoresInvertColors accessibilityLabel="Your photo" />
          <View style={styles.cowBadge}>
            <Cow size={170} pose="chew" accessibilityLabel="Moo is chewing it over" />
          </View>
        </View>
      ) : (
        <Cow size={240} pose="chew" accessibilityLabel="Moo is chewing it over" />
      )}
      <View accessibilityLiveRegion="polite" accessibilityRole="progressbar" accessibilityLabel={spoken} style={photoUri ? { marginTop: spacing.xl } : null}>
        <AppText variant="heading" center style={{ fontSize: 24 }}>{WORKING}</AppText>
      </View>
    </Shell>
  );
}

export interface ProblemAction {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

function Stuck({ line, pose, actions, onClose }: { line: string; pose: CowPose; actions: ProblemAction[]; onClose: () => void }) {
  return (
    <Shell onClose={onClose} footer={<>{actions.map((a) => <Button key={a.title} title={a.title} variant={a.variant ?? 'primary'} onPress={a.onPress} />)}</>}>
      <Cow size={220} pose={pose} />
      <AppText variant="heading" center accessibilityRole="header" testID="scan-problem">{line}</AppText>
    </Shell>
  );
}

export function ProblemView({ code, pose = 'shrug', actions, onClose }: { code: ProblemCode; pose?: CowPose; actions: ProblemAction[]; onClose: () => void }) {
  return <Stuck line={PROBLEMS[code]} pose={pose} actions={actions} onClose={onClose} />;
}

export function LimitView({ actions, onClose }: { actions: ProblemAction[]; onClose: () => void }) {
  return <Stuck line={OUT_OF_SCANS} pose="shrug" actions={actions} onClose={onClose} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  codeInput: {
    alignSelf: 'stretch', minHeight: 60, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, fontFamily: fonts.bold, fontSize: 22, letterSpacing: 1, color: colors.text, textAlign: 'center',
  },
  photoWrap: { width: 260, height: 260, marginBottom: spacing.lg },
  photo: { width: 260, height: 260, borderRadius: 36, backgroundColor: colors.surfaceAlt, borderWidth: 4, borderColor: colors.surface },
  cowBadge: { position: 'absolute', bottom: -56, right: -28 },
});
