import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { canPhotoScan, FREE_PHOTO_SCANS, presentPaywall, useBilling } from '../../features/billing';
import type { FoodItem } from '../../features/foods';
import { unitGramsOf } from '../../features/foods/amount';
import { PROVIDER_NAME } from '../../features/foods/copy';
import { GramsInput } from '../../features/foods/ui/GramsInput';
import { NutritionFacts } from '../../features/foods/ui/NutritionFacts';
import { useLog } from '../../features/log';
import { analyzePhoto, ScanError } from '../../features/scan/analyze';
import { BarcodeError, lookupBarcodeAnySource } from '../../features/scan/barcode';
import { scansLeftLabel, scansLeftSpoken, type ProblemCode } from '../../features/scan/copy';
import { entryFromItems, toEditable, type EditableItem } from '../../features/scan/totals';
import { CameraStage } from '../../features/scan/ui/CameraStage';
import type { ScanMode } from '../../features/scan/ui/parts';
import { ResultView } from '../../features/scan/ui/ResultView';
import { AnalyzingView, FallbackCapture, LimitView, ProblemView } from '../../features/scan/ui/views';

type Phase =
  | { k: 'capture' }
  | { k: 'analyzing'; kind: ScanMode; uri?: string }
  | { k: 'result'; source: ScanMode; items: EditableItem[]; mock: boolean; uri?: string; food?: FoodItem }
  | { k: 'problem'; code: ProblemCode; retry?: { kind: 'photo'; uri: string } | { kind: 'barcode'; code: string } }
  | { k: 'limit' };

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function ScanScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<ScanMode>(params.mode === 'barcode' ? 'barcode' : 'photo');
  const [phase, setPhase] = useState<Phase>({ k: 'capture' });
  const [saving, setSaving] = useState(false);
  /** Bumped on every new job so a cancelled one cannot overwrite the screen. */
  const job = useRef(0);

  const isPremium = useBilling((s) => s.isPremium);
  const used = useBilling((s) => s.photoScansUsed);
  const allowanceLabel = isPremium ? undefined : scansLeftLabel(FREE_PHOTO_SCANS - used);
  const allowanceSpoken = isPremium ? undefined : scansLeftSpoken(FREE_PHOTO_SCANS - used);

  const backToCapture = useCallback(() => {
    job.current++;
    setPhase({ k: 'capture' });
  }, []);

  const runPhoto = useCallback(async (uri: string) => {
    if (!canPhotoScan(useBilling.getState())) {
      setPhase({ k: 'limit' });
      presentPaywall('scan_limit');
      return;
    }
    const id = ++job.current;
    setPhase({ k: 'analyzing', kind: 'photo', uri });
    try {
      const result = await analyzePhoto(uri);
      if (id !== job.current) return;
      useBilling.getState().recordPhotoScan();
      setPhase({ k: 'result', source: 'photo', items: toEditable(result.items), mock: result.mock, uri });
    } catch (e) {
      if (id !== job.current) return;
      const code = e instanceof ScanError ? e.code : 'server';
      if (code === 'limit') {
        setPhase({ k: 'limit' });
        presentPaywall('scan_limit');
      } else {
        setPhase({ k: 'problem', code, retry: code === 'no_food' || code === 'unauthorized' ? undefined : { kind: 'photo', uri } });
      }
    }
  }, []);

  const runBarcode = useCallback(async (code: string) => {
    const id = ++job.current;
    setPhase({ k: 'analyzing', kind: 'barcode' });
    try {
      const found = await lookupBarcodeAnySource(code);
      if (id !== job.current) return;
      if (found.status === 'found') setPhase({ k: 'result', source: 'barcode', items: toEditable(found.result.items), mock: false, food: found.food });
      else setPhase({ k: 'problem', code: found.status });
    } catch (e) {
      if (id !== job.current) return;
      const c = e instanceof BarcodeError ? e.code : 'server';
      setPhase({ k: 'problem', code: c, retry: c === 'invalid' ? undefined : { kind: 'barcode', code } });
    }
  }, []);

  const pickLibrary = useCallback(async () => {
    if (!canPhotoScan(useBilling.getState())) {
      setPhase({ k: 'limit' });
      presentPaywall('scan_limit');
      return;
    }
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      const uri = picked.canceled ? undefined : picked.assets[0]?.uri;
      if (uri) void runPhoto(uri);
    } catch {
      setPhase({ k: 'problem', code: 'server' });
    }
  }, [runPhoto]);

  const save = useCallback(async (items: EditableItem[], source: ScanMode) => {
    setSaving(true);
    try {
      await useLog.getState().addEntry(entryFromItems(items, source));
      close();
    } catch {
      setSaving(false);
      setPhase({ k: 'problem', code: 'server' });
    }
  }, []);

  const typeItIn = () => router.replace('/entry');

  switch (phase.k) {
    case 'analyzing':
      return <AnalyzingView kind={phase.kind} photoUri={phase.uri} onClose={backToCapture} />;

    case 'result':
      return (
        <ResultView
          items={phase.items}
          source={phase.source}
          mock={phase.mock}
          photoUri={phase.uri}
          saving={saving}
          onChange={(items) => setPhase({ ...phase, items })}
          onSave={() => void save(phase.items, phase.source)}
          onRetake={backToCapture}
          onClose={close}
        >
          {phase.food && phase.items[0] && unitGramsOf(phase.food) ? (
            <>
              <GramsInput servingGrams={unitGramsOf(phase.food)!} servings={phase.items[0].servings} onServings={(servings) => setPhase({ ...phase, items: phase.items.map((i, n) => (n === 0 ? { ...i, servings } : i)) })} />
              {phase.food.panel ? (
                <NutritionFacts panel={phase.food.panel} grams={unitGramsOf(phase.food)! * phase.items[0].servings} source={(phase.food.reliability?.sources ?? [phase.food.provider]).map((p) => PROVIDER_NAME[p]).join(' + ')} />
              ) : null}
            </>
          ) : null}
        </ResultView>
      );

    case 'limit':
      return (
        <LimitView
          onClose={close}
          actions={[
            { title: 'See Premium', onPress: () => presentPaywall('scan_limit') },
            { title: 'Scan barcode', variant: 'secondary', onPress: () => { setMode('barcode'); backToCapture(); } },
          ]}
        />
      );

    case 'problem': {
      const { code, retry } = phase;
      const isBarcodeProblem = code === 'not_found' || code === 'no_nutrition' || code === 'invalid';
      return (
        <ProblemView
          code={code}
          pose={code === 'offline' || code === 'server' ? 'sweat' : 'shrug'}
          onClose={close}
          actions={[
            ...(code === 'unauthorized' ? [{ title: 'Sign in', onPress: () => router.push('/auth') }] : []),
            ...(retry ? [{ title: 'Retry', onPress: () => void (retry.kind === 'photo' ? runPhoto(retry.uri) : runBarcode(retry.code)) }] : []),
            ...(code === 'no_food' ? [{ title: 'Retake', onPress: backToCapture }] : []),
            ...(isBarcodeProblem && code !== 'invalid' ? [{ title: 'Type instead', onPress: typeItIn }] : []),
            ...(code !== 'no_food'
              ? [code === 'invalid' ? { title: 'Retry', onPress: backToCapture } : { title: 'Back', variant: 'ghost' as const, onPress: backToCapture }]
              : [{ title: 'Type instead', variant: 'ghost' as const, onPress: typeItIn }]),
          ]}
        />
      );
    }

    case 'capture':
      return Platform.OS === 'web' ? (
        <FallbackCapture mode={mode} onModeChange={setMode} onClose={close} onPickLibrary={() => void pickLibrary()} onBarcode={(c) => void runBarcode(c)} allowanceLabel={allowanceLabel} allowanceSpoken={allowanceSpoken} />
      ) : (
        <CameraStage
          mode={mode}
          onModeChange={setMode}
          onClose={close}
          onPhoto={(uri) => void runPhoto(uri)}
          onBarcode={(c) => void runBarcode(c)}
          onPickLibrary={() => void pickLibrary()}
          allowanceLabel={allowanceLabel}
          allowanceSpoken={allowanceSpoken}
        />
      );
  }
}
