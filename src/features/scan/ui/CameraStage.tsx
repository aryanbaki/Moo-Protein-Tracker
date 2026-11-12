/** Native camera stage: live preview, frame guide, shutter, library, mode toggle, permission states. */
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Screen } from '../../../components';
import { Cow } from '../../../mascot';
import { colors, fonts, radius, spacing } from '../../../theme';
import { CloseButton, ModeToggle, Pill, type ScanMode } from './parts';

export interface CameraStageProps {
  mode: ScanMode;
  onModeChange: (m: ScanMode) => void;
  onClose: () => void;
  onPhoto: (uri: string) => void;
  onBarcode: (code: string) => void;
  onPickLibrary: () => void;
  /** e.g. "2 free scans left"; hidden for premium. */
  allowanceLabel?: string;
}

/** Ignore repeat reads of the same code for this long. */
const BARCODE_DEBOUNCE_MS = 2500;

export function CameraStage({ mode, onModeChange, onClose, onPhoto, onBarcode, onPickLibrary, allowanceLabel }: CameraStageProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mountFailed, setMountFailed] = useState(false);
  const lastScan = useRef<{ code: string; at: number }>({ code: '', at: 0 });

  const shoot = useCallback(async () => {
    if (busy || !ready) return;
    setBusy(true);
    try {
      const picture = await camera.current?.takePictureAsync({ quality: 0.8 });
      if (picture?.uri) onPhoto(picture.uri);
    } catch {
      // A failed capture just leaves the user on the camera to try again.
    } finally {
      setBusy(false);
    }
  }, [busy, ready, onPhoto]);

  const handleBarcode = useCallback(
    (r: BarcodeScanningResult) => {
      const now = Date.now();
      if (!r.data || now - lastScan.current.at < BARCODE_DEBOUNCE_MS) return;
      lastScan.current = { code: r.data, at: now };
      onBarcode(r.data);
    },
    [onBarcode],
  );

  if (!permission) return <View style={styles.dark} />;

  if (!permission.granted || mountFailed) {
    const blocked = !permission.granted && !permission.canAskAgain;
    return (
      <Screen
        footer={
          <>
            {mountFailed ? null : blocked ? (
              <Button title="Open settings" onPress={() => void Linking.openSettings()} />
            ) : (
              <Button title="Allow camera" onPress={() => void requestPermission()} />
            )}
            {mode === 'photo' ? <Button title="Pick from library" variant="secondary" onPress={onPickLibrary} /> : null}
          </>
        }
      >
        <View style={styles.permHeader}>
          <CloseButton onPress={onClose} />
        </View>
        <View style={styles.permBody}>
          <Cow size={180} pose={blocked || mountFailed ? 'shrug' : 'wave'} />
          <AppText variant="heading" center>
            {mountFailed ? "The camera won't start" : blocked ? 'Camera is switched off' : 'Can I borrow your camera?'}
          </AppText>
          <AppText variant="body" center color={colors.textSecondary}>
            {mountFailed
              ? 'You can still pick a photo from your library.'
              : blocked
                ? 'Moo needs the camera to scan food and barcodes. You can turn it on in Settings.'
                : 'Moo uses the camera to scan your food and read barcodes. Photos are only used to estimate nutrition.'}
          </AppText>
          <ModeToggle mode={mode} onChange={onModeChange} />
        </View>
      </Screen>
    );
  }

  const isBarcode = mode === 'barcode';
  return (
    <View style={styles.dark}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setReady(true)}
        onMountError={() => setMountFailed(true)}
        barcodeScannerSettings={isBarcode ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] } : undefined}
        onBarcodeScanned={isBarcode ? handleBarcode : undefined}
      />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.top}>
          <CloseButton dark onPress={onClose} />
          {!isBarcode && allowanceLabel ? <Pill tone="dark" text={allowanceLabel} /> : null}
        </View>

        <View style={styles.guideWrap} pointerEvents="none">
          <View style={[styles.guide, isBarcode ? styles.guideBarcode : null]} />
          <Pill tone="dark" text={isBarcode ? 'Line up the barcode' : 'Fit your food in the frame'} style={{ marginTop: spacing.md }} />
        </View>

        <View style={styles.bottom}>
          <ModeToggle dark mode={mode} onChange={onModeChange} />
          <View style={styles.controls}>
            <View style={styles.side}>
              {!isBarcode ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Pick from library" onPress={onPickLibrary} style={styles.library}>
                  <Text style={styles.libraryGlyph}>▦</Text>
                </Pressable>
              ) : null}
            </View>
            {!isBarcode ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take photo"
                accessibilityState={{ disabled: busy || !ready }}
                disabled={busy || !ready}
                onPress={() => void shoot()}
                style={({ pressed }) => [styles.shutter, { opacity: busy || !ready ? 0.5 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
              >
                <View style={styles.shutterInner} />
              </Pressable>
            ) : (
              <View style={styles.shutterSpace}>
                <AppText variant="caption" center color={colors.textOnPrimary}>Barcode scans are always free</AppText>
              </View>
            )}
            <View style={styles.side} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  guideWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  guide: { width: '100%', maxWidth: 340, aspectRatio: 1, borderRadius: 36, borderWidth: 4, borderColor: 'rgba(255,255,255,0.9)' },
  guideBarcode: { aspectRatio: 1.7, borderRadius: radius.lg },
  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 84 },
  side: { width: 56, alignItems: 'center' },
  library: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  libraryGlyph: { fontFamily: fonts.bold, fontSize: 24, color: colors.textOnPrimary },
  shutter: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface },
  shutterSpace: { flex: 1, minHeight: 84, justifyContent: 'center' },
  permHeader: { flexDirection: 'row' },
  permBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
