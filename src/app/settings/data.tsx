import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share } from 'react-native';

import { AppText } from '../../components';
import { useLog } from '../../features/log';
import { syncReminders } from '../../features/reminders';
import { buildExport, exportFileName } from '../../features/settings/export';
import { ConfirmModal, Group, Row, SettingsScreen } from '../../features/settings/ui';
import { Cow } from '../../mascot';
import { useProfile } from '../../state/profile';

function downloadOnWeb(fileName: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DataSettings() {
  const entryCount = useLog((s) => s.entries.length);
  const weightCount = useLog((s) => s.weightLogs.length);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async () => {
    setMessage(null);
    try {
      const { answers, goals, units, creatine, mealReminders } = useProfile.getState();
      const { entries, creatineLogs, weightLogs } = useLog.getState();
      const now = new Date();
      const json = JSON.stringify(buildExport({ profile: { answers, goals, units, creatine, mealReminders }, entries, creatineLogs, weightLogs }, now), null, 2);
      if (Platform.OS === 'web') {
        downloadOnWeb(exportFileName(now), json);
        setMessage('Exported');
      } else {
        const res = await Share.share({ title: exportFileName(now), message: json });
        if (res.action === Share.sharedAction) setMessage('Exported');
      }
    } catch {
      setMessage("Couldn't export. Try again.");
    }
  };

  const erase = async () => {
    setBusy(true);
    setError(null);
    try {
      await useLog.getState().clearAll();
      useProfile.getState().resetProfile();
      await syncReminders();
      setConfirming(false);
      // Onboarding is no longer complete: leave Settings so setup starts again.
      router.replace('/');
    } catch {
      setError("Couldn't erase. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsScreen title="Your data">
      <Group>
        <Row label="Food entries" value={String(entryCount)} />
        <Row label="Weigh-ins" value={String(weightCount)} />
      </Group>

      <Group>
        <Row emoji="📤" label="Export" accessibilityLabel="Export my data" onPress={() => void exportData()} />
      </Group>
      {message ? <AppText variant="caption" center accessibilityLiveRegion="polite">{message}</AppText> : null}

      <Group>
        <Row emoji="🧹" label="Erase this device" accessibilityLabel="Erase all data on this device" danger onPress={() => { setError(null); setConfirming(true); }} />
      </Group>

      <ConfirmModal
        visible={confirming}
        top={<Cow size={96} pose="shocked" accessibilityLabel="Moo the cow, shocked" />}
        title="Erase everything?"
        body="Can't be undone."
        confirmLabel="Erase"
        busy={busy}
        error={error}
        onConfirm={() => void erase()}
        onCancel={() => setConfirming(false)}
      />
    </SettingsScreen>
  );
}
