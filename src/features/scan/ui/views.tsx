/** Non-camera states of the scan flow: fallback capture, analysing, problems, out of scans. */
import { useEffect, useState, type ReactNode } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Screen } from '../../../components';
import { Cow, type CowPose } from '../../../mascot';
import { colors, fonts, radius, spacing } from '../../../theme';
import { BARCODE_LINES, CHEW_LINES, PROBLEMS, type ProblemCode } from '../copy';
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
  allowanceLabel?: string;
}

/** Shown on web and wherever there is no camera to use. */
export function FallbackCapture({ mode, onModeChange, onClose, onPickLibrary, onBarcode, allowanceLabel }: FallbackCaptureProps) {
  const [code, setCode] = useState('');
  const isBarcode = mode === 'barcode';
  return (
    <Shell
      onClose={onClose}
      right={!isBarcode && allowanceLabel ? <Pill text={allowanceLabel} /> : null}
      footer={
        isBarcode ? (
          <Button title="Look it up" disabled={code.trim().length === 0} onPress={() => onBarcode(code)} />
        ) : (
          <Button title="Choose a photo" onPress={onPickLibrary} />
        )
      }
    >
      <Cow size={170} pose={isBarcode ? 'idle' : 'wave'} />
      <AppText variant="heading" center>{isBarcode ? 'Type the barcode' : 'No camera here'}</AppText>
      <AppText variant="body" center color={colors.textSecondary}>
        {isBarcode
          ? 'Enter the number printed under the stripes and Moo will look it up. Always free.'
          : "No worries. Pick a photo of your meal and I'll chew it over."}
      </AppText>
      {isBarcode ? (
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^\d\s-]/g, ''))}
          onSubmitEditing={() => (code.trim() ? onBarcode(code) : undefined)}
          accessibilityLabel="Barcode number"
          placeholder="e.g. 3017620422003"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="search"
          maxLength={18}
          style={styles.codeInput}
        />
      ) : null}
      <ModeToggle mode={mode} onChange={onModeChange} />
    </Shell>
  );
}

export function AnalyzingView({ kind, photoUri, onClose }: { kind: ScanMode; photoUri?: string; onClose: () => void }) {
  const lines = kind === 'photo' ? CHEW_LINES : BARCODE_LINES;
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % lines.length), 1600);
    return () => clearInterval(t);
  }, [lines.length]);

  return (
    <Shell onClose={onClose}>
      <View style={styles.photoWrap}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} accessibilityIgnoresInvertColors accessibilityLabel="Your photo" />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]} />
        )}
        <View style={styles.cowBadge}>
          <Cow size={150} pose="chew" accessibilityLabel="Moo is chewing it over" />
        </View>
      </View>
      <View accessibilityLiveRegion="polite" accessibilityRole="progressbar" accessibilityLabel={lines[index]} style={{ marginTop: spacing.xl }}>
        <AppText variant="heading" center style={{ fontSize: 24 }}>{lines[index]}</AppText>
      </View>
      <AppText variant="caption" center>{kind === 'photo' ? 'This usually takes a few seconds.' : 'Asking Open Food Facts.'}</AppText>
    </Shell>
  );
}

export interface ProblemAction {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function ProblemView({ code, pose = 'shrug', actions, onClose }: { code: ProblemCode; pose?: CowPose; actions: ProblemAction[]; onClose: () => void }) {
  const copy = PROBLEMS[code];
  return (
    <Shell onClose={onClose} footer={<>{actions.map((a) => <Button key={a.title} title={a.title} variant={a.variant ?? 'primary'} onPress={a.onPress} />)}</>}>
      <Cow size={180} pose={pose} />
      <AppText variant="heading" center accessibilityRole="header">{copy.title}</AppText>
      <AppText variant="body" center color={colors.textSecondary}>{copy.body}</AppText>
    </Shell>
  );
}

export function LimitView({ actions, onClose }: { actions: ProblemAction[]; onClose: () => void }) {
  return (
    <Shell onClose={onClose} footer={<>{actions.map((a) => <Button key={a.title} title={a.title} variant={a.variant ?? 'primary'} onPress={a.onPress} />)}</>}>
      <Cow size={180} pose="shrug" />
      <AppText variant="heading" center accessibilityRole="header">Out of free scans</AppText>
      <AppText variant="body" center color={colors.textSecondary}>
        {"You've used your 3 free photo scans. Moo Premium has unlimited scans. Barcodes and typing it in are always free."}
      </AppText>
    </Shell>
  );
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
  photoEmpty: { backgroundColor: colors.primarySoft },
  cowBadge: { position: 'absolute', bottom: -56, right: -28 },
});
